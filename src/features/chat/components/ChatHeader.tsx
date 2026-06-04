import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { getOnboardingCharacterById } from '@/constants/characters';
import type { OnboardingCharacterId } from '@/constants/characters';

interface ChatHeaderProps {
  characterId: OnboardingCharacterId;
  onEnd?: () => void;
}

export function ChatHeader({ characterId, onEnd }: ChatHeaderProps) {
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-2 h-2 rounded-full bg-success" />
        <View>
          <ThemedText type="smallTitle" className="text-white">
            {character.name}
          </ThemedText>
          <ThemedText type="small" className="text-white/60">
            함께 있어요
          </ThemedText>
        </View>
      </View>
      {onEnd && (
        <Pressable
          onPress={onEnd}
          accessibilityRole="button"
          accessibilityLabel="대화 종료"
          className="px-3 py-1.5 rounded-xl border border-white/20"
        >
          <ThemedText type="small" className="text-white/60">
            종료
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}
