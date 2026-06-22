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
  queryClient.setQueryData<OnboardingStatusResponse>(queryKeys.onboarding.status(), (prev) => ({
    data: {
      onboarding_step: onboardingStep,
      signup_step: prev?.data.signup_step ?? 'PROFILE_COMPLETED',
      character_recommendations: recommendations,
    },
    meta: prev?.meta ?? { trace_id: '' },
  }));
}
