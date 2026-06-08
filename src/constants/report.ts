import type { DistortionType, ReportStatus } from '@/types/report';

export const REPORT_TITLE = '성장 리포트';

export const REPORT_PERIOD_TABS = {
  week: '주간',
  month: '월간',
} as const;

export type ReportPeriod = keyof typeof REPORT_PERIOD_TABS;

export const REPORT_STATUS = {
  GENERATED: 'GENERATED',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  PENDING: 'PENDING',
} as const satisfies Record<string, ReportStatus>;

export const REPORT_EMPTY_MESSAGE = '아직 데이터가 없어요';

export const REPORT_INSUFFICIENT_MONTHLY_MESSAGE = '이번 달 데이터가 충분하지 않아요';

export const REPORT_INSUFFICIENT_DATA_DEFAULT_MESSAGE =
  '리포트를 생성하기 위한 체크인이 더 필요해요';

export const REPORT_DISTORTION_EMPTY_MESSAGE = '이번 주 인지 왜곡이 감지되지 않았어요';

export const REPORT_PENDING_MESSAGE = '리포트를 생성하고 있어요';

export const REPORT_REQUIRED_CHECKIN_COUNT = 3;

export const REPORT_INSUFFICIENT_TITLE = '아직 기록이 부족해요';

export const REPORT_INSUFFICIENT_CHECKIN_CARD_TITLE = {
  week: '이번 주 체크인',
  month: '이번 달 체크인',
} as const;

export const REPORT_INSUFFICIENT_GUIDE_SUBTITLE = '기록이 더 쌓이면 볼 수 있어요';

export const REPORT_INSUFFICIENT_GUIDE_ITEMS = [
  { id: 'data_checkin', text: '하루 최대 3회 체크인' },
  { id: 'data_todo', text: 'TO-DO 완료로 회복 행동 쌓기' },
  { id: 'data_chat', text: '세션 대화로 더 깊이 이해하기' },
  { id: 'data_report', text: '꾸준한 기록이 도움이 돼요' },
] as const;

export type ReportInsufficientGuideItemId = (typeof REPORT_INSUFFICIENT_GUIDE_ITEMS)[number]['id'];

export function formatInsufficientDataSubtitle(
  period: ReportPeriod,
  requiredCount: number
): string {
  if (period === 'week') {
    return `체크인을 ${requiredCount}회 이상 완료하면\n주간 리포트를 볼 수 있어요`;
  }

  return `체크인을 ${requiredCount}회 이상 완료하면\n월간 리포트를 볼 수 있어요`;
}

export const DISTORTION_TYPE_LABELS: Record<DistortionType, string> = {
  overgeneralization: '일반화',
  catastrophizing: '파국화',
  mind_reading: '마음 읽기',
  all_or_nothing: '흑백 사고',
  self_blame: '자기 비난',
  emotional_reasoning: '감정적 추론',
};

export const REPORT_CARD_TITLES = {
  constellation: '감정 별자리',
  averageScore: '평균 감정 점수',
  distortion: '인지 왜곡 TOP 3',
  todo: 'TO-DO 현황',
  narrative: '이번 주 이야기',
  coaching: '코칭 방향',
} as const;

export const REPORT_TODO_LEGEND_LABELS = {
  completed: '완료',
  partial: '부분 완료',
  failed: '못함',
} as const;

/** 주간/월간 탭별 완료 라벨 — todo_summary.completed는 해당 기간 집계값 */
export const REPORT_TODO_COMPLETED_LABEL: Record<ReportPeriod, string> = {
  week: REPORT_TODO_LEGEND_LABELS.completed,
  month: REPORT_TODO_LEGEND_LABELS.completed,
};

export function formatDistortionCount(count: number): string {
  return `${count}회`;
}

export function formatTodoLegendItem(label: string, count: number): string {
  return `${label} ${count}`;
}

export function formatTodoCompletionRate(completionRate: number): string {
  return `${completionRate}%`;
}

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

export function formatCheckinOccurrence(count: number): string {
  return `${count}회`;
}

export function formatRequiredCheckinSuffix(requiredCount: number): string {
  return `/ ${requiredCount}회 이상 필요`;
}

export function formatInsufficientDataLabel(checkinCount: number, requiredCount: number): string {
  return `${formatCheckinOccurrence(checkinCount)} ${formatRequiredCheckinSuffix(requiredCount)}`;
}

export function formatReportChatButtonLabel(characterName: string): string {
  return `${characterName}와 이야기 하러 가기`;
}

export const CHARACTER_STORY_PERIOD_LABELS = {
  weekly: '주간',
  monthly: '월간',
} as const;

export type CharacterStoryPeriod = keyof typeof CHARACTER_STORY_PERIOD_LABELS;

export const REPORT_PERIOD_TO_CHARACTER_STORY_PERIOD: Record<ReportPeriod, CharacterStoryPeriod> = {
  week: 'weekly',
  month: 'monthly',
};

export const CHARACTER_STORY_TRUNCATE_ELLIPSIS = '...';

export const CHARACTER_STORY_READ_MORE_INLINE_LABEL = '더보기';

export const CHARACTER_STORY_COLLAPSE_LABEL = '...접기';

export const CHARACTER_STORY_READ_MORE_MIN_LENGTH = 90;

export function formatCharacterStoryCardTitle(
  characterName: string,
  period: CharacterStoryPeriod
): string {
  return `${characterName}의 ${CHARACTER_STORY_PERIOD_LABELS[period]} 이야기`;
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
