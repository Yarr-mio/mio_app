import {
  REPORT_MONTH_WEEK_LABELS,
  REPORT_WEEKDAY_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import type { ConstellationChartPoint, EmotionTrendPoint } from '@/types/report';
import { getMonthRange, getWeekRange, toKstDate } from '@/utils/date';
import { addDays, format, getDate, parseISO } from 'date-fns';

const MONTHLY_WEEK_BUCKET_BOUNDARIES = [7, 14, 21] as const;

function getMonthlyWeekBucketIndex(dayOfMonth: number): number {
  if (dayOfMonth <= MONTHLY_WEEK_BUCKET_BOUNDARIES[0]) {
    return 0;
  }
  if (dayOfMonth <= MONTHLY_WEEK_BUCKET_BOUNDARIES[1]) {
    return 1;
  }
  if (dayOfMonth <= MONTHLY_WEEK_BUCKET_BOUNDARIES[2]) {
    return 2;
  }
  return 3;
}

function averageScores(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }

  const sum = scores.reduce((total, score) => total + score, 0);
  return sum / scores.length;
}

export function groupMonthlyTrendToChartPoints(
  points: EmotionTrendPoint[]
): ConstellationChartPoint[] {
  const buckets: number[][] = [[], [], [], []];

  for (const point of points) {
    if (point.avg_condition_score == null) {
      continue;
    }

    const dayOfMonth = getDate(parseISO(point.date));
    const bucketIndex = getMonthlyWeekBucketIndex(dayOfMonth);
    buckets[bucketIndex].push(point.avg_condition_score);
  }

  return REPORT_MONTH_WEEK_LABELS.map((label, index) => ({
    label,
    avg_condition_score: averageScores(buckets[index]),
  }));
}

export function mapWeeklyTrendToChartPoints(
  points: EmotionTrendPoint[],
  anchorDate: Date
): ConstellationChartPoint[] {
  const { start } = getWeekRange(anchorDate);
  const weekStart = toKstDate(start);
  const scoreByDate = new Map(points.map((point) => [point.date, point.avg_condition_score]));

  return REPORT_WEEKDAY_LABELS.map((label, index) => {
    const date = format(addDays(weekStart, index), 'yyyy-MM-dd');
    return {
      label,
      avg_condition_score: scoreByDate.get(date) ?? null,
    };
  });
}

export function mapEmotionTrendToChartPoints(
  period: ReportPeriod,
  points: EmotionTrendPoint[],
  anchorDate: Date
): ConstellationChartPoint[] {
  if (period === 'month') {
    return groupMonthlyTrendToChartPoints(points);
  }

  return mapWeeklyTrendToChartPoints(points, anchorDate);
}

export function resolveReportAnchorDate(period: ReportPeriod, anchorDate: Date): Date {
  if (period === 'month') {
    return toKstDate(getMonthRange(anchorDate).start);
  }

  return toKstDate(anchorDate);
}
