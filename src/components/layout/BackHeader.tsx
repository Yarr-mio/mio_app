import { ArrowLeftIcon } from '@/assets/icons';
import { FgColors } from '@/constants/theme';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  rightAction?: ReactNode;
};

export function BackHeader({ title, rightAction }: Props) {
  const { top } = useSafeAreaInsets();

  return (
    <View className="flex-row items-center px-5 pb-3" style={{ paddingTop: top + 12 }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        accessibilityHint="이전 화면으로 이동합니다"
        className="w-10 h-10 items-center justify-center"
        hitSlop={8}
      >
        <ArrowLeftIcon width={20} height={20} color={FgColors.default} />
      </Pressable>
      </Pressable>

      <Text className="flex-1 text-white text-lg font-semibold text-center">{title}</Text>

      <View className="w-10 items-end">{rightAction}</View>
    </View>
  );
}
