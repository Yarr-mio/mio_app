import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { HOME_RECOMMENDED_TODO_MAX_COUNT } from '@/constants/home';
import { FgColors, HomeActionClasses, HomeLayout } from '@/constants/theme';
import { resolveStableHomeTodoOrder } from '@/features/home/utils/resolveStableHomeTodoOrder';
import type { TodoResponse, TodoStatus } from '@/types/todo';
import { cn } from '@/utils/cn';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';

const HOME_TODO_ACTIONABLE_STATUS: TodoStatus = 'suggested';

interface HomeRecommendedActionsListProps {
  actions: TodoResponse[];
  isSubmitting: boolean;
  onCompleteTodo: (todoId: string) => void;
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

function isTodoDone(status: TodoStatus): boolean {
  return status === 'completed' || status === 'partial_completed';
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
  const orderIdsRef = useRef<string[]>([]);
  const idSetKeyRef = useRef('');

  const { orderedActions, orderIds, idSetKey } = resolveStableHomeTodoOrder(
    actions,
    orderIdsRef.current,
    idSetKeyRef.current
  );
  // 홈 카드 표시용 개수 제한함
  const visibleActions = orderedActions.slice(0, HOME_RECOMMENDED_TODO_MAX_COUNT);

  useEffect(() => {
    orderIdsRef.current = orderIds;
    idSetKeyRef.current = idSetKey;
  }, [idSetKey, orderIds]);

  return (
    <View className="gap-4">
      {visibleActions.map((action) => {
        const done = isTodoDone(action.status);
        const actionable = canCompleteFromHome(action.status);

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
              onCompleteTodo(action.todo_id);
            }}
          />
        );
      })}
    </View>
  );
}
