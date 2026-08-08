import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { FgColors, HomeActionClasses, HomeLayout } from '@/constants/theme';
import { useHomeRecommendedTodoDisplay } from '@/features/home/hooks/useHomeRecommendedTodoDisplay';
import type { TodoResponse, TodoStatus } from '@/types/todo';
import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';

const HOME_TODO_ACTIONABLE_STATUS: TodoStatus = 'suggested';

interface HomeRecommendedActionsListProps {
  actions: TodoResponse[];
  isSubmitting: boolean;
  onCompleteTodo: (todoId: string, options?: { onError?: () => void }) => void;
}

interface RecommendedActionCheckboxProps {
  done: boolean;
}

function RecommendedActionCheckbox({ done }: RecommendedActionCheckboxProps) {
  return (
    <View
      className={cn(
        HomeActionClasses.recommendedCheckbox,
        'items-center justify-center rounded-full',
        done ? 'bg-accent' : 'border border-fg-default/30 bg-transparent'
      )}
    >
      {done ? (
        <CheckboxCheckIcon
          width={HomeLayout.checkboxCheckWidth}
          height={HomeLayout.checkboxCheckHeight}
          color={FgColors.default}
        />
      ) : null}
    </View>
  );
}

function canCompleteFromHome(status: TodoStatus): boolean {
  return status === HOME_TODO_ACTIONABLE_STATUS;
}

interface RecommendedActionItemProps {
  text: string;
  done: boolean;
  disabled: boolean;
  onPress: () => void;
}

function RecommendedActionItem({ text, done, disabled, onPress }: RecommendedActionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done, disabled }}
      accessibilityLabel={`${text}, ${done ? '완료' : '미완료'}`}
      className="flex-row items-center gap-3"
    >
      <RecommendedActionCheckbox done={done} />
      <ThemedText
        type="small"
        className={cn('flex-1', done ? 'text-label line-through' : 'text-fg-default')}
      >
        {text}
      </ThemedText>
    </Pressable>
  );
}

export function HomeRecommendedActionsList({
  actions,
  isSubmitting,
  onCompleteTodo,
}: HomeRecommendedActionsListProps) {
  const { displayedTodos, completeDisplayedTodo, isDisplayedTodoDone } =
    useHomeRecommendedTodoDisplay({
      allTodos: actions,
      onCompleteTodo,
    });

  return (
    <View className="gap-4">
      {displayedTodos.map((action) => {
        const done = isDisplayedTodoDone(action.todo_id);
        const actionable = canCompleteFromHome(action.status) && !done;

        return (
          <RecommendedActionItem
            key={action.todo_id}
            text={action.action_text}
            done={done}
            disabled={!actionable || isSubmitting}
            onPress={() => {
              if (!actionable || isSubmitting) {
                return;
              }
              completeDisplayedTodo(action.todo_id);
            }}
          />
        );
      })}
    </View>
  );
}
