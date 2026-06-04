import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useChatStore } from '@/features/chat/store/chatStore';
import { ChatHeader } from '@/features/chat/components/ChatHeader';

export function ChatMain() {
  const characterId = useChatStore((s) => s.characterId);

  return (
    <View className="flex-1 bg-midnight">
      <ScreenContainer className="flex-1 bg-transparent">
        <ChatHeader characterId={characterId} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Phase 05: FlatList(MessageBubble)로 교체 */}
          <View className="flex-1" />
          {/* Phase 06: ChatInputBar / Phase 07: EmotionScorePanel로 교체 */}
          <View />
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
