import { CheckinHistoryCard } from '@/features/checkin/components/CheckinHistoryCard';
import { useCheckinToday, useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import type { CheckinRecord } from '@/types/checkin';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckinListScreen() {
  const { top } = useSafeAreaInsets();
  const { data: todayData } = useCheckinToday();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteCheckinList();

  const records: CheckinRecord[] = data?.pages.flatMap((page) => page.data) ?? [];

  const hasAvailableSlots = (todayData?.available_slots.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-[#0D0D1A]" style={{ paddingTop: top }}>
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-base">←</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">체크인</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.checkin_id}
        contentContainerClassName="px-5 pb-8 gap-3"
        ListHeaderComponent={
          <>
            {hasAvailableSlots && (
              <View className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-4">
                <Text className="text-white text-base font-semibold mb-1">
                  🌙 오늘의 감정을 기록해요
                </Text>
                <Text className="text-white/50 text-sm mb-4">
                  매일 체크인하면 나의 감정 패턴을 알 수 있어요
                </Text>
                <Pressable
                  onPress={() => router.push('/(main)/home/checkin/form')}
                  className="bg-white rounded-xl py-3 items-center"
                >
                  <Text className="text-[#0D0D1A] font-semibold text-sm">지금 체크인하기</Text>
                </Pressable>
              </View>
            )}
            <Text className="text-white/60 text-sm font-medium mb-1">이번 달 기록</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="white" className="mt-8" />
          ) : (
            <Text className="text-white/30 text-sm text-center mt-8">
              아직 체크인 기록이 없어요
            </Text>
          )
        }
        renderItem={({ item }) => (
          <CheckinHistoryCard
            record={item}
            onPress={() => router.push(`/(main)/home/checkin/${item.checkin_id}`)}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color="white" className="mt-4" /> : null
        }
      />
    </View>
  );
}
