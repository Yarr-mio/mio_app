import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ONBOARDING_SKIP_NEXT_ROUTES } from '@/constants/onboarding';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { useOnboardingStepSkipMutation } from '@/features/onboarding/hooks/useOnboarding';
import type { OnboardingSkippableStep } from '@/types/onboarding';
import { readApiErrorMessage } from '@/utils/readApiError';

export function useOnboardingStepSkip() {
  const router = useRouter();
  const onboardingStepSkip = useOnboardingStepSkipMutation();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const skip = async (stepNumber: OnboardingSkippableStep): Promise<boolean> => {
    setError(null);

    try {
      await onboardingStepSkip.mutateAsync(stepNumber);
      router.push(ONBOARDING_SKIP_NEXT_ROUTES[stepNumber]);
      return true;
    } catch (skipError) {
      if (isSignupStepInvalidError(skipError)) {
        await handleSignupStepInvalid();
        return false;
      }

      setError(readApiErrorMessage(skipError));
      return false;
    }
  };

  return {
    skip,
    isPending: onboardingStepSkip.isPending,
    error,
    clearError,
  };
}
