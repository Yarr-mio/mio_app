import {
  DISTORTION_TYPE_LABELS,
  REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE,
  REPORT_REQUIRED_CHECKIN_COUNT,
  REPORT_STATUS,
  type ReportPeriod,
} from '@/constants/report';
import type {
  DistortionTop3Item,
  EmotionTrendData,
  MonthlyReportData,
  ReportData,
  ReportStatus,
  WeeklyReportData,
} from '@/types/report';
import {
  getMonthRange,
  getWeekRange,
  isCurrentKstMonth,
  isCurrentKstWeek,
  toDateRangeIso,
  toKstDate,
} from '@/utils/date';
import { addDays, differenceInWeeks, format, startOfMonth } from 'date-fns';

/** 개발용: true이면 현재 기간 리포트를 PENDING 상태로 시뮬레이션 */
const MOCK_REPORT_FORCE_PENDING = false;

const MOCK_GENERATED_AT = '2026-06-07T00:00:00.000Z';

function getPeriodOffset(period: ReportPeriod, anchorDate: Date): number {
  const today = toKstDate(new Date());
  const anchor = toKstDate(anchorDate);

  if (period === 'week') {
    const todayStart = getWeekRange(today).start;
    const anchorStart = getWeekRange(anchor).start;
    return differenceInWeeks(anchorStart, todayStart);
  }

  const todayMonth = format(startOfMonth(today), 'yyyy-MM');
  const anchorMonth = format(startOfMonth(anchor), 'yyyy-MM');
  const todayYear = today.getFullYear();
  const anchorYear = anchor.getFullYear();
  return (anchorYear - todayYear) * 12 + (anchor.getMonth() - today.getMonth());
}

function resolveMockStatus(period: ReportPeriod, anchorDate: Date): ReportStatus {
  if (MOCK_REPORT_FORCE_PENDING) {
    const isCurrent =
      period === 'week' ? isCurrentKstWeek(anchorDate) : isCurrentKstMonth(anchorDate);
    if (isCurrent) {
      return REPORT_STATUS.PENDING;
    }
  }

  const offset = getPeriodOffset(period, anchorDate);
  if (offset === -1) {
    return REPORT_STATUS.INSUFFICIENT_DATA;
  }

  return REPORT_STATUS.GENERATED;
}

function buildDistortionTop3(includeItems: boolean): DistortionTop3Item[] {
  if (!includeItems) {
    return [];
  }

  return [
    { type: 'catastrophizing', label: DISTORTION_TYPE_LABELS.catastrophizing, count: 4 },
    { type: 'mind_reading', label: DISTORTION_TYPE_LABELS.mind_reading, count: 3 },
    { type: 'self_blame', label: DISTORTION_TYPE_LABELS.self_blame, count: 2 },
  ];
}

function buildTodoSummary(completionRate: number) {
  return {
    total: 9,
    completed: 5,
    skipped: 1,
    expired: 1,
    completion_rate: completionRate,
    category_distribution: {
      심리_안정: 3,
      인지_재구성: 4,
      행동_활성화: 2,
    },
  };
}

function buildWeeklyReport(anchorDate: Date, status: ReportStatus): WeeklyReportData {
  const { start, end } = getWeekRange(anchorDate);
  const { from: weekStart, to: weekEnd } = toDateRangeIso(start, end);
  const offset = getPeriodOffset('week', anchorDate);
  const isInsufficient = status === REPORT_STATUS.INSUFFICIENT_DATA;

  return {
    report_id: `weekly-${weekStart}`,
    week_start: weekStart,
    week_end: weekEnd,
    status,
    is_partial: isInsufficient,
    checkin_count: isInsufficient ? 1 : 8,
    required_count: isInsufficient ? REPORT_REQUIRED_CHECKIN_COUNT : undefined,
    // avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지
    avg_emotion_score: isInsufficient ? 0 : 72,
    distortion_top3: buildDistortionTop3(offset !== -2),
    narrative: null,
    coaching_direction: null,
    todo_summary: buildTodoSummary(55.6),
    session_summary: { total: 3, total_minutes: 45 },
    generated_at: MOCK_GENERATED_AT,
    message: isInsufficient ? REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE : undefined,
  };
}

