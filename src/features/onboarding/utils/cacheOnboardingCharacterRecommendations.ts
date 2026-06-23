import queryClient from '@/api/queryClient';
import { queryKeys } from '@/api/queryKeys';
import type {
  OnboardingCharacterRecommendation,
  OnboardingProgressStep,
  OnboardingStatusResponse,
} from '@/types/onboarding';

export function cacheOnboardingCharacterRecommendations(
  recommendations: OnboardingCharacterRecommendation[],
  onboardingStep: OnboardingProgressStep = 3
): void {
  queryClient.setQueryData<OnboardingStatusResponse>(queryKeys.onboarding.status(), (prev) => {
    if (!prev) {
      return prev;
    }

    return {
      ...prev,
      data: {
        ...prev.data,
        onboarding_step: onboardingStep,
        character_recommendations: recommendations,
      },
    };
  });
}
