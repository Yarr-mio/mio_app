import { cn } from '@/utils/cn';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

interface BaseCardProps extends PropsWithChildren {
  className?: string;
}

/**
 * TODO: develop 브랜치 merge 후 중복 파일 제거 — develop의 BaseCard.tsx를 사용하고 이 파일 삭제
 *
 * 배경/테두리/border-radius만 담당하는 순수 카드 컨테이너
 */
export function BaseCard({ children, className }: BaseCardProps) {
  return (
    <View className={cn('rounded-base-card border border-line bg-surface', className)}>
      {children}
    </View>
  );
}
