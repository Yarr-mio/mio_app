import {
  ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE,
  type OnboardingCharacterId,
} from '@/constants/characters';
import type { OnboardingStyleType } from '@/constants/onboarding';
import type { OnboardingCharacterRecommendation } from '@/types/onboarding';

// API 추천 우선 preferred_style fallback
export function getRecommendedCharacterIds(
  preferredStyle: OnboardingStyleType | null,
  apiRecommendations?: OnboardingCharacterRecommendation[] | null
): OnboardingCharacterId[] {
  const resolvedRecommendations = apiRecommendations ?? [];
  if (resolvedRecommendations.length > 0) {
    return [...new Set(resolvedRecommendations.map((item) => item.character_id))];
  }

  if (!preferredStyle) {
    return ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE.default;
  }

  return ONBOARDING_CHARACTER_RECOMMENDATIONS_BY_STYLE[preferredStyle];
}
