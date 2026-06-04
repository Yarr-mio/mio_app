import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
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

  const { sendMessage, isStreaming } = useChatSse(sessionId);
  const { mutate: endChatSession } = useEndChatSession();

  return (
    <View className="flex-1 bg-midnight">
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
            data={[...messages].reverse()}
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
            <EmotionScorePanel
              initialScore={pendingEmotionScore}
              onConfirm={(_score) => {
                // TODO: 점수 제출 엔드포인트 미명세 — 백엔드 확인 필요
                useChatStore.getState().deactivateEmotionScoring();
              }}
            />
          ) : (
            <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
