import { useEffect } from 'react';
import { View } from 'react-native';
import { useActiveSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { SessionStart } from '@/features/chat/components/SessionStart';

export default function ChatScreen() {
  const { data: activeSession, isLoading } = useActiveSession();
  const sessionPhase = useChatStore((s) => s.sessionPhase);
  const startSession = useChatStore((s) => s.startSession);

  useEffect(() => {
    if (activeSession) {
      startSession(activeSession.session_id, activeSession.character_id);
    }
  }, [activeSession, startSession]);

  if (isLoading) {
    return <View className="flex-1 bg-midnight" />;
  }

  if (sessionPhase === 'active') {
    // TODO: Phase 04에서 ChatMain으로 교체
    return <View className="flex-1 bg-midnight" />;
  }

  return <SessionStart />;
}
