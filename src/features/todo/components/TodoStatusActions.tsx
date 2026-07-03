import { ThemedText } from '@/components/themed/ThemedText';
import {
  TodoActionButtonClasses,
  TodoCardClasses,
  TodoExpiredBadgeClasses,
} from '@/constants/theme';
import { TODO_ACTION_LABEL, TODO_EXPIRED_LABEL } from '@/constants/todo';
import type { TodoCheckinRequest, TodoStatus } from '@/types/todo';
import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';

type TodoCheckinStatus = TodoCheckinRequest['status'];

interface TodoStatusActionsProps {
  status: TodoStatus;
  isSubmitting: boolean;
  onSelect: (status: TodoCheckinStatus) => void;
}

const ACTION_KINDS: TodoCheckinStatus[] = ['completed', 'partial_completed', 'skipped'];

function isActionDisabled(
  status: TodoStatus,
  kind: TodoCheckinStatus,
  isSubmitting: boolean
): boolean {
  if (isSubmitting || status === 'completed' || status === 'skipped') {
    return true;
  }
  if (status === 'partial_completed') {
    return kind !== 'completed';
  }
  return false;
}

function getActionClasses(isSelected: boolean) {
  if (!isSelected) {
    return {
      button: TodoActionButtonClasses.inactive,
      text: TodoActionButtonClasses.inactiveText,
    };
  }
  return { button: TodoActionButtonClasses.selected, text: TodoActionButtonClasses.selectedText };
}

export function TodoStatusActions({ status, isSubmitting, onSelect }: TodoStatusActionsProps) {
  if (status === 'expired') {
    return (
      <View className={TodoExpiredBadgeClasses.container}>
        <ThemedText type="small" className={TodoExpiredBadgeClasses.text}>
          {TODO_EXPIRED_LABEL}
        </ThemedText>
      </View>
    );
  }

  return (
    <View className={TodoCardClasses.actionsRow}>
      {ACTION_KINDS.map((kind) => {
        const isSelected = status === kind;
        const disabled = isActionDisabled(status, kind, isSubmitting);
        const { button, text } = getActionClasses(isSelected);

        return (
          <Pressable
            key={kind}
            onPress={() => onSelect(kind)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={TODO_ACTION_LABEL[kind]}
            accessibilityState={{ disabled, selected: isSelected }}
            className={cn(
              TodoActionButtonClasses.base,
              button,
              disabled && !isSelected && TodoActionButtonClasses.disabled
            )}
          >
            <ThemedText type="smallBold" className={text}>
              {TODO_ACTION_LABEL[kind]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
