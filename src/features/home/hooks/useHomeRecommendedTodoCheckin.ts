import { useTodoCheckin } from '@/features/todo/hooks/useTodo';

const HOME_TODO_CHECKIN_STATUS = 'completed' as const;

export function useHomeRecommendedTodoCheckin() {
  const { mutate, isPending } = useTodoCheckin();

  function completeTodo(todoId: string) {
    mutate({
      todoId,
      body: { status: HOME_TODO_CHECKIN_STATUS },
    });
  }

  return {
    completeTodo,
    isSubmitting: isPending,
  };
}
