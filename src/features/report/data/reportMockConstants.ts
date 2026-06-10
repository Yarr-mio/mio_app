export const MOCK_REPORT_GENERATED_AT = '2026-06-07T00:00:00.000Z';

/** distortion_top3가 비어 있는 목업 기간 offset 기준 */
export const MOCK_DISTORTION_EMPTY_PERIOD_OFFSET = -2;

export const MOCK_DISTORTION_COUNTS = {
  catastrophizing: 4,
  mind_reading: 3,
  self_blame: 2,
} as const;

export const MOCK_TODO_SUMMARY_BASE = {
  total: 9,
  completed: 5,
  skipped: 1,
  expired: 1,
  category_distribution: {
    심리_안정: 3,
    인지_재구성: 4,
    행동_활성화: 2,
  },
} as const;

export const MOCK_TODO_COMPLETION_RATE = {
  weekly: 55.6,
  monthly: 62.5,
  pending: 0,
} as const;

export const MOCK_WEEKLY_INSUFFICIENT_CHECKIN_COUNT = 2;

export const MOCK_WEEKLY_REPORT_GENERATED = {
  checkinCount: 8,
  avgEmotionScore: 72,
  sessionTotal: 3,
  sessionTotalMinutes: 45,
} as const;

export const MOCK_MONTHLY_REPORT_GENERATED = {
  checkinCount: 24,
  avgEmotionScore: 68,
  sessionTotal: 8,
  sessionTotalMinutes: 120,
} as const;

export const MOCK_REPORT_EMPTY = {
  checkinCount: 0,
  avgEmotionScore: 0,
  sessionTotal: 0,
  sessionTotalMinutes: 0,
} as const;

export const MOCK_WEEKLY_EMOTION_TREND_FULL = {
  scores: [3.5, 4, null, 3, 4.5, 2.5, 3] as (number | null)[],
  checkinCounts: [2, 3, 0, 1, 3, 2, 1],
};

export const MOCK_WEEKLY_EMOTION_TREND_CURRENT_WEEK = {
  scores: [3.5, 4, null, null, null, null, null] as (number | null)[],
  checkinCounts: [1, 1, 0, 0, 0, 0, 0],
};

export const MOCK_MONTHLY_EMOTION_TREND_FULL = {
  scores: [3.2, 3.8, 4.1, null] as (number | null)[],
  checkinCounts: [5, 7, 6, 0],
};

export const MOCK_MONTHLY_EMOTION_TREND_CURRENT_MONTH = {
  scores: [3.5, null, null, null] as (number | null)[],
  checkinCounts: [5, 0, 0, 0],
};
