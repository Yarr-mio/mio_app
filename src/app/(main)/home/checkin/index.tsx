import { BackHeader } from '@/components/layout/BackHeader';
import { Button } from '@/components/ui/Button';
import { TIME_OF_DAY_META } from '@/constants/checkin';
import { FgColors } from '@/constants/theme';
import { CheckinHistoryCard } from '@/features/checkin/components/CheckinHistoryCard';
import { useCheckinToday, useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import type { CheckinRecord } from '@/types/checkin';
import { getCurrentTimeOfDay } from '@/utils/date';
import { router } from 'expo-router';
import { useRef } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

export default function CheckinListScreen() {
  const { data: todayData } = useCheckinToday();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteCheckinList();
  const isNavigating = useRef(false);

  const records: CheckinRecord[] = data?.pages.flatMap((page) => page.data) ?? [];

  const currentTimeOfDay = getCurrentTimeOfDay();
  const canCheckInNow = todayData?.available_slots.includes(currentTimeOfDay) ?? false;
  const hasCheckedInCurrentSlot = todayData !== undefined && !canCheckInNow;

  return (
    <View className="flex-1 bg-midnight">
      <BackHeader title="체크인" />

      <FlatList
        data={records}
        keyExtractor={(item) => item.checkin_id}
        contentContainerClassName="px-5 pb-8 gap-3"
        ListHeaderComponent={
          <>
            {canCheckInNow && (
              <View className="bg-surface border border-line rounded-card p-6 mb-4 items-center">
                <Text className="text-4xl mb-3">{TIME_OF_DAY_META[currentTimeOfDay].emoji}</Text>
                <Text className="text-fg-default text-base font-semibold mb-2 text-center">
                  오늘의 감정을 기록해요
                </Text>
                <Text className="text-fg-muted text-sm mb-5 text-center">
                  매일 체크인하면 나의 감정 패턴을{'\n'}더 잘 이해할 수 있어요
                </Text>
                <Button
                  size="md"
                  onPress={() => {
                    useCheckinStore.getState().reset();
                    router.push('/(main)/home/checkin/form');
                  }}
                >
                  지금 체크인하기
                </Button>
              </View>
            )}
            {hasCheckedInCurrentSlot && (
              <View className="bg-surface border border-line rounded-card p-6 mb-4 items-center">
                <Text className="text-4xl mb-3">🙂</Text>
                <Text className="text-fg-default text-base font-semibold mb-2 text-center">
                  체크인을 완료했습니다!
                </Text>
                <Text className="text-fg-muted text-sm mb-5 text-center">
                  마음을 들여다보는 시간을 가졌어요{'\n'}다음 체크인 시간에 다시 만나요
                </Text>
                <Button size="md" disabled>
                  체크인 완료
                </Button>
              </View>
            )}
            <Text className="text-fg-dim text-sm font-medium mb-1">이번 달 기록</Text>
          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={FgColors.default} className="mt-8" />
          ) : (
            <Text className="text-fg-ghost text-sm text-center mt-8">
              아직 체크인 기록이 없어요
            </Text>
          )
        }
        renderItem={({ item }) => (
          <CheckinHistoryCard
            record={item}
            onPress={() => {
              if (isNavigating.current) return;
              isNavigating.current = true;
              router.push(`/(main)/home/checkin/${item.checkin_id}`);
              setTimeout(() => {
                isNavigating.current = false;
              }, 500);
            }}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={FgColors.default} className="mt-4" />
          ) : null
        }
      />
    </View>
  );
}
