import {
  DISTORTION_TYPE_LABELS,
  REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE,
  REPORT_INSUFFICIENT_MONTHLY_DATA_MESSAGE,
  REPORT_REQUIRED_CHECKIN_COUNT,
  REPORT_REQUIRED_MONTHLY_CHECKIN_COUNT,
  REPORT_STATUS,
  type ReportPeriod,
} from '@/constants/report';
import {
  MOCK_DISTORTION_COUNTS,
  MOCK_DISTORTION_EMPTY_PERIOD_OFFSET,
  MOCK_MONTHLY_EMOTION_TREND_CURRENT_MONTH,
  MOCK_MONTHLY_EMOTION_TREND_FULL,
  MOCK_MONTHLY_REPORT_GENERATED,
  MOCK_REPORT_EMPTY,
  MOCK_REPORT_GENERATED_AT,
  MOCK_TODO_COMPLETION_RATE,
  MOCK_TODO_SUMMARY_BASE,
  MOCK_WEEKLY_EMOTION_TREND_CURRENT_WEEK,
  MOCK_WEEKLY_EMOTION_TREND_FULL,
  MOCK_WEEKLY_INSUFFICIENT_CHECKIN_COUNT,
  MOCK_WEEKLY_REPORT_GENERATED,
} from '@/features/report/data/reportMockConstants';
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
import { addDays, differenceInWeeks, format } from 'date-fns';

/** 개발용: true이면 현재 기간 리포트를 PENDING 상태로 시뮬레이션 */
const MOCK_REPORT_FORCE_PENDING = false;

function getPeriodOffset(period: ReportPeriod, anchorDate: Date): number {
  const today = toKstDate(new Date());
  const anchor = toKstDate(anchorDate);

  if (period === 'week') {
    const todayStart = getWeekRange(today).start;
    const anchorStart = getWeekRange(anchor).start;
    return differenceInWeeks(anchorStart, todayStart);
  }

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

  if (offset > 0) {
    return REPORT_STATUS.INSUFFICIENT_DATA;
  }

  if (period === 'week' && offset === 0) {
    return REPORT_STATUS.INSUFFICIENT_DATA;
  }

  if (period === 'month' && offset === 0) {
    return REPORT_STATUS.INSUFFICIENT_DATA;
  }

  return REPORT_STATUS.GENERATED;
}

function buildDistortionTop3(includeItems: boolean): DistortionTop3Item[] {
  if (!includeItems) {
    return [];
  }

  return [
    {
      type: 'catastrophizing',
      label: DISTORTION_TYPE_LABELS.catastrophizing,
      count: MOCK_DISTORTION_COUNTS.catastrophizing,
    },
    {
      type: 'mind_reading',
      label: DISTORTION_TYPE_LABELS.mind_reading,
      count: MOCK_DISTORTION_COUNTS.mind_reading,
    },
    {
      type: 'self_blame',
      label: DISTORTION_TYPE_LABELS.self_blame,
      count: MOCK_DISTORTION_COUNTS.self_blame,
    },
  ];
}

function buildTodoSummary(completionRate: number) {
  return {
    ...MOCK_TODO_SUMMARY_BASE,
    completion_rate: completionRate,
  };
}

function buildWeeklyReport(anchorDate: Date, status: ReportStatus): WeeklyReportData {
  const { start, end } = getWeekRange(anchorDate);
  const { from: weekStart, to: weekEnd } = toDateRangeIso(start, end);
  const offset = getPeriodOffset('week', anchorDate);
  const isInsufficient = status === REPORT_STATUS.INSUFFICIENT_DATA;
  const isFuturePeriod = offset > 0;

  return {
    report_id: `weekly-${weekStart}`,
    week_start: weekStart,
    week_end: weekEnd,
    status,
    is_partial: isInsufficient,
    checkin_count: isInsufficient
      ? isFuturePeriod
        ? MOCK_REPORT_EMPTY.checkinCount
        : MOCK_WEEKLY_INSUFFICIENT_CHECKIN_COUNT
      : MOCK_WEEKLY_REPORT_GENERATED.checkinCount,
    required_count: isInsufficient ? REPORT_REQUIRED_CHECKIN_COUNT : undefined,
    // avg_emotion_score는 0-100 리포트 집계용. avg_condition_score 1-5와 혼용 금지
    avg_emotion_score: isInsufficient
      ? MOCK_REPORT_EMPTY.avgEmotionScore
      : MOCK_WEEKLY_REPORT_GENERATED.avgEmotionScore,
    distortion_top3: buildDistortionTop3(offset !== MOCK_DISTORTION_EMPTY_PERIOD_OFFSET),
    narrative: null,
    coaching_direction: null,
    todo_summary: buildTodoSummary(MOCK_TODO_COMPLETION_RATE.weekly),
    session_summary: {
      total: MOCK_WEEKLY_REPORT_GENERATED.sessionTotal,
      total_minutes: MOCK_WEEKLY_REPORT_GENERATED.sessionTotalMinutes,
    },
    generated_at: MOCK_REPORT_GENERATED_AT,
    message: isInsufficient ? REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE : undefined,
  };
}

