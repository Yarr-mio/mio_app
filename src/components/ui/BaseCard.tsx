import { cn } from '@/utils/cn';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

interface BaseCardProps extends PropsWithChildren {
  className?: string;
}

/**
 * 배경·테두리·border-radius만 담당하는 순수 카드 컨테이너.
 * - bg-surface (#FFFFFF 5%)
 * - border-line (#FFFFFF 10%)
 * - rounded-base-card (15px)
 */
export function BaseCard({ children, className }: BaseCardProps) {
  return (
    <View className={cn('rounded-base-card border border-line bg-surface', className)}>
      {children}
    </View>
  );
}
