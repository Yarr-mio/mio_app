import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  fetchCheckinDetail,
  fetchCheckinList,
  fetchCheckinToday,
  submitCheckin,
  updateCheckin,
} from '@/api/endpoints/checkin';
import { queryKeys } from '@/api/queryKeys';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import type { CheckinRecord, SubmitCheckinBody, UpdateCheckinBody } from '@/types/checkin';

export function useCheckinToday() {
  return useQuery({
    queryKey: queryKeys.checkin.today(),
    queryFn: fetchCheckinToday,
  });
}

export function useInfiniteCheckinList() {
  return useInfiniteQuery({
    queryKey: queryKeys.checkin.list(),
    queryFn: ({ pageParam }) => fetchCheckinList({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

export function useCheckinDetail(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.checkin.detail(id),
    queryFn: () => fetchCheckinDetail(id),
    initialData: () => {
      const queries = queryClient.getQueriesData<
        InfiniteData<{ data: CheckinRecord[]; next_cursor: string | null; has_more: boolean }>
      >({ queryKey: ['checkin', 'list'] });

      for (const [, data] of queries) {
        const found = data?.pages.flatMap((page) => page.data).find((r) => r.checkin_id === id);
        if (found) return found;
      }
      return undefined;
    },
    // 캐시 히트 시에도 백그라운드 리페치로 최신 데이터 보장
    initialDataUpdatedAt: 0,
  });
}

export function useSubmitCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SubmitCheckinBody) => {
      const idempotencyKey = `${Date.now()}-${Math.random()}`;
      return submitCheckin(body, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkin.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkin.all() });
      useCheckinStore.getState().reset();
      router.back();
    },
  });
}

export function useUpdateCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checkinId, body }: { checkinId: string; body: UpdateCheckinBody }) =>
      updateCheckin(checkinId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkin.today() });
      queryClient.invalidateQueries({ queryKey: queryKeys.checkin.all() });
      router.back();
    },
  });
}
