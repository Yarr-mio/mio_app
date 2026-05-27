import { ArrowLeftIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { HeaderColors, HeaderLayout, PressableConfig } from '@/constants/theme';
import { OnboardingProgressBar } from '@/features/onboarding/components/OnboardingProgressBar';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingHeader({ currentStep, totalSteps }: OnboardingHeaderProps) {
  const stepLabel = `${currentStep}/${totalSteps}`;

  return (
    <View className="pb-3">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          accessibilityHint="이전 화면으로 이동합니다"
          className="h-10 w-10 items-center justify-center"
          hitSlop={PressableConfig.hitSlop}
        >
          <ArrowLeftIcon
            width={HeaderLayout.backIconSize}
            height={HeaderLayout.backIconSize}
            color={HeaderColors.backIcon}
          />
        </Pressable>

        <ThemedText type="smallTitle" className="text-step-muted">
          {stepLabel}
        </ThemedText>
      </View>

      <View className="mt-3 w-full">
        <OnboardingProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </View>
    </View>
  );
}