function buildMonthlyReport(anchorDate: Date, status: ReportStatus): MonthlyReportData {
  const { start, end } = getMonthRange(anchorDate);
  const { from: monthStart, to: monthEnd } = toDateRangeIso(start, end);
  const offset = getPeriodOffset('month', anchorDate);
  const isInsufficient = status === REPORT_STATUS.INSUFFICIENT_DATA;

  return {
    report_id: `monthly-${monthStart}`,
    month_start: monthStart,
    month_end: monthEnd,
    status,
    is_partial: isInsufficient,
    checkin_count: isInsufficient ? 2 : 24,
    required_count: isInsufficient ? REPORT_REQUIRED_CHECKIN_COUNT : undefined,
    // avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지
    avg_emotion_score: isInsufficient ? 0 : 68,
    distortion_top3: buildDistortionTop3(offset !== -2),
    narrative: null,
    coaching_direction: null,
    todo_summary: buildTodoSummary(62.5),
    session_summary: { total: 8, total_minutes: 120 },
    generated_at: MOCK_GENERATED_AT,
    message: isInsufficient ? REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE : undefined,
  };
}

function buildWeeklyEmotionTrend(anchorDate: Date): EmotionTrendData {
  const { start, end } = getWeekRange(anchorDate);
  const { from: periodStart, to: periodEnd } = toDateRangeIso(start, end);

  const weeklyScores: (number | null)[] = [3.5, 4, null, 3, 4.5, 2.5, 3];
  const weeklyCheckinCounts = [2, 3, 0, 1, 3, 2, 1];

  return {
    period_start: periodStart,
    period_end: periodEnd,
    points: weeklyScores.map((score, index) => ({
      date: format(addDays(start, index), 'yyyy-MM-dd'),
      // avg_condition_score (1~5): 감정 별자리 차트 전용. avg_emotion_score(0~100)와 혼용 금지
      avg_condition_score: score,
      checkin_count: weeklyCheckinCounts[index],
    })),
  };
}

function buildMonthlyEmotionTrend(anchorDate: Date): EmotionTrendData {
  const { start, end } = getMonthRange(anchorDate);
  const { from: periodStart, to: periodEnd } = toDateRangeIso(start, end);

  const monthlyScores: (number | null)[] = [3.2, 3.8, 4.1, null];
  const monthlyCheckinCounts = [5, 7, 6, 0];

  return {
    period_start: periodStart,
    period_end: periodEnd,
    points: monthlyScores.map((score, weekIndex) => ({
      date: format(addDays(start, weekIndex * 7), 'yyyy-MM-dd'),
      // avg_condition_score (1~5): 감정 별자리 차트 전용. avg_emotion_score(0~100)와 혼용 금지
      avg_condition_score: score,
      checkin_count: monthlyCheckinCounts[weekIndex],
    })),
  };
}

export function getMockReportData(period: ReportPeriod, anchorDate: Date): ReportData {
  const status = resolveMockStatus(period, anchorDate);

  if (status === REPORT_STATUS.PENDING) {
    if (period === 'week') {
      const { start, end } = getWeekRange(anchorDate);
      const { from: weekStart, to: weekEnd } = toDateRangeIso(start, end);
      return {
        report_id: `weekly-pending-${weekStart}`,
        week_start: weekStart,
        week_end: weekEnd,
        status: REPORT_STATUS.PENDING,
        is_partial: false,
        checkin_count: 0,
        // avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지
        avg_emotion_score: 0,
        distortion_top3: [],
        narrative: null,
        coaching_direction: null,
        todo_summary: buildTodoSummary(0),
        session_summary: { total: 0, total_minutes: 0 },
        generated_at: MOCK_GENERATED_AT,
      };
    }

    const { start, end } = getMonthRange(anchorDate);
    const { from: monthStart, to: monthEnd } = toDateRangeIso(start, end);
    return {
      report_id: `monthly-pending-${monthStart}`,
      month_start: monthStart,
      month_end: monthEnd,
      status: REPORT_STATUS.PENDING,
      is_partial: false,
      checkin_count: 0,
      // avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지
      avg_emotion_score: 0,
      distortion_top3: [],
      narrative: null,
      coaching_direction: null,
      todo_summary: buildTodoSummary(0),
      session_summary: { total: 0, total_minutes: 0 },
      generated_at: MOCK_GENERATED_AT,
    };
  }

  return period === 'week'
    ? buildWeeklyReport(anchorDate, status)
    : buildMonthlyReport(anchorDate, status);
}

export function getMockEmotionTrendData(period: ReportPeriod, anchorDate: Date): EmotionTrendData {
  return period === 'week'
    ? buildWeeklyEmotionTrend(anchorDate)
    : buildMonthlyEmotionTrend(anchorDate);
}

export function useReportMock(period: ReportPeriod, anchorDate: Date) {
  const report = getMockReportData(period, anchorDate);
  const emotionTrend = getMockEmotionTrendData(period, anchorDate);

  return { report, emotionTrend };
}
