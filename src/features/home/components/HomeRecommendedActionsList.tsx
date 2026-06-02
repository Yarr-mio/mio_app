import CheckboxCheckIcon from '@/assets/icons/checkbox-check.svg';
import { ThemedText } from '@/components/themed/ThemedText';
import { FgColors, HomeActionClasses, HomeLayout } from '@/constants/theme';
import type { HomeRecommendedAction } from '@/features/home/hooks/useHomeMock';
import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';

interface HomeRecommendedActionsListProps {
  actions: HomeRecommendedAction[];
  onToggleAction: (id: string) => void;
}

interface RecommendedActionCheckboxProps {
  completed: boolean;
}

function RecommendedActionCheckbox({ completed }: RecommendedActionCheckboxProps) {
  return (
    <View
      className={cn(
        HomeActionClasses.recommendedCheckbox,
        'items-center justify-center rounded-full',
        completed ? 'bg-accent' : 'border border-fg-default/30 bg-transparent'
      )}
    >
      {completed ? (
        <CheckboxCheckIcon
          width={HomeLayout.checkboxCheckWidth}
          height={HomeLayout.checkboxCheckHeight}
          color={FgColors.default}
        />
      ) : null}
    </View>
  );
}

interface RecommendedActionItemProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
}

function RecommendedActionItem({ text, completed, onToggle }: RecommendedActionItemProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      className="flex-row items-center gap-3"
    >
      <RecommendedActionCheckbox completed={completed} />
      <ThemedText
        type="small"
        className={cn('flex-1', completed ? 'text-label line-through' : 'text-fg-default')}
      >
        {text}
      </ThemedText>
    </Pressable>
  );
}

export function HomeRecommendedActionsList({
  actions,
  onToggleAction,
}: HomeRecommendedActionsListProps) {
  return (
    <View className="gap-4">
      {actions.map((action) => (
        <RecommendedActionItem
          key={action.id}
          text={action.text}
          completed={action.completed}
          onToggle={() => onToggleAction(action.id)}
        />
      ))}
    </View>
  );
}
