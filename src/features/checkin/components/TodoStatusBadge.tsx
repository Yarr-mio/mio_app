import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';
import type { TodoStatus } from '@/types/todo';

const STATUS_LABEL: Record<TodoStatus, string> = {
  suggested: '추천됨',
  completed: '완료',
  skipped: '건너뜀',
  expired: '만료',
};

const STATUS_STYLE: Record<TodoStatus, string> = {
  suggested: 'bg-surface-md border-line-md',
  completed: 'bg-success/20 border-success/40',
  skipped: 'bg-surface border-line',
  expired: 'bg-danger/10 border-danger/20',
};

const STATUS_TEXT_STYLE: Record<TodoStatus, string> = {
  suggested: 'text-fg-soft',
  completed: 'text-success',
  skipped: 'text-fg-faint',
  expired: 'text-danger/70',
};

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

export function TodoStatusBadge({ status }: TodoStatusBadgeProps) {
  return (
    <View className={cn('px-2 py-1 rounded-full border', STATUS_STYLE[status])}>
      <Text className={cn('text-xs font-medium', STATUS_TEXT_STYLE[status])}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
