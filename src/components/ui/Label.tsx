import { Text, View } from 'react-native';

interface LabelProps {
  label: string;
}

/**
 * Label 색상 토큰 (tailwind.config.js `theme.extend.colors` 기준)
 * - 배경 `bg-label-bg` → label-bg: #9D7FEE33 (#9D7FEE 20%)
 * - 테두리 `border-label-border` → label-border: #D8D0F833 (#D8D0F8 20%)
 * - 텍스트 `text-label-text` → label-text: #9F92F3
 * - 크기 `text-xs` → Tailwind 기본 12px / line-height 16px
 *
 * 감정 강도, 선택 감정, 캐릭터 전문 분야 등 라벨 형태 UI에 사용
 */
export function Label({ label }: LabelProps) {
  return (
    <View className="self-start rounded-full border border-label-border bg-label-bg px-2.5 py-0.5">
      <Text className="text-label-text text-xs">{label}</Text>
    </View>
  );
}
