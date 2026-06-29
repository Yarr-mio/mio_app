import { PressableConfig } from '@/constants/theme';
import { Pressable, Text } from 'react-native';

interface HeaderActionButtonProps {
  label: string;
  onPress: () => void;
}

/**
 * BackHeader의 rightAction 슬롯 전용 버튼.
 * 래퍼 View는 장식 없이 위치만 잡아주므로, 테두리/배경은 이 컴포넌트가 직접 그린다.
 * 높이는 BackHeader 왼쪽 뒤로가기 버튼(HeaderLayout.backButtonSize, 35)과 맞춰 행 안에서 수직 정렬을 맞춘다.
 */
export function HeaderActionButton({ label, onPress }: HeaderActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={PressableConfig.hitSlop}
      className="h-[35px] w-14 items-center justify-center rounded-full border border-line bg-surface"
    >
      <Text className="text-fg text-sm font-bold">{label}</Text>
    </Pressable>
  );
}
