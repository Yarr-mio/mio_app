import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
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
import {
  OnboardingStyleCardClasses,
  OnboardingStyleCardLayout,
  PressableConfig,
  ScreenSpacing,
} from '@/constants/theme';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingCharacterRecommendations } from '@/features/onboarding/hooks/useOnboardingCharacterRecommendations';
import { useOnboardingStep4Submit } from '@/features/onboarding/hooks/useOnboardingStep4Submit';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

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
  const { iconRenderScale } = OnboardingStyleCardLayout;
  const iconRenderSize = OnboardingStyleCardLayout.iconSlotSize * iconRenderScale;

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
      <View className={OnboardingStyleCardClasses.iconSlot}>
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
  const { preferred_style, character_id, setCharacterId } = useOnboardingStore();
  const { submit, isPending, error, clearError } = useOnboardingStep4Submit();
  const [showAllCharacters, setShowAllCharacters] = useState(false);

  const selectedStyle = preferred_style as OnboardingStyleType | null;
  const { recommendedIds, isStatusLoading } = useOnboardingCharacterRecommendations(selectedStyle);
  const displayCharacterIds: OnboardingCharacterId[] = showAllCharacters
    ? ONBOARDING_ALL_CHARACTER_IDS
    : recommendedIds;

  const pageTitle = showAllCharacters
    ? ONBOARDING_STEP4_ALL_TITLE
    : ONBOARDING_STEP4_RECOMMENDED_TITLE;

  const isCharacterSelected = character_id !== null;

  const handleSelectCharacter = (id: OnboardingCharacterId) => {
    clearError();
    setCharacterId(id);
  };

  const handleSeeMore = () => {
    setShowAllCharacters(true);
  };

  const handleNext = () => {
    if (!character_id) {
      return;
    }

    void submit(character_id);
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8 mt-6" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
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

        <View className="pt-4 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={!isCharacterSelected || isPending} onPress={handleNext}>
            다음
          </Button>
          {!showAllCharacters && <SeeMoreCharactersButton onPress={handleSeeMore} />}
        </View>
      </ScreenContainer>
      <LoadingOverlay visible={isStatusLoading} />
    </View>
  );
}
