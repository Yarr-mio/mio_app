import type { EmotionType } from '@/types/checkin';

export const ONBOARDING_TOTAL_STEPS = 3;

export const ONBOARDING_DEFAULT_EMOJI_SCORE = 3;

export const ONBOARDING_INTENSITY_MIN = 1;
export const ONBOARDING_INTENSITY_MAX = 5;

/** 온보딩 Step1 감정 그리드 표시 순서 */
export const ONBOARDING_EMOTION_GRID_ORDER: EmotionType[] = [
  'sad',
  'ashamed',
  'numb',
  'anxious',
  'tired',
  'happy',
  'angry',
  'calm',
  'confused',
];

export const ONBOARDING_INTENSITY_SCALE_LABELS = {
  weak: '약해요',
  strong: '강해요',
} as const;

export const ONBOARDING_CONCERN_OPTIONS = [
  { id: 'career', label: '진로 / 커리어' },
  { id: 'relationship', label: '인간관계' },
  { id: 'family', label: '가족' },
  { id: 'love', label: '연애' },
  { id: 'lifestyle', label: '생활 패턴' },
  { id: 'health', label: '건강 / 컨디션' },
  { id: 'study', label: '학업 / 업무' },
  { id: 'finance', label: '경제적 부담' },
  { id: 'other', label: '기타' },
] as const;

export type OnboardingConcernType = (typeof ONBOARDING_CONCERN_OPTIONS)[number]['id'];
