import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AUTH_ROUTES } from '@/constants/routes';
import { useSignupComplete, useSignupStatus } from '@/features/auth/hooks/useAuth';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';

const COMPLETE_SUBMIT_ERROR_MESSAGE = '회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';

export function useSignupCompleteSubmit() {
  const router = useRouter();
  const signupComplete = useSignupComplete();
  const signupStatus = useSignupStatus();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async () => {
    setError(null);

    try {
      const statusResponse = await signupStatus.mutateAsync();

      if (statusResponse.data.signup_step === 'COMPLETED') {
        router.replace(AUTH_ROUTES.home);
        return;
      }

      if (statusResponse.data.signup_step === 'ONBOARDING_COMPLETED') {
        const response = await signupComplete.mutateAsync();

        if (response.data.signup_step !== 'COMPLETED' || response.data.status !== 'ACTIVE') {
          throw new Error(COMPLETE_SUBMIT_ERROR_MESSAGE);
        }

        router.replace(AUTH_ROUTES.home);
        return;
      }

      router.push(AUTH_ROUTES.onboardingStep1);
    } catch (submitError) {
      if (isSignupStepInvalidError(submitError)) {
        await handleSignupStepInvalid();
        return;
      }

      const message =
        submitError instanceof Error ? submitError.message : COMPLETE_SUBMIT_ERROR_MESSAGE;
      setError(message);
    }
  };

  return {
    submit,
    isPending: signupComplete.isPending || signupStatus.isPending,
    error,
    clearError,
  };
}
