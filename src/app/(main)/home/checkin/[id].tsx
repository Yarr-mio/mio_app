import { EMOTION_META } from '@/constants/emotions';
import { IntensitySlider } from '@/features/checkin/components/IntensitySlider';
import { useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import { formatCheckinShortDate, formatCheckinTime } from '@/utils/date';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const { data } = useInfiniteCheckinList();

  const record = data?.pages.flatMap((page) => page.data).find((r) => r.checkin_id === id);

  if (!record) {
    return (
      <View className="flex-1 bg-[#0D0D1A] items-center justify-center" style={{ paddingTop: top }}>
        <Text className="text-white/50">기록을 불러올 수 없어요</Text>
      </View>
    );
  }

  const meta = EMOTION_META[record.emotion_type];
  const isToday = record.created_at.startsWith(new Date().toISOString().split('T')[0]);

  return (
    <View className="flex-1 bg-[#0D0D1A]" style={{ paddingTop: top }}>
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-base">←</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">
          {formatCheckinShortDate(record.created_at)}
        </Text>
        {isToday && (
          <Pressable className="ml-auto">
            <Text className="text-white/50 text-sm">수정</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10 gap-6">
        <View className="bg-white/5 rounded-3xl p-6 items-center border border-white/10 gap-4">
          <Image source={meta.image} style={{ width: 96, height: 96 }} contentFit="contain" />
          <Text className="text-white text-2xl font-bold">{meta.label}</Text>
          <View className="w-full">
            <IntensitySlider value={record.condition_score} disabled />
          </View>
          <Text className="text-white/40 text-sm">{formatCheckinTime(record.created_at)}</Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-white font-semibold">TO DO 달성</Text>
            <Text className="text-white/40 text-sm">자세히 &gt;</Text>
          </View>
          <Text className="text-white/30 text-sm text-center py-6">오늘의 할 일이 없어요</Text>
        </View>

        {record.ai_response !== null && (
          <View className="bg-white/5 rounded-2xl p-4 border border-white/10 gap-2">
            <Text className="text-white/60 text-sm font-medium">AI 응답</Text>
            <Text className="text-white text-sm leading-relaxed">{record.ai_response}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
