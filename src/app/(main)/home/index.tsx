import { useCheckinToday } from '@/features/checkin/hooks/useCheckin';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { data: todayData, isPending } = useCheckinToday();

  const hasAvailableSlots = (todayData?.available_slots.length ?? 0) > 0;
  const isCompleted = !isPending && !hasAvailableSlots;

  return (
    <View className="flex-1 bg-midnight" style={{ paddingTop: top }}>
      <View className="px-5 py-4">
        <Text className="text-white text-xl font-bold">홈</Text>
      </View>

      <View className="px-5">
        <Pressable
          onPress={() => router.push('/(main)/home/checkin')}
          disabled={isPending || isCompleted}
          className="bg-surface-md rounded-2xl p-5 border border-line-md disabled:opacity-40"
        >
          <Text className="text-white font-semibold text-base mb-1">
            {isCompleted ? '오늘 체크인 완료 ✓' : '오늘의 체크인'}
          </Text>
          <Text className="text-fg-muted text-sm">
            {isPending
              ? '불러오는 중...'
              : isCompleted
                ? '내일 다시 체크인할 수 있어요'
                : '지금 감정을 기록해보세요'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
