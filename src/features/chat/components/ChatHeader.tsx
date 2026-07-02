import { ThemedText } from '@/components/themed/ThemedText';
import type { OnboardingCharacterId } from '@/constants/characters';
import { getOnboardingCharacterById } from '@/constants/characters';
import { Pressable, View } from 'react-native';

interface ChatHeaderProps {
  characterId: OnboardingCharacterId;
  onEnd?: () => void;
}

export function ChatHeader({ characterId, onEnd }: ChatHeaderProps) {
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-3 h-3 rounded-full bg-success" />
        <View className="flex-row items-center">
          <ThemedText type="smallTitle2" className="text-fg">
            {character.name}
          </ThemedText>
          <ThemedText type="smallTitle" className="text-fg-dim">
            {' · 함께 있어요'}
          </ThemedText>
        </View>
      </View>
      {onEnd && (
        <Pressable
          onPress={onEnd}
          accessibilityRole="button"
          accessibilityLabel="대화 종료"
          className="px-3 py-1.5 rounded-xl border border-line-md"
        >
          <ThemedText type="small" className="text-fg-dim">
            종료
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}
