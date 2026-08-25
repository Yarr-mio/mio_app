import {
  endSession,
  fetchActiveSession,
  fetchSessionSummary,
  startSession,
  submitCbtEmotionScore,
} from '@/api/endpoints/chat';
import {
  invalidateReportQueries,
  invalidateTodoRelatedQueries,
} from '@/api/invalidateReportQueries';
import { queryKeys } from '@/api/queryKeys';
import {
  HTTP_STATUS,
  SESSION_SUMMARY_CACHE_GC_TIME_MS,
  SESSION_SUMMARY_POLL_INTERVAL_MS,
  SESSION_SUMMARY_RETRY_COUNT,
} from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import {
  pushSessionSummaryOnce,
  skipSessionSummaryNavigation,
} from '@/features/chat/services/sessionSummaryNavigation';
import { useChatStore } from '@/features/chat/store/chatStore';
import { toOpeningChatMessage } from '@/features/chat/utils/chatMessage';
import { isSessionWithoutUserMessage } from '@/features/chat/utils/sessionActivity';
import type { ActiveSessionResponse, SummaryStatus } from '@/types/chat';
import { isClientErrorStatus, readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';
import { storage } from '@/utils/storage';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';

export function useActiveSession() {
  const queryClient = useQueryClient();

  // 화면을 띄워둔 채 30분 idle 자동종료 등 서버측 비동기 종료가 일어나면 클라이언트는 알 길이 없으므로,
  // 포그라운드로 돌아올 때마다 강제로 재조회해 생존 여부를 다시 확인한다
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
      }
    });

    return () => subscription.remove();
  }, [queryClient]);

  return useQuery({
    queryKey: queryKeys.chat.activeSession(),
    queryFn: fetchActiveSession,
  });
}

export function useStartChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      // 새 세션 시작 직전에 조회된 last_ended_session_id를 직전 세션으로 캡처 (요약 화면 감정 변화율 계산용)
      const previousActiveSession = queryClient.getQueryData<ActiveSessionResponse>(
        queryKeys.chat.activeSession()
      );
      useChatStore.getState().startSession(data.session_id, data.character_id, {
        previousSessionId: previousActiveSession?.last_ended_session_id,
        // 서버가 신규 세션에 붙여준 선제 인사를 첫 AI 말풍선으로 시딩 (없으면 null → 말풍선 0건)
        openingMessage: toOpeningChatMessage(data.initial_message),
        origin: 'created',
      });
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.FORBIDDEN && errorCode === 'ONBOARDING_REQUIRED') {
        Alert.alert('온보딩이 필요해요', '먼저 캐릭터 선택을 마치면 대화를 시작할 수 있어요.', [
          { text: '확인', onPress: () => router.replace(AUTH_ROUTES.signupCharacter) },
        ]);
        return;
      }

      if (status === HTTP_STATUS.CONFLICT && errorCode === 'SESSION_ALREADY_ACTIVE') {
        Alert.alert('이미 진행 중인 대화가 있어요', '기존 대화로 이동할게요.', [
          {
            text: '확인',
            onPress: () =>
              queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() }),
          },
        ]);
        return;
      }

      Alert.alert('대화 시작 실패', '잠시 후 다시 시도해 주세요.');
    },
  });
}

/**
 * activeSession 캐시를 "종료가 반영된" 상태로 앞당겨 써넣는다 — 서버 리페치가 도착하기 전까지
 * 캐시는 종료 전 상태라, 그 창 안에서 phase를 'idle'로 되돌리면 chat/index가 낡은 캐시를 보고
 * 죽은 세션을 되살린다.
 *
 * ⚠️ 무입력 갈래 전용이다. 정상 종료에 쓰면 chat/index의 `sessionPhase === 'ended'` 분기가 열려
 * releaseSessionSummaryNavigation() → 같은 세션 재push로 요약 화면 이중 노출이 되살아난다(1fbece0).
 */
