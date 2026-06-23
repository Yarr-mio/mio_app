import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { useActiveSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { SessionStart } from '@/features/chat/components/SessionStart';
import { ChatMain } from '@/features/chat/components/ChatMain';
import { storage } from '@/utils/storage';

export default function ChatScreen() {
  const { data: activeSession, isLoading } = useActiveSession();
  const sessionPhase = useChatStore((s) => s.sessionPhase);
  const startSession = useChatStore((s) => s.startSession);
  // 같은 마운트 동안 재진입 리다이렉트를 한 번만 트리거 (refetch로 effect가 다시 돌아도 중복 push 방지)
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!activeSession) return;

    if (activeSession.session_id && activeSession.character_id) {
      startSession(activeSession.session_id, activeSession.character_id);
      return;
    }

    const endedSessionId = activeSession.last_ended_session_id;
    const summaryStatus = activeSession.last_summary_status;
    if (
      hasRedirectedRef.current ||
      !endedSessionId ||
      !summaryStatus ||
      summaryStatus === 'viewed'
    ) {
      return;
    }

    hasRedirectedRef.current = true;
    void (async () => {
      // summary_status가 viewed로 전환되는 시점이 불명확해, 서버 상태와 무관하게 같은 세션으로는
      // 한 번만 리다이렉트하도록 로컬에 마지막으로 보여준 세션 id를 기록해둔다
      const lastRedirectedSessionId = await storage.chatRedirectedSessionId.get();
      if (lastRedirectedSessionId === endedSessionId) return;

      await storage.chatRedirectedSessionId.set(endedSessionId);
      router.push({
        pathname: '/(main)/chat/summary',
        params: { sessionId: endedSessionId },
      });
    })();
  }, [activeSession, startSession]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-midnight">
        <ChatBackground />
      </View>
    );
  }

  if (sessionPhase === 'active') {
    return <ChatMain />;
  }

  return <SessionStart />;
}
