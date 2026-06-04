import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import type { ChatMessage } from '@/types/chat';

export function ChatMain() {
  const characterId = useChatStore((s) => s.characterId);
  const messages = useChatStore((s) => s.messages);
  const isAiTyping = useChatStore((s) => s.isAiTyping);
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="flex-1 bg-midnight">
      <ScreenContainer className="flex-1 bg-transparent">
        <ChatHeader characterId={characterId} />
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
            ListFooterComponent={isAiTyping ? <TypingIndicator /> : null}
            contentContainerClassName="gap-4 px-4 py-4"
          />
          {/* Phase 06: ChatInputBar / Phase 07: EmotionScorePanel로 교체 */}
          <View />
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
