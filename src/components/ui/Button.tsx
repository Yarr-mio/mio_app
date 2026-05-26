import { ButtonColors } from '@/constants/theme';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'white';
  size?: 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}

export function Button({
  onPress,
  disabled,
  loading,
  variant = 'primary',
  size = 'lg',
  children,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'w-full items-center justify-center',
        size === 'md' ? 'h-12 rounded-xl' : 'h-16 rounded-2xl',
        variant === 'primary' && 'bg-primary',
        variant === 'ghost' && 'border border-line-md',
        variant === 'white' && 'bg-white',
        isDisabled && 'bg-btn-disabled',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'white' ? ButtonColors.spinnerDark : ButtonColors.spinnerLight}
          size="small"
        />
      ) : (
        <Text
          className={cn(
            'font-semibold',
            size === 'md' ? 'text-sm' : 'text-lg',
            variant === 'primary' && 'text-white',
            variant === 'ghost' && 'text-fg',
            variant === 'white' && 'text-midnight'
          )}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
