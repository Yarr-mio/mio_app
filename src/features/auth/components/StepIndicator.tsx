import { View } from 'react-native';

import { cn } from '@/utils/cn';

export interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;

        return (
          <View
            key={step}
            className={cn('h-2 rounded-full', isActive ? 'w-6 bg-accent' : 'w-2 bg-accent/20')}
          />
        );
      })}
    </View>
  );
}
