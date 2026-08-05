import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Alert } from 'react-native';
import { queryKeys } from '@/api/queryKeys';
import {
  endSession,
  fetchActiveSession,
  fetchSessionSummary,
  startSession,
  submitCbtEmotionScore,
} from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';
import {
  HTTP_STATUS,
  SESSION_SUMMARY_CACHE_GC_TIME_MS,
  SESSION_SUMMARY_POLL_INTERVAL_MS,
} from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import { readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';
import type { ActiveSessionResponse } from '@/types/chat';

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
      useChatStore
        .getState()
        .startSession(
          data.session_id,
          data.character_id,
          previousActiveSession?.last_ended_session_id
        );
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.FORBIDDEN && errorCode === 'ONBOARDING_REQUIRED') {
        Alert.alert('온보딩이 필요해요', '먼저 캐릭터 선택을 마치면 대화를 시작할 수 있어요.', [
          { text: '확인', onPress: () => router.replace(AUTH_ROUTES.onboardingStep4) },
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

export function useEndChatSession() {
  const queryClient = useQueryClient();

  function handleSessionEnded() {
    useChatStore.getState().endSession();
    // 종료된 세션이 activeSession 캐시(staleTime 5분)에 남아있으면, 그 안에 chat/index.tsx가 새로
    // 마운트될 때 이미 끝난 세션을 다시 활성 세션으로 착각해 startSession()을 재호출할 수 있다
    // (chat-trouble-shoot/08 원인 E)
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
    // 세션 종료 후 서버가 비동기로 Todo를 생성하므로, 홈/Todo 화면이 최신 목록을 다시 받아오도록 무효화한다
    queryClient.invalidateQueries({ queryKey: queryKeys.todo.all() });
    // SessionEnd의 dismissAll()이 스택 루트(index)로 돌아간다는 전제를 깨지 않기 위해 push 유지 —
    // 뒤로가기 차단은 SessionSummary/SessionEnd의 beforeRemove 리스너가 담당
    router.push('/(main)/chat/summary');
  }

  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: handleSessionEnded,
    onError: (error) => {
      const status = readApiHttpStatus(error);

      // 30분 무응답 자동 종료 등으로 서버가 이미 세션을 끝낸 뒤 사용자가 수동 종료를 시도한 경우 —
      // 성공과 동일하게 처리해 동일한 요약 화면 이동 로직을 타게 한다
      if (status === HTTP_STATUS.GONE || status === HTTP_STATUS.NOT_FOUND) {
        handleSessionEnded();
        return;
      }

      Alert.alert('종료 실패', '잠시 후 다시 시도해 주세요.');
    },
  });
}

export function useSubmitCbtEmotionScore() {
  return useMutation({
    mutationFn: ({ reconstructionId, score }: { reconstructionId: string; score: number }) =>
      submitCbtEmotionScore(reconstructionId, score),
    onSuccess: () => {
      useChatStore.getState().deactivateEmotionScoring();
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
    refetchInterval: (query) =>
      query.state.data?.summary_status === 'pending' ? SESSION_SUMMARY_POLL_INTERVAL_MS : false,
    // 다음 세션 요약 화면이 감정 변화율 비교용으로 이 캐시를 다시 읽을 수 있도록 기본보다 길게 유지
    gcTime: SESSION_SUMMARY_CACHE_GC_TIME_MS,
  });
}
