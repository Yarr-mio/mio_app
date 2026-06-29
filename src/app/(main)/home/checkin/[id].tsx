import { BackHeader } from '@/components/layout/BackHeader';
import { EMOTION_META } from '@/constants/emotions';
import { DiaryInput } from '@/features/checkin/components/DiaryInput';
import { IntensitySlider } from '@/features/checkin/components/IntensitySlider';
import { useCheckinDetail } from '@/features/checkin/hooks/useCheckin';
import { formatCheckinShortDate, formatCheckinTime, isToday } from '@/utils/date';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const { data: record, isPending, isError } = useCheckinDetail(id);

  if (isPending) {
    return (
      <View className="flex-1 bg-midnight items-center justify-center" style={{ paddingTop: top }}>
        <Text className="text-fg-muted">불러오는 중...</Text>
      </View>
    );
  }

  if (isError || !record) {
    return (
      <View className="flex-1 bg-midnight items-center justify-center" style={{ paddingTop: top }}>
        <Text className="text-fg-muted">기록을 불러올 수 없어요</Text>
      </View>
    );
  }

  const meta = EMOTION_META[record.emotion_type];
  const today = isToday(record.created_at);

  return (
    <View className="flex-1 bg-midnight">
      <BackHeader
        title={formatCheckinShortDate(record.created_at)}
        rightAction={today ? <Text className="text-fg-muted text-sm">수정</Text> : undefined}
      />

      <ScrollView contentContainerClassName="px-5 pb-10 gap-6">
        <View className="bg-surface rounded-3xl p-6 items-center border border-line gap-4">
          <Image source={meta.image} style={{ width: 96, height: 96 }} contentFit="contain" />
          <Text className="text-white text-2xl font-bold">{meta.label}</Text>
          <View className="w-full">
            <IntensitySlider value={record.condition_score} disabled />
          </View>
          <Text className="text-fg-faint text-sm">{formatCheckinTime(record.created_at)}</Text>
        </View>

        {record.memo ? (
          <View className="gap-3">
            <Text className="text-white font-semibold">오늘의 메모</Text>
            <DiaryInput value={record.memo} editable={false} />
          </View>
        ) : null}

        {record.ai_response !== null && (
          <View className="bg-surface rounded-2xl p-4 border border-line gap-2">
            <Text className="text-fg-dim text-sm font-medium">AI 응답</Text>
            <Text className="text-white text-sm leading-relaxed">{record.ai_response}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
