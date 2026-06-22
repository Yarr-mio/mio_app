import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ONBOARDING_QUESTION_IDS, type OnboardingConcernType } from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { useOnboardingStep2 } from '@/features/onboarding/hooks/useOnboarding';

export function useOnboardingStep2Submit() {
  const router = useRouter();
  const onboardingStep2 = useOnboardingStep2();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (selectedConcerns: OnboardingConcernType[]) => {
    setError(null);

    try {
      await onboardingStep2.mutateAsync({
        concern_types: selectedConcerns,
        responses: [{ question_id: ONBOARDING_QUESTION_IDS.step2, answer: selectedConcerns[0] }],
      });
      router.push(AUTH_ROUTES.onboardingStep3);
    } catch (submitError) {
      setError(readApiErrorMessage(submitError));
    }
  };

  return {
    submit,
    isPending: onboardingStep2.isPending,
    error,
    clearError,
  };
}
