import {
  CHECKIN_CONDITION_SCORE_MAX,
  MONTHLY_STATS_MIN_CHECKINS_PER_WEEK,
  MONTHLY_STATS_WEEKS_REQUIRED,
  REPORT_MONTH_WEEK_LABELS,
  REPORT_WEEKDAY_LABELS,
  type ReportPeriod,
} from '@/constants/report';
import { useInfiniteCheckinList } from '@/features/checkin/hooks/useCheckin';
import type { CheckinRecord } from '@/types/checkin';
import type { ConstellationChartPoint } from '@/types/report';
import {
  DAYS_PER_WEEK,
  getMonthRange,
  getWeekRange,
  isCurrentKstMonth,
  isFutureReportPeriod,
  MS_PER_DAY,
  toDateRangeIso,
  toKstDate,
} from '@/utils/date';
import { addDays, getDate, isSameDay } from 'date-fns';

interface EmotionConstellationData {
  points: ConstellationChartPoint[];
  checkinCount: number;
  averageScore: number;
  isFuture: boolean;
  isInsufficientMonthly: boolean;
}

function averageIntensity(checkins: CheckinRecord[]): number | null {
  if (checkins.length === 0) {
    return null;
  }

  return checkins.reduce((sum, record) => sum + record.condition_score, 0) / checkins.length;
}

function getCheckinsForMonthWeek(
  checkins: CheckinRecord[],
  monthStart: Date,
  weekIndex: number
): CheckinRecord[] {
  const weekStart = addDays(monthStart, weekIndex * DAYS_PER_WEEK);
  const weekEnd = addDays(weekStart, DAYS_PER_WEEK - 1);

  return checkins.filter((record) => {
    const createdAt = toKstDate(new Date(record.created_at));
    return createdAt >= weekStart && createdAt <= weekEnd;
  });
}

function hasSufficientMonthlyStats(checkins: CheckinRecord[], monthStart: Date): boolean {
  const weeksWithCheckins = REPORT_MONTH_WEEK_LABELS.reduce((count, _, weekIndex) => {
    const weekCheckinCount = getCheckinsForMonthWeek(checkins, monthStart, weekIndex).length;
    return weekCheckinCount >= MONTHLY_STATS_MIN_CHECKINS_PER_WEEK ? count + 1 : count;
  }, 0);

  return weeksWithCheckins >= MONTHLY_STATS_WEEKS_REQUIRED;
}

function buildWeeklyPoints(checkins: CheckinRecord[], weekStart: Date): ConstellationChartPoint[] {
  return REPORT_WEEKDAY_LABELS.map((label, dayIndex) => {
    const targetDay = addDays(weekStart, dayIndex);
    const dayCheckins = checkins.filter((record) =>
      isSameDay(toKstDate(new Date(record.created_at)), targetDay)
    );
    const intensity = averageIntensity(dayCheckins);

    return { label, intensity };
  });
}

function buildMonthlyPoints(
  checkins: CheckinRecord[],
  monthStart: Date
): ConstellationChartPoint[] {
  return REPORT_MONTH_WEEK_LABELS.map((label, weekIndex) => {
    const weekCheckins = getCheckinsForMonthWeek(checkins, monthStart, weekIndex);
    const intensity = averageIntensity(weekCheckins);

    return { label, intensity };
  });
}

function toEmotionScore(averageConditionScore: number): number {
  return Math.round((averageConditionScore / CHECKIN_CONDITION_SCORE_MAX) * 100);
}

export function useEmotionConstellationData(
  period: ReportPeriod,
  anchorDate: Date
): EmotionConstellationData {
  const range = period === 'week' ? getWeekRange(anchorDate) : getMonthRange(anchorDate);
  const isFuture = isFutureReportPeriod(range.start);
  const { from, to } = toDateRangeIso(range.start, range.end);
  const { data } = useInfiniteCheckinList(from, to);

  const checkins = data?.pages.flatMap((page) => page.data) ?? [];
  const checkinCount = checkins.length;

  if (isFuture) {
    const labels = period === 'week' ? REPORT_WEEKDAY_LABELS : REPORT_MONTH_WEEK_LABELS;
    return {
      points: labels.map((label) => ({ label, intensity: null })),
      checkinCount: 0,
      averageScore: 0,
      isFuture: true,
      isInsufficientMonthly: false,
    };
  }

  const points =
    period === 'week'
      ? buildWeeklyPoints(checkins, range.start)
      : buildMonthlyPoints(checkins, range.start);

  const isInsufficientMonthly =
    period === 'month' &&
    isCurrentKstMonth(anchorDate) &&
    !hasSufficientMonthlyStats(checkins, range.start);

  const scoreSource =
    checkinCount > 0
      ? checkins.reduce((sum, record) => sum + record.condition_score, 0) / checkinCount
      : 0;

  return {
    points,
    checkinCount,
    averageScore: toEmotionScore(scoreSource),
    isFuture: false,
    isInsufficientMonthly,
  };
}

export function getActiveChartIndex(period: ReportPeriod, anchorDate: Date): number {
  const today = toKstDate(new Date());

  if (period === 'week') {
    const { start } = getWeekRange(anchorDate);
    const dayIndex = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
    return Math.min(Math.max(dayIndex, 0), REPORT_WEEKDAY_LABELS.length - 1);
  }

  const weekIndex = Math.floor((getDate(today) - 1) / DAYS_PER_WEEK);
  return Math.min(Math.max(weekIndex, 0), REPORT_MONTH_WEEK_LABELS.length - 1);
}
