import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { FgColors, HomeActionClasses, HomeLayout } from '@/constants/theme';
import type { TodoResponse } from '@/types/todo';
import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface HomeRecommendedActionsListProps {
  actions: TodoResponse[];
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

function isTodoDone(status: TodoResponse['status']): boolean {
  return status === 'completed' || status === 'partial_completed';
}

interface RecommendedActionItemProps {
  text: string;
  done: boolean;
}

function RecommendedActionItem({ text, done }: RecommendedActionItemProps) {
  return (
    <View
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      className="flex-row items-center gap-3"
    >
      <RecommendedActionCheckbox done={done} />
      <ThemedText
        type="small"
        className={cn('flex-1', done ? 'text-label line-through' : 'text-fg-default')}
      >
        {text}
      </ThemedText>
    </View>
  );
}

export function HomeRecommendedActionsList({ actions }: HomeRecommendedActionsListProps) {
  return (
    <View className="gap-4">
      {actions.map((action) => (
        <RecommendedActionItem
          key={action.todo_id}
          text={action.action_text}
          done={isTodoDone(action.status)}
        />
      ))}
    </View>
  );
}
