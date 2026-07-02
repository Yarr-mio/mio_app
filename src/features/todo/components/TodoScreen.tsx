import { BackHeader } from '@/components/layout/BackHeader';
import { ThemedText } from '@/components/themed/ThemedText';
import { ButtonColors, HomeCardClasses, TodoCardClasses } from '@/constants/theme';
import { TODO_EMPTY_STATE_MESSAGE, TODO_SCREEN_TITLE } from '@/constants/todo';
import { TodoDateNavigator } from '@/features/todo/components/TodoDateNavigator';
import { TodoItemCard } from '@/features/todo/components/TodoItemCard';
import { useTodos } from '@/features/todo/hooks/useTodo';
import { formatCheckinFullDate, getDateIso, shiftDate } from '@/utils/date';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

export function TodoScreen() {
  const [date, setDate] = useState(() => new Date());
  const { data: todos, isPending } = useTodos(getDateIso(date));

  return (
    <View className="flex-1 bg-midnight">
      <BackHeader title={TODO_SCREEN_TITLE} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow gap-4 px-8 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <TodoDateNavigator
          label={formatCheckinFullDate(date.toISOString())}
          onPrevious={() => setDate((prev) => shiftDate(prev, -1))}
          onNext={() => setDate((prev) => shiftDate(prev, 1))}
        />

        {isPending ? (
          <View className={HomeCardClasses.emptyState}>
            <ActivityIndicator color={ButtonColors.spinnerLight} />
          </View>
        ) : todos && todos.length > 0 ? (
          <View className={TodoCardClasses.list}>
            {todos.map((todo) => (
              <TodoItemCard key={todo.todo_id} todo={todo} />
            ))}
          </View>
        ) : (
          <View className={HomeCardClasses.emptyState}>
            <ThemedText type="small" className="text-label">
              {TODO_EMPTY_STATE_MESSAGE}
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
