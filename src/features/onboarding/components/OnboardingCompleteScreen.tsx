import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import { OnboardingCompleteLayout, ScreenSpacing } from '@/constants/theme';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OnboardingCompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { character_id } = useOnboardingStore();
  const selectedCharacterId = character_id ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(selectedCharacterId);

  const handleStart = () => {
    router.push('/(main)/chat');
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />

      <View
        className="flex-1 px-8 mt-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, ScreenSpacing.bottomInsetMin),
        }}
      >
        <View className="flex-1">
          <View className="mt-10">
            <ThemedText type="subtitle" className="text-fg">
              반가워요!
            </ThemedText>
            <ThemedText type="title" className="mt-2 text-fg">
              {character.name}와 함께{'\n'}여정을 떠나 볼까요?
            </ThemedText>
          </View>

          <View className="mt-20 items-center">
            <Image
              source={character.iconImage}
              style={{
                width: OnboardingCompleteLayout.characterIconSize,
                height: OnboardingCompleteLayout.characterIconSize,
              }}
              contentFit="contain"
            />
          </View>

          <View className="mt-16">
            <View className="rounded-card border-2 border-sub-tab-inactive-border bg-sub-tab-inactive-bg p-8">
              <ThemedText type="smallTitle" className="text-fg-default">
                {character.greeting}
              </ThemedText>
            </View>
          </View>
        </View>

        <View className="pt-4">
          <Button onPress={handleStart}>{character.name}와 시작하기</Button>
        </View>
      </View>
    </View>
  );
}
