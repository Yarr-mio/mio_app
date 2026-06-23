import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { queryKeys } from '@/api/queryKeys';
import {
  endSession,
  fetchActiveSession,
  fetchSessionSummary,
  startSession,
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
  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      useChatStore.getState().endSession();
      router.push('/(main)/chat/summary');
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
