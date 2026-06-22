import { ErrorState } from '@/components/feedback/ErrorState';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import { OnboardingCompleteLayout, ScreenSpacing } from '@/constants/theme';
import { usePartnerStore } from '@/features/mypage/store/partnerStore';
import { useOnboardingCompleteSubmit } from '@/features/onboarding/hooks/useOnboardingCompleteSubmit';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { userStoreUtils, useUserStore } from '@/store/userStore';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OnboardingCompleteScreen() {
  const insets = useSafeAreaInsets();
  const { character_id, emotion_state, emoji_score, concern_types, preferred_style } =
    useOnboardingStore();
  const { setOnboardingResult } = useUserStore();
  const setSelectedPartner = usePartnerStore((state) => state.setSelectedPartner);
  const { submit, isPending, error, clearError } = useOnboardingCompleteSubmit();
  const selectedCharacterId = character_id ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(selectedCharacterId);

  const handleStart = () => {
    clearError();

    const emotionSelection =
      emotion_state && emoji_score ? { emotion: emotion_state, intensity: emoji_score } : null;

    void submit({
      emotionState: emotion_state,
      emojiScore: emoji_score,
      concernTypes: concern_types,
      preferredStyle: preferred_style,
      characterId: selectedCharacterId,
      onBeforeNavigate: () => {
        setOnboardingResult({
          emotionSelection,
          concernTypes: userStoreUtils.normalizeConcernTypes(concern_types),
          preferredStyle: preferred_style,
          characterId: selectedCharacterId,
        });
        setSelectedPartner(selectedCharacterId);
      },
    });
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

        <View className="pt-4 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={isPending} onPress={handleStart}>
            {character.name}와 시작하기
          </Button>
        </View>
      </View>
    </View>
  );
}
