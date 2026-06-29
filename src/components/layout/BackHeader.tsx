import { ArrowLeftIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { FgColors, HeaderClasses, HeaderLayout, PressableConfig } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BackHeaderProps {
  title: string;
  rightAction?: ReactNode;
}

export function BackHeader({ title, rightAction }: BackHeaderProps) {
  const { top } = useSafeAreaInsets();

  return (
    <View
      className={HeaderClasses.wrapper}
      style={{ paddingTop: top + HeaderLayout.topInsetExtra }}
    >
      <View className={HeaderClasses.row}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          accessibilityHint="이전 화면으로 이동합니다"
          className={cn(HeaderClasses.backButton, 'z-10')}
          hitSlop={PressableConfig.hitSlop}
        >
          <ArrowLeftIcon
            width={HeaderLayout.backHeaderIconSize}
            height={HeaderLayout.backHeaderIconSize}
            color={FgColors.default}
          />
        </Pressable>

        <View className={HeaderClasses.titleOverlay}>
          <ThemedText type="pageTitle" className="text-center text-fg" numberOfLines={1}>
            {title}
          </ThemedText>
        </View>

        {rightAction && <View className="z-10 items-center justify-center">{rightAction}</View>}
      </View>
    </View>
  );
}
