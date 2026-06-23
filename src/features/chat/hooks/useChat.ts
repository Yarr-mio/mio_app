import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { queryKeys } from '@/api/queryKeys';
import {
  endSession,
  fetchActiveSession,
  fetchSessionSummary,
  startSession,
} from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { SESSION_SUMMARY_POLL_INTERVAL_MS } from '@/constants/config';
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
