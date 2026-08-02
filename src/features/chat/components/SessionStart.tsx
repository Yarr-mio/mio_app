import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useStartChatSession } from '@/features/chat/hooks/useChat';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { View } from 'react-native';

export function SessionStart() {
  const characterId = useSelectedCharacterId();
  const character = getOnboardingCharacterById(characterId);
  const { mutate: startSession, isPending } = useStartChatSession();

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <View className="items-center pt-8">
          <ThemedText type="title" className="text-center text-fg">
            {character.name}와 대화하기
          </ThemedText>
        </View>
        <View className="flex-1 items-center justify-center gap-8 px-8">
          <ThemedText className="text-center text-fg text-2xl font-bold leading-9">
            {character.name}와 함께{'\n'}이야기를 시작해 볼까요?
          </ThemedText>
          <CharacterAvatar characterId={characterId} size="lg" />
          <ThemedText type="defaultRegular" className="text-center text-fg-soft">
            지금부터 편안하게 마음을 이야기해 보세요{'\n'}
            {character.name}가 곁에서 함께할게요 😊
          </ThemedText>
        </View>
        <View className="px-8 pb-6 gap-3">
          <Button
            variant="primary"
            size="lg"
            loading={isPending}
            onPress={() => startSession(characterId)}
          >
            대화 시작하기
          </Button>
          <ThemedText type="small" className="text-center text-fg-muted">
            감정 체크는 홈에서 언제든 다시 할 수 있어요
          </ThemedText>
        </View>
      </ScreenContainer>
    </View>
  );
}
