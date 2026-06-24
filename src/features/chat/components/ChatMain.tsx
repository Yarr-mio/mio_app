import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useChatSse } from '@/features/chat/hooks/useChatSse';
import { useEndChatSession } from '@/features/chat/hooks/useChat';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ChatInputBar } from '@/features/chat/components/ChatInputBar';
import { EmotionScorePanel } from '@/features/chat/components/EmotionScorePanel';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import type { ChatMessage } from '@/types/chat';

export function ChatMain() {
  const characterId = useChatStore((s) => s.characterId);
  const sessionId = useChatStore((s) => s.sessionId);
  const messages = useChatStore((s) => s.messages);
  const isAiTyping = useChatStore((s) => s.isAiTyping);
  const emotionScoringActive = useChatStore((s) => s.emotionScoringActive);
  const pendingEmotionScore = useChatStore((s) => s.pendingEmotionScore);
  const character = getOnboardingCharacterById(characterId);
  // session_meta가 만든 빈 AI placeholder는 실제 콘텐츠가 도착하기 전까지 렌더링에서 제외 —
  // 그 사이에는 TypingIndicator(isAiTyping)만 보여준다
  const visibleMessages = messages.filter((m) => !(m.role === 'ai' && m.content === ''));

  const { sendMessage, confirmEmotionScore, isStreaming } = useChatSse(sessionId);
  const { mutate: endChatSession } = useEndChatSession();

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <ChatHeader
          characterId={characterId}
          onEnd={() => sessionId && endChatSession(sessionId)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <FlatList<ChatMessage>
            data={[...visibleMessages].reverse()}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                characterId={characterId}
                characterName={character.name}
              />
            )}
            ListHeaderComponent={isAiTyping ? <TypingIndicator /> : null}
            contentContainerClassName="gap-4 px-4 py-4"
          />
          {emotionScoringActive ? (
            <EmotionScorePanel initialScore={pendingEmotionScore} onConfirm={confirmEmotionScore} />
          ) : (
            <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
