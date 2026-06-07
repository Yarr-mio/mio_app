import {
  REPORT_MONTH_WEEK_LABELS,
  REPORT_WEEKDAY_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import { getMockEmotionTrendData, getMockReportData } from '@/features/report/hooks/useReportMock';
import type { ConstellationChartPoint } from '@/types/report';
import {
  DAYS_PER_WEEK,
  getMonthRange,
  getWeekRange,
  isFutureReportPeriod,
  MS_PER_DAY,
  toKstDate,
} from '@/utils/date';
import { getDate } from 'date-fns';

interface EmotionConstellationData {
  points: ConstellationChartPoint[];
  checkinCount: number;
  // avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지
  avgEmotionScore: number;
  isFuture: boolean;
}

function mapTrendToChartPoints(
  period: ReportPeriod,
  trendPoints: ReturnType<typeof getMockEmotionTrendData>['points']
): ConstellationChartPoint[] {
  const labels = period === 'week' ? REPORT_WEEKDAY_LABELS : REPORT_MONTH_WEEK_LABELS;

  return labels.map((label, index) => ({
    label,
    // avg_condition_score (1~5): 감정 별자리 차트 전용. avg_emotion_score(0~100)와 혼용 금지
    avg_condition_score: trendPoints[index]?.avg_condition_score ?? null,
  }));
}

function resolveReportAnchorDate(period: ReportPeriod, anchorDate: Date): Date {
  if (period === 'month') {
    return toKstDate(getMonthRange(anchorDate).start);
  }

  return toKstDate(anchorDate);
}

export function useEmotionConstellationData(
  period: ReportPeriod,
  anchorDate: Date
): EmotionConstellationData {
  const resolvedAnchorDate = resolveReportAnchorDate(period, anchorDate);
  const range =
    period === 'week' ? getWeekRange(resolvedAnchorDate) : getMonthRange(resolvedAnchorDate);
  const isFuture = period === 'week' && isFutureReportPeriod(range.start);

  if (isFuture) {
    const points = REPORT_WEEKDAY_LABELS.map((label) => ({ label, avg_condition_score: null }));

    return {
      points,
      checkinCount: 0,
      avgEmotionScore: 0,
      isFuture: true,
    };
  }

  const report = getMockReportData(period, resolvedAnchorDate);
  const emotionTrend = getMockEmotionTrendData(period, resolvedAnchorDate);
  const points = mapTrendToChartPoints(period, emotionTrend.points);

  return {
    points,
    checkinCount: report.checkin_count,
    avgEmotionScore: report.avg_emotion_score,
    isFuture: false,
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
