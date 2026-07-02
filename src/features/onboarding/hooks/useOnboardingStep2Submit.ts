import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ONBOARDING_QUESTION_IDS, type OnboardingConcernType } from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { useOnboardingStep2 } from '@/features/onboarding/hooks/useOnboarding';
import { useUserStore } from '@/store/userStore';
import { readApiErrorMessage } from '@/utils/readApiError';

export function useOnboardingStep2Submit() {
  const router = useRouter();
  const onboardingStep2 = useOnboardingStep2();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const patchOnboardingConcernTypes = useUserStore((state) => state.patchOnboardingConcernTypes);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (selectedConcerns: OnboardingConcernType[]) => {
    setError(null);

    if (selectedConcerns.length === 0) {
      setError('최소 1개의 고민을 선택해 주세요.');
      return;
    }

    try {
      await onboardingStep2.mutateAsync({
        concern_types: selectedConcerns,
        responses: [{ question_id: ONBOARDING_QUESTION_IDS.step2, answer: selectedConcerns[0] }],
      });
      patchOnboardingConcernTypes(selectedConcerns);
      router.push(AUTH_ROUTES.onboardingStep3);
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
    isPending: onboardingStep2.isPending,
    error,
    clearError,
  };
}
