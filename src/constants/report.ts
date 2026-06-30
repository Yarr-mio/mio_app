import type { DistortionType, EmotionTrendPeriod, ReportStatus } from '@/types/report';

export const REPORT_TITLE = '성장 리포트';

export const REPORT_PERIOD_TABS = {
  week: '주간',
  month: '월간',
} as const;

export type ReportPeriod = keyof typeof REPORT_PERIOD_TABS;

export const REPORT_PERIOD = {
  week: 'week',
  month: 'month',
} as const satisfies Record<ReportPeriod, ReportPeriod>;

export const REPORT_PERIOD_LIST = Object.keys(REPORT_PERIOD_TABS) as ReportPeriod[];

export const EMOTION_TREND_PERIOD = {
  week: 'week',
  month: 'month',
  all: 'all',
} as const satisfies Record<EmotionTrendPeriod, EmotionTrendPeriod>;

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

export const REPORT_PENDING_TITLE: Record<ReportPeriod, string> = {
  week: '이번 주 마음 흐름을\n정리하고 있어요',
  month: '이번 달 마음 흐름을\n정리하고 있어요',
};

export const REPORT_PENDING_SUBTITLE = '리포트가 완성되면 알려드릴게요';

export const REPORT_PENDING_SCHEDULE: Record<ReportPeriod, string> = {
  week: '매주 월요일 3:00',
  month: '매월 1일 3:00',
};

export const REPORT_PENDING_SCHEDULE_LABEL = '자동 생성 시간';

export const REPORT_PENDING_REASON_TITLE = '왜 기다려야 하나요?';

export const REPORT_PENDING_REASON_BODY =
  '체크인, TO-DO, 세션 데이터를 모아 더 정확한 리포트를 만들고 있어요';

export const REPORT_PENDING_CHECKIN_NOTICE: Record<ReportPeriod, string> = {
  week: '* 체크인 3회 이상 시 리포트가 생성됩니다',
  month: '* 체크인 7회 이상 시 리포트가 생성됩니다',
};

export const REPORT_API_ERROR_CODE = 'SERVER_ERROR';

export const REPORT_ERROR_TITLE = '리포트를 불러오지 못했어요';

export const REPORT_ERROR_SUBTITLE = '잠시 후 다시 시도해 주세요';

export const REPORT_ERROR_RETRY_LABEL = '다시 시도';

export const REPORT_ERROR_VIEW_PREVIOUS_LABEL = '이전 리포트 보기';

export const REPORT_ERROR_HELP_TITLE = '문제가 계속되나요?';

export const REPORT_ERROR_HELP_BODY = '네트워크를 확인하거나\n잠시 후 다시 시도해 주세요';

export const REPORT_REQUIRED_CHECKIN_COUNT = 3;

/** 월간 리포트 생성에 필요한 최소 체크인 횟수 */
export const REPORT_REQUIRED_MONTHLY_CHECKIN_COUNT = 7;

export const REPORT_INSUFFICIENT_MONTHLY_DATA_MESSAGE =
  '아직 기록이 부족해요. 체크인을 7회 이상 완료하면 월간 리포트를 볼 수 있어요.';

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
  overgeneralization: '과일반화',
  catastrophizing: '파국화',
  mind_reading: '독심술',
  all_or_nothing: '이분법적 사고',
  self_blame: '개인화',
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

export const REPORT_MONTHLY_WEEK_BUCKET_BOUNDARIES = [7, 14, 21] as const;

export const REPORT_DATE_NAVIGATOR_A11Y_PREV = '이전 기간';

export const REPORT_DATE_NAVIGATOR_A11Y_NEXT = '다음 기간';

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

export const CHARACTER_STORY_PERIOD_WEEKLY = 'weekly';

export const CHARACTER_STORY_PERIOD_LABELS = {
  weekly: '주간',
  monthly: '월간',
} as const;

export const CHARACTER_STORY_A11Y_EXPAND = '이야기 더보기';

export const CHARACTER_STORY_A11Y_COLLAPSE = '이야기 접기';

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
