import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { fetchActiveSession, startSession } from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';

export function useActiveSession() {
  return useQuery({
    queryKey: queryKeys.chat.activeSession(),
    queryFn: fetchActiveSession,
  });
}

export function useStartChatSession() {
  return useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      useChatStore.getState().startSession(data.session_id, data.character_id);
    },
  });
}
