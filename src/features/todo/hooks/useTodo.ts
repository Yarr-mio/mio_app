import { track } from '@/analytics/track';
import { checkinTodo, fetchTodos } from '@/api/endpoints/todo';
import { queryKeys } from '@/api/queryKeys';
import { HTTP_STATUS } from '@/constants/config';
import type { TodoCheckinRequest } from '@/types/todo';
import { readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';
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
    onSuccess: (_data, variables) => {
      // chat_session_id는 TodoResponse에 세션 참조가 없어 BE가 노출할 때까지 생략한다.
      // 감정 3필드는 현재 UI가 수집하지 않아 사실상 null — 억지로 채우지 않는다
      const { before_emotion, after_emotion, feedback } = variables.body;
      track('todo_checked_in', {
        todo_id: variables.todoId,
        task_status: variables.body.status,
        emotion_before: before_emotion ?? null,
        emotion_after: after_emotion ?? null,
        emotion_delta:
          before_emotion !== undefined && after_emotion !== undefined
            ? after_emotion - before_emotion
            : null,
        has_feedback: Boolean(feedback?.trim()),
      });

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
