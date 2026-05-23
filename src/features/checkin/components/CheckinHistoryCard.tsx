import { EmotionBadge } from '@/components/emotion/EmotionBadge';
import type { CheckinRecord } from '@/types/checkin';
import { formatCheckinFullDate, formatCheckinTime } from '@/utils/date';
import { Pressable, Text, View } from 'react-native';

interface CheckinHistoryCardProps {
  record: CheckinRecord;
  onPress: () => void;
}

export function CheckinHistoryCard({ record, onPress }: CheckinHistoryCardProps) {
  return (
    <Pressable onPress={onPress} className="bg-white/5 rounded-2xl p-4 border border-white/10">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white/60 text-sm">{formatCheckinFullDate(record.created_at)}</Text>
        <Text className="text-white/40 text-sm">자세히 &gt;</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <EmotionBadge
          emotionType={record.emotion_type}
          conditionScore={record.condition_score}
          size="sm"
        />
        <Text className="text-white/40 text-xs">{formatCheckinTime(record.created_at)}</Text>
      </View>
    </Pressable>
  );
}
