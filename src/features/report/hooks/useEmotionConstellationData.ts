import { REPORT_PERIOD, type ReportPeriod } from '@/constants/report';
import {
  useEmotionTrend,
  useMonthlyReport,
  useWeeklyReport,
} from '@/features/report/hooks/useReport';
import type { ConstellationChartPoint } from '@/types/report';
import { getMonthStartIso, getWeekStartIso } from '@/utils/date';
import { mapEmotionTrendToChartPoints, resolveReportAnchorDate } from '@/utils/report';

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
    enabled: enabled && period === REPORT_PERIOD.week,
  });
  const monthlyReportQuery = useMonthlyReport(monthStart, {
    enabled: enabled && period === REPORT_PERIOD.month,
  });
  const emotionTrendQuery = useEmotionTrend({
    period,
    anchorDate: resolvedAnchorDate,
    enabled,
  });

  const reportQuery = period === REPORT_PERIOD.week ? weeklyReportQuery : monthlyReportQuery;
  const trendPoints = emotionTrendQuery.data?.points ?? [];
  const points = mapEmotionTrendToChartPoints(period, trendPoints, resolvedAnchorDate);

  return {
    points,
    checkinCount: reportQuery.data?.checkin_count ?? 0,
    avgEmotionScore: reportQuery.data?.avg_emotion_score ?? 0,
    isLoading: reportQuery.isPending || emotionTrendQuery.isPending,
  };
}
