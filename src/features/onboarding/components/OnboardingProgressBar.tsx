import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgressBar({ currentStep, totalSteps }: OnboardingProgressBarProps) {
  return (
    // 프로그레스 바 높이 h-1
    <View className="h-[10px] w-full flex-row overflow-hidden rounded-full">
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={`onboarding-progress-step-${index + 1}`}
          className={cn(
            'h-full flex-1',
            index < currentStep ? 'bg-accent' : 'bg-progress-inactive'
          )}
        />
      ))}
    </View>
  );
}
