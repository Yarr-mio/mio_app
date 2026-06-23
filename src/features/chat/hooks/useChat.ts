import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { queryKeys } from '@/api/queryKeys';
import { endSession, fetchActiveSession, startSession } from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';
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
      const store = useChatStore.getState();
      store.endSession();

      // TODO mock: Memory 도메인 폴링 전략 미결 — 실제 연동 시 summary 폴링 후 setSummary 호출
      store.setSummary({
        primaryEmotion: { emotionType: 'anxious', intensity: 6, percentChange: -20 },
        keyPoints: [
          '일에 대한 부담감이 주요 스트레스 원인이었어요',
          '작은 실수에 과도하게 반응하는 경향이 있었어요',
        ],
        newThoughts: ['실수는 성장의 일부예요', '내가 할 수 있는 것에 집중해 볼게요'],
        recommendedActions: ['5분 호흡 명상', '오늘 잘한 일 3가지 적기', '가벼운 산책'],
      });

      router.push('/(main)/chat/summary');
    },
  });
}

export function useSaveChatSession() {
  return useMutation({
    // TODO mock: 즉시 성공 응답 — 실제 연동 시 Memory API 호출로 교체
    mutationFn: async (_sessionId: string) => {},
    onSuccess: () => {
      router.push('/(main)/chat/end');
    },
  });
}
