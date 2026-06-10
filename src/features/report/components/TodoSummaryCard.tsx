import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  formatTodoCompletionRate,
  formatTodoLegendItem,
  REPORT_CARD_TITLES,
  REPORT_TODO_COMPLETED_LABEL,
  REPORT_TODO_LEGEND_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import {
  ReportCardClasses,
  ReportTextClasses,
  ReportTodoDonutColors,
  ReportTodoSummaryClasses,
} from '@/constants/theme';
import { TodoDonutChart } from '@/features/report/components/TodoDonutChart';
import type { TodoSummary } from '@/types/report';
import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface TodoSummaryCardProps {
  period: ReportPeriod;
  todoSummary: TodoSummary;
}

type TodoLegendVariant = 'completed' | 'partial' | 'failed';

const TODO_LEGEND_BULLET_CLASSES: Record<TodoLegendVariant, string> = {
  completed: 'bg-todo-completed',
  partial: 'bg-todo-partial',
  failed: 'bg-todo-failed',
};

interface TodoLegendItemProps {
  variant: TodoLegendVariant;
  label: string;
}

function TodoLegendItem({ variant, label }: TodoLegendItemProps) {
  return (
    <View className={ReportTodoSummaryClasses.legendItem}>
      <View
        className={cn(ReportTodoSummaryClasses.legendBullet, TODO_LEGEND_BULLET_CLASSES[variant])}
      />
      <ThemedText type="small" className={ReportTodoSummaryClasses.legendText}>
        {label}
      </ThemedText>
    </View>
  );
}

export function TodoSummaryCard({ period, todoSummary }: TodoSummaryCardProps) {
  const { completed, skipped, expired, completion_rate, total } = todoSummary;

  const segments = [
    { value: completed, color: ReportTodoDonutColors.completed },
    { value: skipped, color: ReportTodoDonutColors.partial },
    { value: expired, color: ReportTodoDonutColors.failed },
  ];

  return (
    <BaseCard className={ReportCardClasses.statsBody}>
      <ThemedText type="default" className={ReportTextClasses.inCardTitle}>
        {REPORT_CARD_TITLES.todo}
      </ThemedText>
      <View className={cn(ReportCardClasses.inCardBody, ReportTodoSummaryClasses.content)}>
        <View className={ReportTodoSummaryClasses.chart}>
          <TodoDonutChart
            segments={segments}
            total={total}
            centerLabel={formatTodoCompletionRate(completion_rate)}
          />
        </View>
        <View className={ReportTodoSummaryClasses.legend}>
          <TodoLegendItem
            variant="completed"
            label={formatTodoLegendItem(REPORT_TODO_COMPLETED_LABEL[period], completed)}
          />
          <TodoLegendItem
            variant="partial"
            label={formatTodoLegendItem(REPORT_TODO_LEGEND_LABELS.partial, skipped)}
          />
          <TodoLegendItem
            variant="failed"
            label={formatTodoLegendItem(REPORT_TODO_LEGEND_LABELS.failed, expired)}
          />
        </View>
      </View>
    </BaseCard>
  );
}
