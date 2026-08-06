import type { ImageSource } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

export type OnboardingCharacterId = 'mio' | 'bau' | 'rumi' | 'momo' | 'chichi';

export interface PartnerMeta {
  key: OnboardingCharacterId;
  name: string;
  tag: string;
  intro: string;
  image: ImageSource;
}

export const ONBOARDING_CHARACTERS = [
  {
    id: 'mio',
    name: '미오',
    chipLabel: '공감·감정 정리 전문가',
    quote: '“지금 느끼는 감정, 함께 천천히 들여다봐요”',
    image: require('@/assets/images/characters/mio.png'),
    iconImage: require('@/assets/images/characters/mio.png'),
    greeting:
      '안녕! 나는 미오예요.\n당신의 마음을 있는 그대로 들어주고, 함께 정리할 수 있도록 곁에 있을게요. ✨',
  },
  {
    id: 'bau',
    name: '바우',
    chipLabel: '행동 파트너',
    quote: '“작은 실천이 큰 변화를 만들어요. 같이 해 봐요”',
    image: require('@/assets/images/characters/bau.png'),
    iconImage: require('@/assets/images/characters/bau.png'),
    greeting:
      '안녕! 나는 바우예요.\n지금 할 수 있는 작은 한 걸음부터 같이 계획해 봐요. 내가 옆에서 응원할게요. ✨',
  },
  {
    id: 'rumi',
    name: '루미',
    chipLabel: '생각 패턴 전문가',
    quote: '“차분하게 생각을 정리하는 걸 도와드릴게요”',
    image: require('@/assets/images/characters/rumi.png'),
    iconImage: require('@/assets/images/characters/rumi.png'),
    greeting:
      '안녕! 나는 루미예요.\n복잡한 생각을 차분히 정리하고, 패턴을 발견할 수 있도록 함께 도와드릴게요. ✨',
  },
  {
    id: 'momo',
    name: '모모',
    chipLabel: '감정 수용 전문가',
    quote: '“자책하지 않아도 괜찮아요. 있는 그대로 받아들여 봐요”',
    image: require('@/assets/images/characters/momo.png'),
    iconImage: require('@/assets/images/characters/momo.png'),
    greeting:
      '안녕! 나는 모모예요.\n자책보단 수용부터 시작해요. 지금의 마음을 있는 그대로 안아줄 수 있도록 곁에 있을게요. ✨',
  },
  {
    id: 'chichi',
    name: '치치',
    chipLabel: '생각 패턴 전문가',
    quote: '“현실적인 시선으로 함께 답을 찾아드릴게요”',
    image: require('@/assets/images/characters/chichi.png'),
    iconImage: require('@/assets/images/characters/chichi.png'),
    greeting:
      '안녕! 나는 치치예요.\n현실적인 시선으로 상황을 정리하고, 선택지를 함께 찾아볼게요. ✨',
  },
] as const;

// TODO: ONBOARDING_CHARACTERS.quote는 curly quote를 사용해 replace(/^"|"$/g, '')로는 따옴표가 제거되지 않음.
// PARTNER_LIST intro는 따옴표 없는 문구(예: mio 지금 느끼는 감정, 함께 천천히 들여다봐요)가 올바른 값인지,
// quote에서 파생한 값(따옴표 포함)이 올바른 값인지 디자인/기획 확인 필요.
export const PARTNER_LIST: PartnerMeta[] = ONBOARDING_CHARACTERS.map((char) => ({
  key: char.id,
  name: char.name,
  tag: char.chipLabel,
  intro: char.quote.replace(/^"|"$/g, ''),
  image: char.image,
}));

export const ONBOARDING_DEFAULT_CHARACTER_ID: OnboardingCharacterId = 'mio';

/** 전체 캐릭터 목록 표시 순서 */
export const ONBOARDING_ALL_CHARACTER_IDS: OnboardingCharacterId[] = [
  'mio',
  'bau',
  'rumi',
  'momo',
  'chichi',
];

export const ONBOARDING_STEP4_ALL_TITLE = '파트너를 선택해요';
export const ONBOARDING_STEP4_SUBTITLE = '마음이 끌리는 친구를 선택해 보세요';

