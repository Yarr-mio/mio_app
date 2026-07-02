import { checkinTodo, fetchTodos } from '@/api/endpoints/todo';
import { queryKeys } from '@/api/queryKeys';
import { HTTP_STATUS } from '@/constants/config';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';
import type { TodoCheckinRequest } from '@/types/todo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

const TODO_CHECKIN_ERROR_TITLE = '체크인 실패';
const TODO_CHECKIN_ERROR_MESSAGE = '처리에 실패했어요. 다시 시도해 주세요.';

export function useTodos(date: string) {
  return useQuery({
    queryKey: queryKeys.todo.list(date),
    queryFn: () => fetchTodos(date),
    enabled: date.length > 0,
  });
}

export function useTodoCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, body }: { todoId: string; body: TodoCheckinRequest }) =>
      checkinTodo(todoId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todo.all() });
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.CONFLICT && errorCode === 'TODO_ALREADY_COMPLETED') {
        queryClient.invalidateQueries({ queryKey: queryKeys.todo.all() });
        Alert.alert('이미 처리됐어요', '이미 완료 처리된 할 일이에요.');
        return;
      }

      if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY && errorCode === 'TODO_EXPIRED') {
        queryClient.invalidateQueries({ queryKey: queryKeys.todo.all() });
        Alert.alert('만료된 할 일이에요', '기한이 지나 더 이상 처리할 수 없어요.');
        return;
      }

      Alert.alert(TODO_CHECKIN_ERROR_TITLE, TODO_CHECKIN_ERROR_MESSAGE);
    },
  });
}
