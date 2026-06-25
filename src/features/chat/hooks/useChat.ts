import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { queryKeys } from '@/api/queryKeys';
import {
  endSession,
  fetchActiveSession,
  fetchSessionSummary,
  startSession,
  submitCbtEmotionScore,
} from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { HTTP_STATUS, SESSION_SUMMARY_POLL_INTERVAL_MS } from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';
import type { ActiveSessionResponse } from '@/types/chat';

export function useActiveSession() {
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
        Alert.alert('온보딩이 필요해요', '먼저 온보딩을 마치면 대화를 시작할 수 있어요.', [
          { text: '확인', onPress: () => router.replace(AUTH_ROUTES.onboardingStep1) },
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

  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      useChatStore.getState().endSession();
      // 종료된 세션이 activeSession 캐시(staleTime 5분)에 남아있으면, 그 안에 chat/index.tsx가 새로
      // 마운트될 때 이미 끝난 세션을 다시 활성 세션으로 착각해 startSession()을 재호출할 수 있다
      // (chat-trouble-shoot/08 원인 E)
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() });
      // SessionEnd의 dismissAll()이 스택 루트(index)로 돌아간다는 전제를 깨지 않기 위해 push 유지 —
      // 뒤로가기 차단은 SessionSummary/SessionEnd의 beforeRemove 리스너가 담당
      router.push('/(main)/chat/summary');
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
export function useSessionSummary(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.session(sessionId ?? 'none'),
    queryFn: () => fetchSessionSummary(sessionId as string),
    enabled: !!sessionId,
    refetchInterval: (query) =>
      query.state.data?.summary_status === 'pending' ? SESSION_SUMMARY_POLL_INTERVAL_MS : false,
  });
}
