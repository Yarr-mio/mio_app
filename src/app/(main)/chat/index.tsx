import { useEffect } from 'react';
import { View } from 'react-native';
import { useActiveSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { SessionStart } from '@/features/chat/components/SessionStart';
import { ChatMain } from '@/features/chat/components/ChatMain';

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
    return <ChatMain />;
  }

  return <SessionStart />;
}
