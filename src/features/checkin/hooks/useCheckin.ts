import {
  fetchCheckinDetail,
  fetchCheckinList,
  fetchCheckinToday,
  submitCheckin,
  updateCheckin,
} from '@/api/endpoints/checkin';
import { invalidateCheckinRelatedQueries } from '@/api/invalidateReportQueries';
import { queryKeys } from '@/api/queryKeys';
import { HTTP_STATUS } from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import type { CheckinRecord, SubmitCheckinBody, UpdateCheckinBody } from '@/types/checkin';
import { readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const CHECKIN_SUBMIT_ERROR_MESSAGE = '체크인 등록에 실패했어요. 다시 시도해 주세요.';
const CHECKIN_UPDATE_ERROR_MESSAGE = '체크인 수정에 실패했어요. 다시 시도해 주세요.';

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
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
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
      void invalidateCheckinRelatedQueries(queryClient);
      useCheckinStore.getState().reset();
      router.back();
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.CONFLICT && errorCode === 'ALREADY_CHECKED_IN') {
        void invalidateCheckinRelatedQueries(queryClient);
        Alert.alert('이미 체크인했어요', '같은 시간대에는 한 번만 체크인할 수 있어요.');
        router.back();
        return;
      }

      if (status === HTTP_STATUS.FORBIDDEN && errorCode === 'ONBOARDING_REQUIRED') {
        Alert.alert('온보딩이 필요해요', '체크인을 시작하기 전에 캐릭터 선택을 완료해 주세요.');
        router.replace(AUTH_ROUTES.signupCharacter);
        return;
      }

      if (status === HTTP_STATUS.TOO_MANY_REQUESTS) {
        Alert.alert('잠시 후 다시 시도해 주세요', '체크인 요청이 너무 많아요.');
        return;
      }

      Alert.alert(CHECKIN_SUBMIT_ERROR_MESSAGE);
    },
  });
}

export function useUpdateCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checkinId, body }: { checkinId: string; body: UpdateCheckinBody }) =>
      updateCheckin(checkinId, body),
    onSuccess: () => {
      void invalidateCheckinRelatedQueries(queryClient);
      useCheckinStore.getState().reset();
      router.back();
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY && errorCode === 'BUSINESS_RULE_VIOLATION') {
        Alert.alert('수정할 수 없어요', '당일 작성한 기록만 수정할 수 있어요.');
        return;
      }

      if (status === HTTP_STATUS.FORBIDDEN || status === HTTP_STATUS.NOT_FOUND) {
        Alert.alert('기록을 찾을 수 없어요', '수정할 수 없는 체크인이에요.');
        router.back();
        return;
      }

      Alert.alert(CHECKIN_UPDATE_ERROR_MESSAGE);
    },
  });
}
