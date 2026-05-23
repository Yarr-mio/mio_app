import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  fetchCheckinList,
  fetchCheckinToday,
  submitCheckin,
  updateCheckin,
} from '@/api/endpoints/checkin';
import { queryKeys } from '@/api/queryKeys';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import type { SubmitCheckinBody, UpdateCheckinBody } from '@/types/checkin';

export function useCheckinToday() {
  return useQuery({
    queryKey: queryKeys.checkin.today(),
    queryFn: fetchCheckinToday,
  });
}

export function useInfiniteCheckinList(from?: string, to?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.checkin.list(from, to),
    queryFn: ({ pageParam }) =>
      fetchCheckinList({ cursor: pageParam as string | undefined, from, to }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
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
