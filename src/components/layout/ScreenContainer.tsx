/**
 * 화면 최상위 컨테이너
 * - 노치/다이나믹 아일랜드/홈바 등 기기별 safe-area 패딩을 자동 처리
 * - 좌우 패딩·배경색 등 화면별 스타일은 className으로 직접 지정
 * - useSafeAreaInsets()를 매 화면마다 반복 작성하지 않아도 되도록 추상화
 */
import { ScreenSpacing } from '@/constants/theme';
import { cn } from '@/utils/cn';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenContainerProps extends PropsWithChildren {
  className?: string;
  withTopInset?: boolean;
  withBottomInset?: boolean;
  bottomInsetMin?: number;
}

export function ScreenContainer({
  children,
  className,
  withTopInset = true,
  withBottomInset = true,
  bottomInsetMin = ScreenSpacing.bottomInsetMin,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('flex-1', className)}
      style={{
        paddingTop: withTopInset ? insets.top : 0,
        paddingBottom: withBottomInset ? Math.max(insets.bottom, bottomInsetMin) : 0,
      }}
    >
      {children}
    </View>
  );
}
