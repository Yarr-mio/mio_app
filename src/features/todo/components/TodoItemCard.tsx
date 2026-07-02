import { ThemedText } from '@/components/themed/ThemedText';
import { TodoCardClasses } from '@/constants/theme';
import { TodoStatusActions } from '@/features/todo/components/TodoStatusActions';
import { useTodoCheckin } from '@/features/todo/hooks/useTodo';
import type { TodoResponse } from '@/types/todo';
import { View } from 'react-native';

interface TodoItemCardProps {
  todo: TodoResponse;
}

export function TodoItemCard({ todo }: TodoItemCardProps) {
  const { mutate, isPending } = useTodoCheckin();

  return (
    <View className={TodoCardClasses.container}>
      <ThemedText type="defaultBold" className={TodoCardClasses.title}>
        {todo.action_text}
      </ThemedText>
      <ThemedText type="small" className={TodoCardClasses.meta}>
        {todo.category} · 난이도 {todo.difficulty}/5 · {todo.estimated_minutes}분
      </ThemedText>
      <TodoStatusActions
        status={todo.status}
        isSubmitting={isPending}
        onSelect={(status) => mutate({ todoId: todo.todo_id, body: { status } })}
      />
    </View>
  );
}
