import type { AuthRoute } from '@/constants/routes';
import { AUTH_ROUTES } from '@/constants/routes';
import type { EmotionType } from '@/types/checkin';
import type { OnboardingSkippableStep } from '@/types/onboarding';

// API 온보딩 단계는 3단계(step1~3)! step4 캐릭터 선택 화면은 OnboardingHeader를 렌더링하지 않는 별도 화면
export const ONBOARDING_TOTAL_STEPS = 3;

export const ONBOARDING_QUESTION_IDS = {
  step1: 'q1',
  step2: 'q2',
  step3: 'q3',
} as const;

export const ONBOARDING_CURRENT_STEPS = {
  step1: 1,
  step2: 2,
  step3: 3,
  step4: 4,
} as const;

export const ONBOARDING_SKIP_NEXT_ROUTES: Record<OnboardingSkippableStep, AuthRoute> = {
  [ONBOARDING_CURRENT_STEPS.step1]: AUTH_ROUTES.onboardingStep2,
  [ONBOARDING_CURRENT_STEPS.step2]: AUTH_ROUTES.onboardingStep3,
  [ONBOARDING_CURRENT_STEPS.step3]: AUTH_ROUTES.onboardingStep4,
};

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
  { id: 'romance', label: '연애' },
  { id: 'lifestyle', label: '생활 패턴' },
  { id: 'health', label: '건강 / 컨디션' },
  { id: 'workload', label: '학업 / 업무' },
  { id: 'financial', label: '경제적 부담' },
  { id: 'other', label: '기타' },
] as const;

export type OnboardingConcernType = (typeof ONBOARDING_CONCERN_OPTIONS)[number]['id'];

export const ONBOARDING_STYLE_OPTIONS = [
  {
    id: 'empathetic',
    title: '그냥 공감받고 싶어요',
    description: '내 마음을 있는 그대로\n들어주는 게 좋아요',
    characterId: 'mio',
    characterImage: require('@/assets/images/characters/mio.png'),
  },
  {
    id: 'analytical',
    title: '현실적으로 정리하고 싶어요',
    description: '객관적으로 판단하고\n조언을 주는 게 좋아요',
    characterId: 'chichi',
    characterImage: require('@/assets/images/characters/chichi.png'),
  },
  {
    id: 'solution',
    title: '행동할 힘이 필요해요',
    description: '작은 실천을 함께\n계획하고 싶어요',
    characterId: 'bau',
    characterImage: require('@/assets/images/characters/bau.png'),
  },
  {
    id: 'balanced',
    title: '차분히 생각을 정리하고 싶어요',
    description: '질문을 통해 스스로\n이해하고 싶어요',
    characterId: 'rumi',
    characterImage: require('@/assets/images/characters/rumi.png'),
  },
] as const;

export type OnboardingStyleType = (typeof ONBOARDING_STYLE_OPTIONS)[number]['id'];
