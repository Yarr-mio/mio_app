import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import {
  getOnboardingCharacterById,
  ONBOARDING_ALL_CHARACTER_IDS,
  ONBOARDING_STEP4_ALL_TITLE,
  ONBOARDING_STEP4_SUBTITLE,
  type OnboardingCharacterId,
} from '@/constants/characters';
import { SIGNUP_NEXT_BUTTON_LABEL } from '@/constants/signup';
import {
  CharacterSelectFloatingCtaClasses,
  CharacterSelectFloatingCtaLayout,
  OnboardingStyleCardClasses,
  OnboardingStyleCardLayout,
  PressableConfig,
  ScreenSpacing,
  SignupFlowClasses,
  SignupFlowLayout,
} from '@/constants/theme';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import { useCharacterSelectSubmit } from '@/features/auth/hooks/useCharacterSelectSubmit';
import { useCharacterSelection } from '@/features/auth/hooks/useCharacterSelection';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SIGNUP_STEP_COUNT = SignupFlowLayout.totalSteps;
const SIGNUP_CURRENT_STEP = SignupFlowLayout.characterCurrentStep;
const STEP_INDICATOR_WRAP = SignupFlowClasses.stepIndicatorWrap;
const FLOATING_CTA_ENTER_MS = CharacterSelectFloatingCtaLayout.enterDurationMs;
const FLOATING_CTA_EXIT_MS = CharacterSelectFloatingCtaLayout.exitDurationMs;
const LIST_BOTTOM_PADDING = CharacterSelectFloatingCtaLayout.listBottomPadding;
const LIST_BOTTOM_PADDING_WITH_CTA = CharacterSelectFloatingCtaLayout.scrollBottomPaddingWithCta;
const FLOATING_CTA_BOTTOM_EXTRA = CharacterSelectFloatingCtaLayout.bottomOffsetExtra;
const FLOATING_CTA_HORIZONTAL_INSET = CharacterSelectFloatingCtaLayout.horizontalInset;

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
        CharacterSelectFloatingCtaClasses.cardRow,
        selected
          ? 'border-sub-tab-selected-border bg-sub-tab-selected-bg'
          : 'border-sub-tab-inactive-border bg-sub-tab-inactive-bg'
      )}
      hitSlop={PressableConfig.hitSlop}
    >
      <View className={OnboardingStyleCardClasses.iconSlot}>
        {/* expo-image 크기 지정용 인라인 스타일 예외 */}
        <Image
          source={characterImage}
          style={{ width: iconRenderSize, height: iconRenderSize }}
          contentFit="contain"
        />
      </View>
      <View className={CharacterSelectFloatingCtaClasses.cardTextWrap}>
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

interface FloatingNextCtaProps {
  error: string | null;
  isPending: boolean;
  onPress: () => void;
}

function FloatingNextCta({ error, isPending, onPress }: FloatingNextCtaProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset =
    Math.max(insets.bottom, ScreenSpacing.bottomInsetMin) + FLOATING_CTA_BOTTOM_EXTRA;

  return (
    <Animated.View
      entering={FadeInDown.duration(FLOATING_CTA_ENTER_MS)}
      exiting={FadeOutDown.duration(FLOATING_CTA_EXIT_MS)}
      pointerEvents="box-none"
      className={CharacterSelectFloatingCtaClasses.floatingCta}
      style={{
        // 플로팅 CTA safe area 및 좌우 inset용 인라인 스타일 예외
        bottom: bottomOffset,
        left: FLOATING_CTA_HORIZONTAL_INSET,
        right: FLOATING_CTA_HORIZONTAL_INSET,
      }}
    >
      {error ? <ErrorState message={error} /> : null}
      <Button disabled={isPending} onPress={onPress} loading={isPending}>
        {SIGNUP_NEXT_BUTTON_LABEL}
      </Button>
    </Animated.View>
  );
}

export function CharacterSelectScreen() {
  const { character_id, setCharacterId } = useCharacterSelection();
  const { submit, isPending, error, clearError } = useCharacterSelectSubmit();
  const isCharacterSelected = character_id !== null;

  const handleSelectCharacter = (id: OnboardingCharacterId) => {
    clearError();
    // 동일 카드 재선택 시 선택 해제
    setCharacterId(character_id === id ? null : id);
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
      <ScreenContainer
        className={CharacterSelectFloatingCtaClasses.screenContainer}
        bottomInsetMin={ScreenSpacing.bottomInsetMin}
      >
        <View className={STEP_INDICATOR_WRAP}>
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow"
          contentContainerStyle={{
            // 플로팅 CTA 오버레이 스크롤 여백용 인라인 스타일 예외
            paddingBottom: isCharacterSelected ? LIST_BOTTOM_PADDING_WITH_CTA : LIST_BOTTOM_PADDING,
          }}
        >
          <View className={CharacterSelectFloatingCtaClasses.titleWrap}>
            <ThemedText type="title" className="text-fg">
              {ONBOARDING_STEP4_ALL_TITLE}
            </ThemedText>
            <ThemedText type="subtitle" className={CharacterSelectFloatingCtaClasses.subtitle}>
              {ONBOARDING_STEP4_SUBTITLE}
            </ThemedText>
          </View>

          <View className={CharacterSelectFloatingCtaClasses.listWrap}>
            {ONBOARDING_ALL_CHARACTER_IDS.map((id) => {
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

        {isCharacterSelected ? (
          <FloatingNextCta error={error} isPending={isPending} onPress={handleNext} />
        ) : null}
      </ScreenContainer>
    </View>
  );
}
