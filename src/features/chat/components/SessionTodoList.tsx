import { ThemedText } from '@/components/themed/ThemedText';
import type { SessionTodoItem } from '@/types/chat';
import { View } from 'react-native';

interface SessionTodoListProps {
  todos: SessionTodoItem[];
}

// 체크인/완료 처리 없음 — SessionTodoItem엔 status가 없어 읽기 전용 표시만 가능 (Home/Todo 본 기능은 별도 트랙)
export function SessionTodoList({ todos }: SessionTodoListProps) {
  return (
    <View className="gap-3">
      {todos.map((todo) => (
        <View key={todo.todo_id} className="gap-1">
          <ThemedText type="default" className="text-fg-sub">
            {todo.action_text}
          </ThemedText>
          <ThemedText type="small" className="text-chat-subtext">
            {todo.category} · 난이도 {todo.difficulty}/5 · {todo.estimated_minutes}분
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
