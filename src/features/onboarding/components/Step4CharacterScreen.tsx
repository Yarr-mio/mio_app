import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  getOnboardingCharacterById,
  ONBOARDING_ALL_CHARACTER_IDS,
  ONBOARDING_STEP4_ALL_TITLE,
  ONBOARDING_STEP4_RECOMMENDED_TITLE,
  ONBOARDING_STEP4_SEE_MORE_LABEL,
  ONBOARDING_STEP4_SUBTITLE,
  type OnboardingCharacterId,
} from '@/constants/characters';
import type { OnboardingStyleType } from '@/constants/onboarding';
import { OnboardingStyleCardLayout, PressableConfig, ScreenSpacing } from '@/constants/theme';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingCharacter } from '@/features/onboarding/hooks/useOnboarding';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { getRecommendedCharacterIds } from '@/features/onboarding/utils/getRecommendedCharacterIds';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SeeMoreCharactersButtonProps {
  onPress: () => void;
}

function SeeMoreCharactersButton({ onPress }: SeeMoreCharactersButtonProps) {
  return (
    <OnboardingSkipButton
      label={`${ONBOARDING_STEP4_SEE_MORE_LABEL} >`}
      onPress={onPress}
      className="flex-row items-center justify-center gap-1 py-4"
    />
  );
}

interface CharacterOptionCardProps {
  name: string;
  chipLabel: string;
  quote: string;
  characterImage: ImageSource;
  selected: boolean;
  onPress: () => void;
}

function CharacterOptionCard({
  name,
  chipLabel,
  quote,
  characterImage,
  selected,
  onPress,
}: CharacterOptionCardProps) {
  const { iconSlotSize, iconRenderScale } = OnboardingStyleCardLayout;
  const iconRenderSize = iconSlotSize * iconRenderScale;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={name}
      className={cn(
        'flex-row items-center gap-3 rounded-card border-2 py-6 pl-2 pr-4',
        selected
          ? 'border-sub-tab-selected-border bg-sub-tab-selected-bg'
          : 'border-sub-tab-inactive-border bg-sub-tab-inactive-bg'
      )}
      hitSlop={PressableConfig.hitSlop}
    >
      <View
        style={{
          width: iconSlotSize,
          height: iconSlotSize,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={characterImage}
          style={{ width: iconRenderSize, height: iconRenderSize }}
          contentFit="contain"
        />
      </View>
      <View className="flex-1 gap-2">
        <ThemedText type="smallTitle" className="text-fg-default">
          {name}
        </ThemedText>
        <Label label={chipLabel} />
        <ThemedText type="default" className="text-fg-default/80 text-sm leading-5">
          {quote}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Step4CharacterScreen() {
  const insets = useSafeAreaInsets();
  const { preferred_style, character_id, setCharacterId } = useOnboardingStore();
  const router = useRouter();
  const onboardingCharacter = useOnboardingCharacter();
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  const selectedStyle = preferred_style as OnboardingStyleType | null;
  const recommendedIds = getRecommendedCharacterIds(selectedStyle);
  const displayCharacterIds: OnboardingCharacterId[] = showAllCharacters
    ? ONBOARDING_ALL_CHARACTER_IDS
    : recommendedIds;

  const pageTitle = showAllCharacters
    ? ONBOARDING_STEP4_ALL_TITLE
    : ONBOARDING_STEP4_RECOMMENDED_TITLE;

  const isCharacterSelected = character_id !== null;
  const isPending = onboardingCharacter.isPending;

  const handleSelectCharacter = (id: OnboardingCharacterId) => {
    setCharacterId(id);
  };

  const handleSeeMore = () => {
    setShowAllCharacters(true);
  };

  const handleNext = async () => {
    if (!character_id) {
      return;
    }

    try {
      const response = await onboardingCharacter.mutateAsync({ character_id });
      console.log('[온보딩 4단계] 응답값', response.data);
      console.log('[온보딩 4단계] 선택된 캐릭터', response.data.preferred_character_id);
      console.log('[온보딩 4단계] signup_step', response.data.signup_step);
      router.push('/(auth)/onboarding/onboardingComplete');
    } catch (error) {
      Alert.alert('캐릭터 선택', readApiErrorMessage(error));
    }
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
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow pb-4"
        >
          <View className="mt-10">
            <ThemedText type="title" className="text-fg">
              {pageTitle}
            </ThemedText>
            <ThemedText type="subtitle" className="mt-3 text-subtitle">
              {ONBOARDING_STEP4_SUBTITLE}
            </ThemedText>
          </View>

          <View className="mt-8 gap-3">
            {displayCharacterIds.map((id) => {
              const character = getOnboardingCharacterById(id);

              return (
                <CharacterOptionCard
                  key={character.id}
                  name={character.name}
                  chipLabel={character.chipLabel}
                  quote={character.quote}
                  characterImage={character.image}
                  selected={character_id === character.id}
                  onPress={() => handleSelectCharacter(character.id)}
                />
              );
            })}
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!isCharacterSelected || isPending} onPress={handleNext}>
            다음
          </Button>
          {!showAllCharacters && <SeeMoreCharactersButton onPress={handleSeeMore} />}
        </View>
      </View>
    </View>
  );
}
