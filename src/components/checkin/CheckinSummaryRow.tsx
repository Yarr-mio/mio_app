import { ThemedText } from '@/components/themed/ThemedText';
import { Label } from '@/components/ui/Label';
import { HomeLayout } from '@/constants/theme';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

interface CheckinSummaryRowProps {
  emotionIcon: ImageSourcePropType;
  emotionName: string;
  intensity: number;
  memo?: string | null;
  time: string;
}

export function CheckinSummaryRow({
  emotionIcon,
  emotionName,
  intensity,
  memo,
  time,
}: CheckinSummaryRowProps) {
  const trimmedMemo = memo?.trim();
  const memoText = trimmedMemo ? `"${trimmedMemo}"` : '등록한 메모가 없어요';

  return (
    <View className="flex-row gap-3">
      <Image
        source={emotionIcon}
        style={{ width: HomeLayout.emotionIconSize, height: HomeLayout.emotionIconSize }}
        contentFit="contain"
        accessibilityLabel={emotionName}
      />
      <View className="flex-1 gap-2">
        <View className="flex-row items-center gap-2">
          <ThemedText type="defaultBold" className="text-fg-default">
            {emotionName}
          </ThemedText>
          <Label label={`강도 ${intensity}/5`} />
        </View>
        <ThemedText type="small" className="font-medium text-fg-default" numberOfLines={1}>
          {memoText}
        </ThemedText>
        <ThemedText type="smallMedium" className="font-medium text-fg-muted">
          {time}
        </ThemedText>
      </View>
    </View>
  );
}
