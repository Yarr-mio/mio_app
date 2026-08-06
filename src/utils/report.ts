import {
  CHARACTER_STORY_READ_MORE_MIN_LENGTH,
  REPORT_MONTH_WEEK_LABELS,
  REPORT_MONTHLY_WEEK_BUCKET_BOUNDARIES,
  REPORT_PERIOD,
  REPORT_WEEKDAY_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import type { ConstellationChartPoint, EmotionTrendPoint } from '@/types/report';
import { DAYS_PER_WEEK, getMonthRange, getWeekRange, MS_PER_DAY, toKstDate } from '@/utils/date';
import { addDays, format, getDate, parseISO } from 'date-fns';

export interface CharacterStoryCollapsedPreview {
  storyPortion: string;
  coachingPortion: string | null;
  showSeparator: boolean;
}

/** 이야기와 코칭 방향의 문자 수 합 반환 */
export function getCharacterStoryContentLength(
  storyText: string,
  coachingDirection: string | null | undefined
): number {
  return storyText.length + (coachingDirection?.length ?? 0);
}

/** 접힌 상태에서 보여줄 이야기와 코칭 방향 일부 계산 */
export function getCharacterStoryCollapsedPreview(
  storyText: string,
  coachingDirection: string | null | undefined,
  maxLength: number = CHARACTER_STORY_READ_MORE_MIN_LENGTH
): CharacterStoryCollapsedPreview {
  const coaching = coachingDirection ?? '';

  if (storyText.length >= maxLength) {
    return {
      storyPortion: storyText.slice(0, maxLength),
      coachingPortion: null,
      showSeparator: false,
    };
  }

  if (coaching.length === 0) {
    return {
      storyPortion: storyText,
      coachingPortion: null,
      showSeparator: false,
    };
  }

  const remaining = maxLength - storyText.length;

  return {
    storyPortion: storyText,
    coachingPortion: coaching.slice(0, remaining),
    showSeparator: storyText.length > 0,
  };
}

function getMonthlyWeekBucketIndex(dayOfMonth: number): number {
  if (dayOfMonth <= REPORT_MONTHLY_WEEK_BUCKET_BOUNDARIES[0]) {
    return 0;
  }
  if (dayOfMonth <= REPORT_MONTHLY_WEEK_BUCKET_BOUNDARIES[1]) {
    return 1;
  }
  if (dayOfMonth <= REPORT_MONTHLY_WEEK_BUCKET_BOUNDARIES[2]) {
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
  if (period === REPORT_PERIOD.month) {
    return groupMonthlyTrendToChartPoints(points);
  }

  return mapWeeklyTrendToChartPoints(points, anchorDate);
}

export function resolveReportAnchorDate(period: ReportPeriod, anchorDate: Date): Date {
  if (period === REPORT_PERIOD.month) {
    return toKstDate(getMonthRange(anchorDate).start);
  }

  return toKstDate(anchorDate);
}

export function getActiveChartIndex(period: ReportPeriod, anchorDate: Date): number {
  const today = toKstDate(new Date());
  const resolvedAnchorDate = resolveReportAnchorDate(period, anchorDate);

  if (period === REPORT_PERIOD.week) {
    const { start } = getWeekRange(resolvedAnchorDate);
    const dayIndex = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
    return Math.min(Math.max(dayIndex, 0), REPORT_WEEKDAY_LABELS.length - 1);
  }

  const weekIndex = Math.floor((getDate(today) - 1) / DAYS_PER_WEEK);
  return Math.min(Math.max(weekIndex, 0), REPORT_MONTH_WEEK_LABELS.length - 1);
}
