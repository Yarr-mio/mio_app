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
