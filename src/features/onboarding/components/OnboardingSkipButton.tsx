import { ThemedText } from '@/components/themed/ThemedText';
import { PressableConfig } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Pressable } from 'react-native';

interface OnboardingSkipButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export function OnboardingSkipButton({
  label,
  onPress,
  disabled,
  className,
}: OnboardingSkipButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      className={cn(disabled && 'opacity-40', className)}
      hitSlop={PressableConfig.hitSlop}
    >
      <ThemedText type="default" className="text-subtitle">
        {label}
      </ThemedText>
    </Pressable>
  );
}
