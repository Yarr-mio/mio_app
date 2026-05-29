import { ThemedText } from '@/components/themed/ThemedText';
import { PressableConfig } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Pressable } from 'react-native';

interface OnboardingSkipButtonProps {
  label: string;
  onPress: () => void;
  className?: string;
}

export function OnboardingSkipButton({ label, onPress, className }: OnboardingSkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={cn(className)}
      hitSlop={PressableConfig.hitSlop}
    >
      <ThemedText type="default" className="text-subtitle">
        {label}
      </ThemedText>
    </Pressable>
  );
}
