import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ONBOARDING_QUESTION_IDS, type OnboardingStyleType } from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { useOnboardingStep3 } from '@/features/onboarding/hooks/useOnboarding';
import { cacheOnboardingCharacterRecommendations } from '@/features/onboarding/utils/cacheOnboardingCharacterRecommendations';

export function useOnboardingStep3Submit() {
  const router = useRouter();
  const onboardingStep3 = useOnboardingStep3();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (selectedStyle: OnboardingStyleType) => {
    setError(null);

    try {
      const response = await onboardingStep3.mutateAsync({
        preferred_style: selectedStyle,
        responses: [{ question_id: ONBOARDING_QUESTION_IDS.step3, answer: selectedStyle }],
      });

      if (response.data.character_recommendations.length > 0) {
        cacheOnboardingCharacterRecommendations(response.data.character_recommendations);
      }

      router.push(AUTH_ROUTES.onboardingStep4);
    } catch (submitError) {
      if (isSignupStepInvalidError(submitError)) {
        await handleSignupStepInvalid();
        return;
      }

      setError(readApiErrorMessage(submitError));
    }
  };

  return {
    submit,
    isPending: onboardingStep3.isPending,
    error,
    clearError,
  };
}
