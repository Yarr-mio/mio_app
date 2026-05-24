import { BackHeader } from '@/components/layout/BackHeader';
import { Button } from '@/components/ui/Button';
import { CheckinHistoryCard } from '@/features/checkin/components/CheckinHistoryCard';
import { useCheckinToday, useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import type { CheckinRecord } from '@/types/checkin';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

export default function CheckinListScreen() {
  const { data: todayData } = useCheckinToday();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteCheckinList();

  const records: CheckinRecord[] = data?.pages.flatMap((page) => page.data) ?? [];

  const hasAvailableSlots = (todayData?.available_slots.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-midnight">
      <BackHeader title="체크인" />

      <FlatList
        data={records}
        keyExtractor={(item) => item.checkin_id}
        contentContainerClassName="px-5 pb-8 gap-3"
        ListHeaderComponent={
          <>
            {hasAvailableSlots && (
              <View className="bg-surface-md rounded-2xl p-6 mb-4 items-center">
                <Text className="text-4xl mb-3">🌙</Text>
                <Text className="text-white text-base font-semibold mb-2 text-center">
                  오늘의 감정을 기록해요
                </Text>
                <Text className="text-fg-muted text-sm mb-5 text-center">
                  매일 체크인하면 나의 감정 패턴을{'\n'}더 잘 이해할 수 있어요
                </Text>
                <Button size="md" onPress={() => router.push('/(main)/home/checkin/form')}>
                  지금 체크인하기
                </Button>
              </View>
            )}
            <Text className="text-fg-dim text-sm font-medium mb-1">이번 달 기록</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="white" className="mt-8" />
          ) : (
            <Text className="text-fg-ghost text-sm text-center mt-8">
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