function markActiveSessionEnded(
  queryClient: QueryClient,
  sessionId: string,
  summaryStatus: SummaryStatus
): void {
  queryClient.setQueryData<ActiveSessionResponse>(queryKeys.chat.activeSession(), (previous) =>
    previous
      ? {
          ...previous,
          session_id: null,
          character_id: null,
          status: null,
          started_at: null,
          last_message_at: null,
          message_count: null,
          last_ended_session_id: sessionId,
          last_summary_status: summaryStatus,
        }
      : previous
  );
}

export function useEndChatSession() {
  const queryClient = useQueryClient();

  /**
   * 사용자 메시지가 한 건도 없는 세션 — 요약할 것이 없다는 사실을 종료 시점에 이미 알고 있으므로
   * 요약 화면을 아예 띄우지 않고 곧바로 시작 화면으로 되돌린다(서버로 보내는 POST /end는 그대로다).
   *
   * ⚠️ 아래 순서가 곧 사양이다:
   * ① claim은 **동기**로 잡아야 한다 — 영속 가드(②)는 비동기라 chat/index의 재진입 리다이렉트와 경합한다
   * ② 영속 가드까지 기록해야 앱 재실행 후 리다이렉트 경로도 닫힌다
   * ④ 캐시 갱신이 ⑥ reset()보다 **앞에** 와야 한다 — 뒤로 가면 낡은 캐시 + phase 'idle' 조합으로
   *    chat/index가 죽은 세션을 되살린다
   *
   * invalidateTodoRelatedQueries()는 호출하지 않는다 — 대화가 없으면 todo·리포트가 생길 수 없다.
   */
  function handleUntouchedSessionEnded(sessionId: string, summaryStatus: SummaryStatus) {
    skipSessionSummaryNavigation(sessionId);
    void storage.chatRedirectedSessionId.set(sessionId);
    queryClient.removeQueries({ queryKey: queryKeys.chat.sessionMessages(sessionId) });
    markActiveSessionEnded(queryClient, sessionId, summaryStatus);
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
    // phase를 'ended'가 아니라 'idle'로 되돌린다 — 'ended'면 chat/index가 빈 배경을 그려,
    // 대기 화면 대신 빈 화면이 스칠 뿐이다. 목표는 중간 화면 0장이다
    useChatStore.getState().reset();
  }

  /** 대화가 오간 세션 — 요약 화면으로 보낸다. */
  function handleSummarizableSessionEnded(sessionId: string) {
    useChatStore.getState().endSession();
    // 복호화된 상담 대화 원문을 세션 종료 후까지 캐시에 들고 있을 이유가 없다
    // (서버도 보존 기간 후 원문을 삭제한다 — MIO-Session-005)
    queryClient.removeQueries({ queryKey: queryKeys.chat.sessionMessages(sessionId) });
    // 종료된 세션이 activeSession 캐시(staleTime 5분)에 남아있으면, 그 안에 chat/index.tsx가 새로
    // 마운트될 때 이미 끝난 세션을 다시 활성 세션으로 착각해 startSession()을 재호출할 수 있다
    // (chat-trouble-shoot/08 원인 E)
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
    // 세션 종료 후 Todo 및 리포트 캐시 무효화
    void invalidateTodoRelatedQueries(queryClient);
    // SessionEnd의 dismissAll()이 스택 루트(index)로 돌아간다는 전제를 깨지 않기 위해 push 유지 —
    // 뒤로가기 차단은 SessionSummary/SessionEnd의 beforeRemove 리스너가 담당.
    // chat/index.tsx의 재진입 리다이렉트가 같은 세션으로 또 push해 요약 화면이 두 장 쌓이지 않도록
    // 세션 단위 가드를 거친다
    pushSessionSummaryOnce(sessionId);
  }

  /**
   * 성공·410·404가 모두 지나는 공통 진입점 — 갈래를 여기 한 곳에 닫아둔다. 호출부(ChatMain)로
   * 판별을 올리면 UI가 세션 수명 정책을 알게 되어 SRP가 깨진다.
   *
   * ⚠️ 판별은 스토어를 읽으므로 reset()/endSession()보다 반드시 먼저 와야 한다.
   */
  function handleSessionEnded(sessionId: string, summaryStatus: SummaryStatus) {
    if (isSessionWithoutUserMessage(sessionId)) {
      handleUntouchedSessionEnded(sessionId, summaryStatus);
      return;
    }

    handleSummarizableSessionEnded(sessionId);
  }

  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: (data, sessionId) => handleSessionEnded(sessionId, data.summary_status),
    onError: (error, sessionId) => {
      const status = readApiHttpStatus(error);

      // 30분 무응답 자동 종료 등으로 서버가 이미 세션을 끝낸 뒤 사용자가 수동 종료를 시도한 경우 —
      // 성공과 동일하게 처리해 동일한 요약 화면 이동 로직을 타게 한다. 종료 응답이 없어 실제
      // summary_status를 알 수 없으므로 'pending'으로 둔다 — 어차피 곧 도착할 리페치가 덮어쓴다
      if (status === HTTP_STATUS.GONE || status === HTTP_STATUS.NOT_FOUND) {
        handleSessionEnded(sessionId, 'pending');
        return;
      }

      Alert.alert('종료 실패', '잠시 후 다시 시도해 주세요.');
    },
  });
}

export function useSubmitCbtEmotionScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reconstructionId, score }: { reconstructionId: string; score: number }) =>
      submitCbtEmotionScore(reconstructionId, score),
    onSuccess: () => {
      useChatStore.getState().deactivateEmotionScoring();
      void invalidateReportQueries(queryClient);
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      useChatStore.getState().deactivateEmotionScoring();

      // 409 CBT_SCORE_NOT_REQUIRED: 이미 제출 완료된 것으로 간주, 에러 토스트 없이 조용히 무시
      // (중복 탭/재시도 시 두 번째 요청은 항상 409 — chat-trouble-shoot/04-cbt-emotion-score-redesign.md §3 참고)
      if (status === HTTP_STATUS.CONFLICT && errorCode === 'CBT_SCORE_NOT_REQUIRED') {
        return;
      }

      // 403/404는 정상 흐름에서 발생하지 않아야 하는 예외 상태 — 재시도해도 다시 실패할 가능성이 높아 패널은 닫고 알림만 표시
      Alert.alert('제출 실패', '감정 점수를 저장하지 못했어요.');
    },
  });
}

// summary_status==='pending'이면 일정 주기로 재조회, done/viewed/failed면 멈춤.
// sessionId는 chatStore.sessionId뿐 아니라 라우트로 받은 last_ended_session_id로도 호출 가능 (05번 작업의 재진입 리다이렉트)
//
// 주의: 이 훅의 호출 자체가 GET .../summary의 부수효과로 서버 summary_status를 done→viewed로 확정시킨다.
// 반드시 해당 세션 요약을 화면에 실제로 그릴 때만 호출할 것 — 다른 세션 값을 참고용으로 가져오려는 목적으로는
// 쓰지 말고, 캐시에 남은 값만 필요하면 queryClient.getQueryData(queryKeys.chat.session(id))로 읽는다
// (SessionSummary.tsx의 직전 세션 조회 참고).
export function useSessionSummary(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.session(sessionId ?? 'none'),
    queryFn: () => fetchSessionSummary(sessionId as string),
    enabled: !!sessionId,
    // ⚠️ data만 보면 안 된다 — 배경 리페치가 실패해도 직전 pending 데이터가 그대로 남아(status만
    // 'error'로 바뀐다) 종료 조건이 영원히 참이 되고, 같은 에러를 주기마다 다시 받는다
    refetchInterval: (query) =>
      query.state.status !== 'error' && query.state.data?.summary_status === 'pending'
        ? SESSION_SUMMARY_POLL_INTERVAL_MS
        : false,
    // 410(요약 생성 영구 실패)처럼 재시도해도 결과가 바뀌지 않는 4xx는 즉시 확정시킨다 —
    // 전역 retry가 한 번 더 왕복하는 동안 사용자는 대기 화면만 보게 된다
    retry: (failureCount, error) =>
      isClientErrorStatus(readApiHttpStatus(error))
        ? false
        : failureCount < SESSION_SUMMARY_RETRY_COUNT,
    // 다음 세션 요약 화면이 감정 변화율 비교용으로 이 캐시를 다시 읽을 수 있도록 기본보다 길게 유지
    gcTime: SESSION_SUMMARY_CACHE_GC_TIME_MS,
  });
}
