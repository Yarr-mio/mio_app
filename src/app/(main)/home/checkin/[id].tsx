import { ChevronRightIcon } from '@/assets/icons';
import { BackHeader } from '@/components/layout/BackHeader';
import { EMOTION_META } from '@/constants/emotions';
import { FgColors } from '@/constants/theme';
import { IntensitySlider } from '@/features/checkin/components/IntensitySlider';
import { useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import { formatCheckinShortDate, formatCheckinTime, isToday } from '@/utils/date';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const { data } = useInfiniteCheckinList();

  const record = data?.pages.flatMap((page) => page.data).find((r) => r.checkin_id === id);

  if (!record) {
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

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-semibold">TO DO 달성</Text>
            <View className="flex-row items-center gap-0.5">
              <Text className="text-fg-faint text-sm">자세히</Text>
              <ChevronRightIcon width={14} height={14} color={FgColors.faint} />
            </View>
          </View>
          <Text className="text-fg-ghost text-sm text-center py-6">오늘의 할 일이 없어요</Text>
        </View>

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
