import { useTodoCheckin } from '@/features/todo/hooks/useTodo';

const HOME_TODO_CHECKIN_STATUS = 'completed' as const;

interface CompleteTodoOptions {
  onError?: () => void;
}

export function useHomeRecommendedTodoCheckin() {
  const { mutate, isPending } = useTodoCheckin();

  function completeTodo(todoId: string, options?: CompleteTodoOptions) {
    mutate(
      {
        todoId,
        body: { status: HOME_TODO_CHECKIN_STATUS },
      },
      {
        onError: options?.onError,
      }
    );
  }

  return {
    completeTodo,
    isSubmitting: isPending,
  };
}
