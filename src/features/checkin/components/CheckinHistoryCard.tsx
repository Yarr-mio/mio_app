import { ChevronRightIcon } from '@/assets/icons';
import { Chip } from '@/components/ui/Chip';
import { EMOTION_META } from '@/constants/emotions';
import { FgColors } from '@/constants/theme';
import type { CheckinRecord } from '@/types/checkin';
import { formatCheckinFullDate, formatCheckinTime } from '@/utils/date';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

interface CheckinHistoryCardProps {
  record: CheckinRecord;
  onPress: () => void;
}

export function CheckinHistoryCard({ record, onPress }: CheckinHistoryCardProps) {
  const meta = EMOTION_META[record.emotion_type];

  return (
    <Pressable onPress={onPress} className="bg-surface rounded-2xl p-4 border border-line">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-fg-dim text-sm">{formatCheckinFullDate(record.created_at)}</Text>
        <View className="flex-row items-center gap-0.5">
          <Text className="text-fg-faint text-sm">자세히</Text>
          <ChevronRightIcon width={14} height={14} color={FgColors.faint} />
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Image source={meta.image} style={{ width: 52, height: 52 }} contentFit="contain" />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-white font-medium">{meta.label}</Text>
            <Chip label={`강도 ${record.condition_score}/5`} />
          </View>
          {record.ai_response ? (
            <Text className="text-fg-dim text-xs" numberOfLines={1}>
              &ldquo;{record.ai_response}&rdquo;
            </Text>
          ) : null}
          <Text className="text-fg-faint text-xs text-left">
            {formatCheckinTime(record.created_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
