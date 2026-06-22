import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmotionIntensitySlider } from '@/components/ui/EmotionIntensitySlider';
import { EmotionSelectBox } from '@/components/ui/EmotionSelectBox';
import {
  ONBOARDING_CURRENT_STEPS,
  ONBOARDING_DEFAULT_EMOJI_SCORE,
  ONBOARDING_TOTAL_STEPS,
} from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { ScreenSpacing } from '@/constants/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { OnboardingSkipButton } from '@/features/onboarding/components/OnboardingSkipButton';
import { useOnboardingStep1Submit } from '@/features/onboarding/hooks/useOnboardingStep1Submit';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import type { EmotionType } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

const ONBOARDING_CURRENT_STEP = ONBOARDING_CURRENT_STEPS.step1;

export function Step1EmotionScreen() {
  const router = useRouter();
  const { emotion_state, emoji_score, setEmotionState, setEmojiScore } = useOnboardingStore();
  const { submit, isPending, error, clearError } = useOnboardingStep1Submit();

  const isEmotionSelected = emotion_state !== null;
  const sliderValue = emoji_score ?? ONBOARDING_DEFAULT_EMOJI_SCORE;

  const handleEmotionChange = (emotion: EmotionType) => {
    clearError();
    setEmotionState(emotion);
    if (emoji_score === null) {
      setEmojiScore(ONBOARDING_DEFAULT_EMOJI_SCORE);
    }
  };

  const handleSkip = () => {
    setEmotionState(null);
    setEmojiScore(null);
    router.push(AUTH_ROUTES.onboardingStep2);
  };

  const handleNext = async () => {
    if (!emotion_state) {
      return;
    }

    const result = await submit(emotion_state, emoji_score);
    if (result && emoji_score === null) {
      setEmojiScore(result.emojiScore);
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
              지금,{'\n'}당신의 감정은 어떤가요?
            </ThemedText>
            <ThemedText type="subtitle" className="mt-3 text-subtitle">
              수면 위로 떠올랐던 감정에 집중해 봐요
            </ThemedText>
          </View>

          <View className="mt-8">
            <EmotionSelectBox value={emotion_state} onChange={handleEmotionChange} />
          </View>

          <View
            className={cn(
              'mt-8 overflow-visible rounded-card border border-onboarding-border bg-onboarding-surface p-6 shadow-lg shadow-black/25',
              !isEmotionSelected && 'opacity-40'
            )}
            pointerEvents={isEmotionSelected ? 'auto' : 'none'}
          >
            <View className="gap-1">
              <ThemedText type="smallTitle" className="text-fg-default">
                감정의 강도는 어떤가요?
              </ThemedText>
              <ThemedText type="subtitle" className="text-subtitle text-base">
                슬라이더를 움직여 강도를 조절해 보세요
              </ThemedText>
            </View>
            {/*
              슬라이더 너비: 박스 p-6 안에서 w-full이면 제목과 동일 너비.
              더 좁히려면 mx-4, w-[90%] 등 className 추가. 더 넓히려면 박스 p-6 축소.
            */}
            <EmotionIntensitySlider
              className="mt-4"
              value={sliderValue}
              onChange={(score) => {
                clearError();
                setEmojiScore(score);
              }}
              disabled={!isEmotionSelected}
            />
          </View>
        </ScrollView>

        <View className="pt-4 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={!isEmotionSelected || isPending} onPress={handleNext}>
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
