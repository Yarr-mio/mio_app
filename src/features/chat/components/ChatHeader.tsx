import { View } from 'react-native';
import { ThemedText } from '@/components/themed/ThemedText';
import { getOnboardingCharacterById } from '@/constants/characters';
import type { OnboardingCharacterId } from '@/constants/characters';

interface ChatHeaderProps {
  characterId: OnboardingCharacterId;
}

export function ChatHeader({ characterId }: ChatHeaderProps) {
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="flex-row items-center gap-3 px-5 py-4">
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
  );
}
