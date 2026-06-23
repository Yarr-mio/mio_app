import {
  REPORT_MONTH_WEEK_LABELS,
  REPORT_WEEKDAY_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import {
  useEmotionTrend,
  useMonthlyReport,
  useWeeklyReport,
} from '@/features/report/hooks/useReport';
import type { ConstellationChartPoint } from '@/types/report';
import {
  DAYS_PER_WEEK,
  getMonthStartIso,
  getWeekRange,
  getWeekStartIso,
  MS_PER_DAY,
  toKstDate,
} from '@/utils/date';
import { mapEmotionTrendToChartPoints, resolveReportAnchorDate } from '@/utils/report';
import { getDate } from 'date-fns';

interface EmotionConstellationData {
  points: ConstellationChartPoint[];
  checkinCount: number;
  // avg_emotion_score 0-100: 리포트 집계용. avg_condition_score 1-5와 혼용 금지
  avgEmotionScore: number;
  isLoading: boolean;
}

interface UseEmotionConstellationDataOptions {
  enabled?: boolean;
}

export function useEmotionConstellationData(
  period: ReportPeriod,
  anchorDate: Date,
  options?: UseEmotionConstellationDataOptions
): EmotionConstellationData {
  const resolvedAnchorDate = resolveReportAnchorDate(period, anchorDate);
  const weekStart = getWeekStartIso(resolvedAnchorDate);
  const monthStart = getMonthStartIso(resolvedAnchorDate);
  const enabled = options?.enabled ?? true;

  const weeklyReportQuery = useWeeklyReport(weekStart, {
    enabled: enabled && period === 'week',
  });
  const monthlyReportQuery = useMonthlyReport(monthStart, {
    enabled: enabled && period === 'month',
  });
  const emotionTrendQuery = useEmotionTrend({
    period,
    anchorDate: resolvedAnchorDate,
    enabled,
  });

  const reportQuery = period === 'week' ? weeklyReportQuery : monthlyReportQuery;
  const trendPoints = emotionTrendQuery.data?.points ?? [];
  const points = mapEmotionTrendToChartPoints(period, trendPoints, resolvedAnchorDate);

  return {
    points,
    checkinCount: reportQuery.data?.checkin_count ?? 0,
    avgEmotionScore: reportQuery.data?.avg_emotion_score ?? 0,
    isLoading: reportQuery.isPending || emotionTrendQuery.isPending,
  };
}

export function getActiveChartIndex(period: ReportPeriod, anchorDate: Date): number {
  const today = toKstDate(new Date());
  const resolvedAnchorDate = resolveReportAnchorDate(period, anchorDate);

  if (period === 'week') {
    const { start } = getWeekRange(resolvedAnchorDate);
    const dayIndex = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
    return Math.min(Math.max(dayIndex, 0), REPORT_WEEKDAY_LABELS.length - 1);
  }

  const weekIndex = Math.floor((getDate(today) - 1) / DAYS_PER_WEEK);
  return Math.min(Math.max(weekIndex, 0), REPORT_MONTH_WEEK_LABELS.length - 1);
}
