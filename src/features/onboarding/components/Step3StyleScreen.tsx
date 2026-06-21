import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  ONBOARDING_STYLE_OPTIONS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingStyleType,
} from '@/constants/onboarding';
import {
  OnboardingStyleCardClasses,
  OnboardingStyleCardLayout,
  PressableConfig,
  ScreenSpacing,
} from '@/constants/theme';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingStep3 } from '@/features/onboarding/hooks/useOnboarding';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import { cn } from '@/utils/cn';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';

const ONBOARDING_CURRENT_STEP = 3;

interface StyleOptionCardProps {
  title: string;
  description: string;
  characterImage: ImageSource;
  selected: boolean;
  onPress: () => void;
}

function StyleOptionCard({
  title,
  description,
  characterImage,
  selected,
  onPress,
}: StyleOptionCardProps) {
  const { iconSlotSize, iconRenderScale } = OnboardingStyleCardLayout;
  const iconRenderSize = iconSlotSize * iconRenderScale;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      className={cn(
        'flex-row items-center gap-3 rounded-card border-2 py-2.5 pl-2 pr-4',
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
          {title}
        </ThemedText>
        <ThemedText type="default" className="text-fg-default/80 text-sm">
          {description}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function Step3StyleScreen() {
  const router = useRouter();
  const { preferred_style, setPreferredStyle, setCharacterId, setCharacterRecommendations } =
    useOnboardingStore();
  const onboardingStep3 = useOnboardingStep3();

  const selectedStyle = preferred_style as OnboardingStyleType | null;
  const isStyleSelected = selectedStyle !== null;
  const isPending = onboardingStep3.isPending;

  const handleSelectStyle = (
    styleId: OnboardingStyleType,
    characterId: (typeof ONBOARDING_STYLE_OPTIONS)[number]['characterId']
  ) => {
    setPreferredStyle(styleId);
    setCharacterId(characterId);
  };

  const handleSkip = () => {
    setPreferredStyle(null);
    setCharacterId(null);
    router.push('/(auth)/onboarding/step4Character');
  };

  const handleNext = async () => {
    if (!isStyleSelected || !selectedStyle) {
      return;
    }

    try {
      const response = await onboardingStep3.mutateAsync({
        preferred_style: selectedStyle,
        responses: [{ question_id: 'q3', answer: selectedStyle }],
      });
      console.log('[온보딩 3단계] 응답값', response.data);
      console.log('[온보딩 3단계] 캐릭터 추천 결과', response.data.character_recommendations);

      if (response.data.character_recommendations.length > 0) {
        setCharacterRecommendations(response.data.character_recommendations);
      }

      router.push('/(auth)/onboarding/step4Character');
    } catch (error) {
      Alert.alert('대화 방식', readApiErrorMessage(error));
    }
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="pt-4 mt-6">
          <OnboardingHeader
            currentStep={ONBOARDING_CURRENT_STEP}
            totalSteps={ONBOARDING_TOTAL_STEPS}
          />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow pb-4"
        >
          <View className="mt-10">
            <ThemedText type="title" className="text-fg">
              어떤 대화 방식이{'\n'}편하세요?
            </ThemedText>
            <ThemedText type="subtitle" className="mt-3 text-subtitle">
              나중에 언제든지 바꿀 수 있어요
            </ThemedText>
          </View>

          <View className="mt-8 gap-3">
            {ONBOARDING_STYLE_OPTIONS.map((option) => (
              <StyleOptionCard
                key={option.id}
                title={option.title}
                description={option.description}
                characterImage={option.characterImage}
                selected={selectedStyle === option.id}
                onPress={() => handleSelectStyle(option.id, option.characterId)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!isStyleSelected || isPending} onPress={handleNext}>
            다음
          </Button>
          <OnboardingSkipButton
            label="건너뛰기"
            onPress={handleSkip}
            className="items-center py-4"
          />
        </View>
      </ScreenContainer>
    </View>
  );
}