function buildMonthlyReport(anchorDate: Date, status: ReportStatus): MonthlyReportData {
  const { start, end } = getMonthRange(anchorDate);
  const { from: monthStart, to: monthEnd } = toDateRangeIso(start, end);
  const offset = getPeriodOffset('month', anchorDate);
  const isInsufficient = status === REPORT_STATUS.INSUFFICIENT_DATA;
  const isFuturePeriod = offset > 0;
  const currentMonthCheckinCount = MOCK_MONTHLY_EMOTION_TREND_CURRENT_MONTH.checkinCounts[0];

  return {
    report_id: `monthly-${monthStart}`,
    month_start: monthStart,
    month_end: monthEnd,
    status,
    is_partial: isInsufficient,
    checkin_count: isInsufficient
      ? isFuturePeriod
        ? MOCK_REPORT_EMPTY.checkinCount
        : currentMonthCheckinCount
      : MOCK_MONTHLY_REPORT_GENERATED.checkinCount,
    required_count: isInsufficient ? REPORT_REQUIRED_MONTHLY_CHECKIN_COUNT : undefined,
    // avg_emotion_score는 0-100 리포트 집계용. avg_condition_score 1-5와 혼용 금지
    avg_emotion_score: isInsufficient
      ? MOCK_REPORT_EMPTY.avgEmotionScore
      : MOCK_MONTHLY_REPORT_GENERATED.avgEmotionScore,
    distortion_top3: buildDistortionTop3(offset !== MOCK_DISTORTION_EMPTY_PERIOD_OFFSET),
    narrative: null,
    coaching_direction: null,
    todo_summary: buildTodoSummary(MOCK_TODO_COMPLETION_RATE.monthly),
    session_summary: {
      total: MOCK_MONTHLY_REPORT_GENERATED.sessionTotal,
      total_minutes: MOCK_MONTHLY_REPORT_GENERATED.sessionTotalMinutes,
    },
    generated_at: MOCK_REPORT_GENERATED_AT,
    message: isInsufficient ? REPORT_INSUFFICIENT_MONTHLY_DATA_MESSAGE : undefined,
  };
}

function buildWeeklyEmotionTrend(anchorDate: Date): EmotionTrendData {
  const { start, end } = getWeekRange(anchorDate);
  const { from: periodStart, to: periodEnd } = toDateRangeIso(start, end);
  const trend = isCurrentKstWeek(anchorDate)
    ? MOCK_WEEKLY_EMOTION_TREND_CURRENT_WEEK
    : MOCK_WEEKLY_EMOTION_TREND_FULL;
  const { scores: weeklyScores, checkinCounts: weeklyCheckinCounts } = trend;

  return {
    period_start: periodStart,
    period_end: periodEnd,
    points: weeklyScores.map((score, index) => ({
      date: format(addDays(start, index), 'yyyy-MM-dd'),
      // avg_condition_score 1-5는 감정 별자리 차트 전용. avg_emotion_score 0-100와 혼용 금지
      avg_condition_score: score,
      checkin_count: weeklyCheckinCounts[index],
    })),
  };
}

function buildMonthlyEmotionTrend(anchorDate: Date): EmotionTrendData {
  const { start, end } = getMonthRange(anchorDate);
  const { from: periodStart, to: periodEnd } = toDateRangeIso(start, end);
  const trend = isCurrentKstMonth(anchorDate)
    ? MOCK_MONTHLY_EMOTION_TREND_CURRENT_MONTH
    : MOCK_MONTHLY_EMOTION_TREND_FULL;
  const { scores: monthlyScores, checkinCounts: monthlyCheckinCounts } = trend;

  return {
    period_start: periodStart,
    period_end: periodEnd,
    points: monthlyScores.map((score, weekIndex) => ({
      date: format(addDays(start, weekIndex * 7), 'yyyy-MM-dd'),
      // avg_condition_score 1-5는 감정 별자리 차트 전용. avg_emotion_score 0-100와 혼용 금지
      avg_condition_score: score,
      checkin_count: monthlyCheckinCounts[weekIndex],
    })),
  };
}

function buildPendingReportData(period: ReportPeriod, anchorDate: Date): ReportData {
  if (period === 'week') {
    const { start, end } = getWeekRange(anchorDate);
    const { from: weekStart, to: weekEnd } = toDateRangeIso(start, end);
    return {
      report_id: `weekly-pending-${weekStart}`,
      week_start: weekStart,
      week_end: weekEnd,
      status: REPORT_STATUS.PENDING,
      is_partial: false,
      checkin_count: MOCK_REPORT_EMPTY.checkinCount,
      // avg_emotion_score는 0-100 리포트 집계용. avg_condition_score 1-5와 혼용 금지
      avg_emotion_score: MOCK_REPORT_EMPTY.avgEmotionScore,
      distortion_top3: [],
      narrative: null,
      coaching_direction: null,
      todo_summary: buildTodoSummary(MOCK_TODO_COMPLETION_RATE.pending),
      session_summary: {
        total: MOCK_REPORT_EMPTY.sessionTotal,
        total_minutes: MOCK_REPORT_EMPTY.sessionTotalMinutes,
      },
      generated_at: MOCK_REPORT_GENERATED_AT,
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
    checkin_count: MOCK_REPORT_EMPTY.checkinCount,
    // avg_emotion_score는 0-100 리포트 집계용. avg_condition_score 1-5와 혼용 금지
    avg_emotion_score: MOCK_REPORT_EMPTY.avgEmotionScore,
    distortion_top3: [],
    narrative: null,
    coaching_direction: null,
    todo_summary: buildTodoSummary(MOCK_TODO_COMPLETION_RATE.pending),
    session_summary: {
      total: MOCK_REPORT_EMPTY.sessionTotal,
      total_minutes: MOCK_REPORT_EMPTY.sessionTotalMinutes,
    },
    generated_at: MOCK_REPORT_GENERATED_AT,
  };
}

export function getMockReportData(period: ReportPeriod, anchorDate: Date): ReportData {
  const status = resolveMockStatus(period, anchorDate);

  if (status === REPORT_STATUS.PENDING) {
    return buildPendingReportData(period, anchorDate);
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
