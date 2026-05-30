import {
  ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE,
  type OnboardingCharacterId,
} from '@/constants/characters';
import type { OnboardingStyleType } from '@/constants/onboarding';

/**
 * Step3 preferred_style 기준 추천 캐릭터 id 목록 (최대 3명)
 */
export function getRecommendedCharacterIds(
  preferredStyle: OnboardingStyleType | null
): OnboardingCharacterId[] {
  if (!preferredStyle) {
    return ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE.default;
  }

  return ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE[preferredStyle];
}
