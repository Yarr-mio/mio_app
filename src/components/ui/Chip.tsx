import { Text, View } from 'react-native';

interface ChipProps {
  label: string;
}

/**
 * Chip 색상 토큰 (tailwind.config.js `theme.extend.colors` 기준)
 * - 배경 `bg-sub-tab-inactive-bg` → #FFFFFF0D (#FFFFFF 5%)
 * - 테두리 `border-sub-tab-inactive-border` → #FFFFFF1A (#FFFFFF 10%)
 * - 텍스트 `text-fg-sub` → fg.sub: #FFFFFFCC (white 80%)
 * - 크기 `text-xs` → Tailwind 기본 12px / line-height 16px
 *
 * 기록 카드 등 보조 메타 정보(강도 등) 표시용
 */
export function Chip({ label }: ChipProps) {
  return (
    <View className="rounded-full border border-sub-tab-inactive-border bg-sub-tab-inactive-bg px-2.5 py-0.5">
      <Text className="text-fg-sub text-xs">{label}</Text>
    </View>
  );
}
