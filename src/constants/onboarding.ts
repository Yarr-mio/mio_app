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

export const ONBOARDING_STYLE_OPTIONS = [
  {
    id: 'empathy',
    title: '그냥 공감받고 싶어요',
    description: '내 마음을 있는 그대로\n들어주는 게 좋아요',
    characterId: 'mio',
    characterImage: require('../../assets/images/characters/mio.png'),
  },
  {
    id: 'realistic',
    title: '현실적으로 정리하고 싶어요',
    description: '객관적으로 판단하고\n조언을 주는 게 좋아요',
    characterId: 'chichi',
    characterImage: require('../../assets/images/characters/chichi.png'),
  },
  {
    id: 'action',
    title: '행동할 힘이 필요해요',
    description: '작은 실천을 함께\n계획하고 싶어요',
    characterId: 'bau',
    characterImage: require('../../assets/images/characters/bau.png'),
  },
  {
    id: 'reflective',
    title: '차분히 생각을 정리하고 싶어요',
    description: '질문을 통해 스스로\n이해하고 싶어요',
    characterId: 'rumi',
    characterImage: require('../../assets/images/characters/rumi.png'),
  },
] as const;

export type OnboardingStyleType = (typeof ONBOARDING_STYLE_OPTIONS)[number]['id'];
