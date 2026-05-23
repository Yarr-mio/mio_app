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
  suggested: 'bg-white/10 border-white/20',
  completed: 'bg-green-500/20 border-green-500/40',
  skipped: 'bg-white/5 border-white/10',
  expired: 'bg-red-500/10 border-red-500/20',
};

const STATUS_TEXT_STYLE: Record<TodoStatus, string> = {
  suggested: 'text-white/70',
  completed: 'text-green-400',
  skipped: 'text-white/40',
  expired: 'text-red-400/70',
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
