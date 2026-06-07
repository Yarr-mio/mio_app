import type { OnboardingStyleType } from '@/constants/onboarding';

export type OnboardingCharacterId = 'mio' | 'bau' | 'rumi' | 'momo' | 'chichi';

export const ONBOARDING_DEFAULT_CHARACTER_ID: OnboardingCharacterId = 'mio';

export type ApiPreferredStyle = 'empathetic' | 'analytical' | 'solution' | 'balanced';

export const ONBOARDING_STYLE_TO_API_PREFERRED_STYLE: Record<
  OnboardingStyleType,
  ApiPreferredStyle
> = {
  empathy: 'empathetic',
  realistic: 'analytical',
  action: 'solution',
  reflective: 'balanced',
} as const;

export const ONBOARDING_CHARACTERS = [
  {
    id: 'mio',
    name: '미오',
    chipLabel: '공감·감정 정리 전문가',
    quote: '“지금 느끼는 감정, 함께 천천히 들여다봐요”',
    image: require('../../assets/images/characters/mio.png'),
    iconImage: require('../../assets/images/characters/mio.png'),
    greeting:
      '안녕! 나는 미오예요.\n당신의 마음을 있는 그대로 들어주고, 함께 정리할 수 있도록 곁에 있을게요. ✨',
  },
  {
    id: 'bau',
    name: '바우',
    chipLabel: '행동 파트너',
    quote: '“작은 실천이 큰 변화를 만들어요. 같이 해 봐요”',
    image: require('../../assets/images/characters/bau.png'),
    iconImage: require('../../assets/images/characters/bau.png'),
    greeting:
      '안녕! 나는 바우예요.\n지금 할 수 있는 작은 한 걸음부터 같이 계획해 봐요. 내가 옆에서 응원할게요. ✨',
  },
  {
    id: 'rumi',
    name: '루미',
    chipLabel: '생각 패턴 전문가',
    quote: '“차분하게 생각을 정리하는 걸 도와드릴게요”',
    image: require('../../assets/images/characters/rumi.png'),
    iconImage: require('../../assets/images/characters/rumi.png'),
    greeting:
      '안녕! 나는 루미예요.\n복잡한 생각을 차분히 정리하고, 패턴을 발견할 수 있도록 함께 도와드릴게요. ✨',
  },
  {
    id: 'momo',
    name: '모모',
    chipLabel: '감정 수용 전문가',
    quote: '“자책하지 않아도 괜찮아요. 있는 그대로 받아들여 봐요”',
    image: require('../../assets/images/characters/momo.png'),
    iconImage: require('../../assets/images/characters/momo.png'),
    greeting:
      '안녕! 나는 모모예요.\n자책보단 수용부터 시작해요. 지금의 마음을 있는 그대로 안아줄 수 있도록 곁에 있을게요. ✨',
  },
  {
    id: 'chichi',
    name: '치치',
    chipLabel: '생각 패턴 전문가',
    quote: '“현실적인 시선으로 함께 답을 찾아드릴게요”',
    image: require('../../assets/images/characters/chichi.png'),
    iconImage: require('../../assets/images/characters/chichi.png'),
    greeting:
      '안녕! 나는 치치예요.\n현실적인 시선으로 상황을 정리하고, 선택지를 함께 찾아볼게요. ✨',
  },
] as const;

/** 전체 캐릭터 목록 표시 순서 */
export const ONBOARDING_ALL_CHARACTER_IDS: OnboardingCharacterId[] = [
  'mio',
  'bau',
  'rumi',
  'momo',
  'chichi',
];

/**
 * preferred_style별 추천 캐릭터 id (최대 3명)
 */
export const ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE: Record<
  OnboardingStyleType | 'default',
  OnboardingCharacterId[]
> = {
  empathy: ['mio', 'momo', 'rumi'],
  realistic: ['chichi', 'rumi', 'mio'],
  action: ['bau', 'mio', 'chichi'],
  reflective: ['rumi', 'mio', 'momo'],
  default: ['mio', 'momo', 'rumi'],
};

export const ONBOARDING_STEP4_RECOMMENDED_TITLE = 'Mio가 당신과 잘 맞을\n친구들을 골랐어요';
export const ONBOARDING_STEP4_ALL_TITLE = '파트너를 선택해요';
export const ONBOARDING_STEP4_SUBTITLE = '마음이 끌리는 친구를 선택해 보세요';
export const ONBOARDING_STEP4_SEE_MORE_LABEL = '다른 친구들도 궁금해요';

const CHARACTER_BY_ID = Object.fromEntries(
  ONBOARDING_CHARACTERS.map((character) => [character.id, character])
) as Record<OnboardingCharacterId, (typeof ONBOARDING_CHARACTERS)[number]>;

export function getOnboardingCharacterById(id: OnboardingCharacterId) {
  return CHARACTER_BY_ID[id];
}

/** 성장 리포트 — 데이터 부족 상태 캐릭터 이미지 */
export const REPORT_CHARACTER_DATA_IMAGES: Record<OnboardingCharacterId, number> = {
  mio: require('../../assets/images/report/characters/data/mio_data.png'),
  bau: require('../../assets/images/report/characters/data/bau_data.png'),
  rumi: require('../../assets/images/report/characters/data/rumi_data.png'),
  momo: require('../../assets/images/report/characters/data/momo_data.png'),
  chichi: require('../../assets/images/report/characters/data/chichi_data.png'),
};

export function getReportCharacterDataImage(characterId: OnboardingCharacterId): number {
  return (
    REPORT_CHARACTER_DATA_IMAGES[characterId] ??
    REPORT_CHARACTER_DATA_IMAGES[ONBOARDING_DEFAULT_CHARACTER_ID]
  );
}
