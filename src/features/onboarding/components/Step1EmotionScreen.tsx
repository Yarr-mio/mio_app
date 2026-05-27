import { EmotionSelectBox } from '@/components/ui/EmotionSelectBox';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmotionIntensitySlider } from '@/components/ui/EmotionIntensitySlider';
import { ONBOARDING_DEFAULT_EMOJI_SCORE, ONBOARDING_TOTAL_STEPS } from '@/constants/onboarding';
import { PressableConfig, ScreenSpacing } from '@/constants/theme';
import { OnboardingHeader } from '@/features/onboarding/components/OnboardingHeader';
import { useOnboardingStore } from '@/features/onboarding/store/onboardingStore';
import type { EmotionType } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDING_CURRENT_STEP = 1;

interface SkipButtonProps {
  onPress: () => void;
  className?: string;
}

function SkipButton({ onPress, className }: SkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="건너뛰기"
      className={className}
      hitSlop={PressableConfig.hitSlop}
    >
      <ThemedText type="default" className="text-subtitle">
        건너뛰기
      </ThemedText>
    </Pressable>
  );
}

export function Step1EmotionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { emotion_state, emoji_score, setEmotionState, setEmojiScore } = useOnboardingStore();

  const isEmotionSelected = emotion_state !== null;
  const sliderValue = emoji_score ?? ONBOARDING_DEFAULT_EMOJI_SCORE;

  const handleEmotionChange = (emotion: EmotionType) => {
    setEmotionState(emotion);
    if (emoji_score === null) {
      setEmojiScore(ONBOARDING_DEFAULT_EMOJI_SCORE);
    }
  };

  const handleSkip = () => {
    setEmotionState(null);
    setEmojiScore(null);
    router.push('/(auth)/onboarding/step2Concern');
  };

  const handleNext = () => {
    if (!emotion_state) {
      return;
    }
    if (emoji_score === null) {
      setEmojiScore(ONBOARDING_DEFAULT_EMOJI_SCORE);
    }
    router.push('/(auth)/onboarding/step2Concern');
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <View
        className="flex-1 px-8"
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, ScreenSpacing.bottomInsetMin),
        }}
      >
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
            <ThemedText type="subtitle" className="font-bold leading-10 text-fg">
              지금,{'\n'}당신의 감정은 어떤가요?
            </ThemedText>
            <ThemedText type="default" className="mt-3 text-subtitle">
              수면 위로 떠올랐던 감정에 집중해 봐요
            </ThemedText>
          </View>

          <View className="mt-8">
            <EmotionSelectBox value={emotion_state} onChange={handleEmotionChange} />
          </View>

          <View
            className={cn(
              'mt-8 overflow-visible rounded-2xl border border-onboarding-border bg-onboarding-surface p-6 shadow-lg shadow-black/25',
              !isEmotionSelected && 'opacity-40'
            )}
            pointerEvents={isEmotionSelected ? 'auto' : 'none'}
          >
            <View className="gap-1">
              <ThemedText type="default" className="font-semibold text-fg-default">
                감정의 강도는 어떤가요?
              </ThemedText>
              <ThemedText type="default" className="font-semibold text-subtitle">
                슬라이더를 움직여 강도를 조절해 보세요
              </ThemedText>
            </View>
            {/*
              슬라이더 너비: 박스 p-6 안에서 w-full이면 제목과 동일 너비.
              더 좁히려면 mx-4·w-[90%] 등 className 추가 / 더 넓히려면 박스 p-6 축소.
            */}
            <EmotionIntensitySlider
              className="mt-4"
              value={sliderValue}
              onChange={setEmojiScore}
              disabled={!isEmotionSelected}
            />
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={!isEmotionSelected} onPress={handleNext}>
            다음
          </Button>
          <SkipButton onPress={handleSkip} className="items-center py-4" />
        </View>
      </View>
    </View>
  );
}