const CHARACTER_BY_ID = Object.fromEntries(
  ONBOARDING_CHARACTERS.map((character) => [character.id, character])
) as Record<OnboardingCharacterId, (typeof ONBOARDING_CHARACTERS)[number]>;

export function getOnboardingCharacterById(id: OnboardingCharacterId) {
  return CHARACTER_BY_ID[id];
}

/** 성장 리포트 — 데이터 부족 상태 캐릭터 이미지 */
export const REPORT_CHARACTER_DATA_IMAGES: Record<OnboardingCharacterId, number> = {
  mio: require('@/assets/images/report/characters/data/mio_data.png'),
  bau: require('@/assets/images/report/characters/data/bau_data.png'),
  rumi: require('@/assets/images/report/characters/data/rumi_data.png'),
  momo: require('@/assets/images/report/characters/data/momo_data.png'),
  chichi: require('@/assets/images/report/characters/data/chichi_data.png'),
};

export function getReportCharacterDataImage(characterId: OnboardingCharacterId): number {
  return (
    REPORT_CHARACTER_DATA_IMAGES[characterId] ??
    REPORT_CHARACTER_DATA_IMAGES[ONBOARDING_DEFAULT_CHARACTER_ID]
  );
}

/** 성장 리포트 — PENDING 상태 캐릭터 로딩 이미지 */
export const REPORT_CHARACTER_LOADING_IMAGES: Record<OnboardingCharacterId, number> = {
  mio: require('@/assets/images/report/characters/loading/mio_loading.png'),
  bau: require('@/assets/images/report/characters/loading/bau_loading.png'),
  rumi: require('@/assets/images/report/characters/loading/rumi_loading.png'),
  momo: require('@/assets/images/report/characters/loading/momo_loading.png'),
  chichi: require('@/assets/images/report/characters/loading/chichi_loading.png'),
};

export function getReportCharacterLoadingImage(characterId: OnboardingCharacterId): number {
  return (
    REPORT_CHARACTER_LOADING_IMAGES[characterId] ??
    REPORT_CHARACTER_LOADING_IMAGES[ONBOARDING_DEFAULT_CHARACTER_ID]
  );
}

/** 성장 리포트 — 에러 상태 캐릭터 이미지 */
export const REPORT_CHARACTER_WARN_IMAGES: Record<OnboardingCharacterId, number> = {
  mio: require('@/assets/images/report/characters/warn/mio_warn.png'),
  bau: require('@/assets/images/report/characters/warn/bau_warn.png'),
  rumi: require('@/assets/images/report/characters/warn/rumi_warn.png'),
  momo: require('@/assets/images/report/characters/warn/momo_warn.png'),
  chichi: require('@/assets/images/report/characters/warn/chichi_warn.png'),
};

export function getReportCharacterWarnImage(
  characterId: OnboardingCharacterId
): ImageSourcePropType {
  return (
    REPORT_CHARACTER_WARN_IMAGES[characterId] ??
    REPORT_CHARACTER_WARN_IMAGES[ONBOARDING_DEFAULT_CHARACTER_ID]
  );
}

const PARTNER_BY_KEY = Object.fromEntries(
  PARTNER_LIST.map((partner) => [partner.key, partner])
) as Record<OnboardingCharacterId, PartnerMeta>;

export function getPartnerByKey(key: OnboardingCharacterId): PartnerMeta {
  return PARTNER_BY_KEY[key];
}

export function getCharacterNameById(characterId: string): string {
  const id = toOnboardingCharacterId(characterId);
  return getPartnerByKey(id).name;
}

export function toOnboardingCharacterId(id: string): OnboardingCharacterId {
  // ONBOARDING_ALL_CHARACTER_IDS 포함 여부로 런타임 검증 후 단언
  if (ONBOARDING_ALL_CHARACTER_IDS.includes(id as OnboardingCharacterId)) {
    // includes 통과 후 안전한 단언
    return id as OnboardingCharacterId;
  }

  return ONBOARDING_DEFAULT_CHARACTER_ID;
}
