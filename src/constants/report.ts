export const REPORT_TITLE = '성장 리포트';

export const REPORT_PERIOD_TABS = {
  week: '주간',
  month: '월간',
} as const;

export type ReportPeriod = keyof typeof REPORT_PERIOD_TABS;

export const REPORT_EMPTY_MESSAGE = '아직 데이터가 없어요';

export const REPORT_INSUFFICIENT_MONTHLY_MESSAGE = '이번 달 데이터가 충분하지 않아요';

export const REPORT_CARD_TITLES = {
  constellation: '감정 별자리',
  averageScore: '평균 감정 점수',
} as const;

export const REPORT_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const REPORT_MONTH_WEEK_LABELS = ['1주', '2주', '3주', '4주'] as const;

/** 월간 통계 표시에 필요한 주차 수 (각 주 1회 이상 체크인) */
export const MONTHLY_STATS_WEEKS_REQUIRED = 4;

export const MONTHLY_STATS_MIN_CHECKINS_PER_WEEK = 1;

export const EMOTION_SCORE_MAX = 100;

/** 체크인 condition_score 최소값 (IntensitySlider와 동일) */
export const CHECKIN_CONDITION_SCORE_MIN = 1;

/** 체크인 condition_score 최대값 (IntensitySlider와 동일) */
export const CHECKIN_CONDITION_SCORE_MAX = 5;

export const INTENSITY_LABEL_THRESHOLDS = {
  high: 4,
  mid: 3,
} as const;

export type IntensityLabelLevel = 'high' | 'mid' | 'low';

export function getIntensityLabelLevel(intensity: number): IntensityLabelLevel {
  const rounded = Math.round(intensity);
  if (rounded >= INTENSITY_LABEL_THRESHOLDS.high) {
    return 'high';
  }
  if (rounded >= INTENSITY_LABEL_THRESHOLDS.mid) {
    return 'mid';
  }
  return 'low';
}

export function formatIntensityLabelValue(intensity: number): string {
  return String(Math.round(intensity));
}

export const EMOTION_SCORE_THRESHOLDS = {
  negative: 50,
  neutral: 70,
} as const;

export const EMOTION_SCORE_LABELS = {
  negative: '다소 부정',
  neutral: '다소 긍정',
  positive: '매우 긍정',
} as const;

export type EmotionScoreLevel = keyof typeof EMOTION_SCORE_LABELS;

export function formatCheckinCountLabel(count: number): string {
  return `(체크인 ${count}회)`;
}

export function getEmotionScoreLevel(score: number): EmotionScoreLevel {
  if (score < EMOTION_SCORE_THRESHOLDS.negative) {
    return 'negative';
  }
  if (score < EMOTION_SCORE_THRESHOLDS.neutral) {
    return 'neutral';
  }
  return 'positive';
}
