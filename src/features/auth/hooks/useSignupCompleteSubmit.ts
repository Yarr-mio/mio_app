import { useRouter } from 'expo-router';
import { useState } from 'react';

import { AUTH_ROUTES } from '@/constants/routes';
import { useSignupComplete } from '@/features/auth/hooks/useAuth';
import { readApiErrorMessage } from '@/utils/readApiError';

const SIGNUP_COMPLETE_ERROR_MESSAGE = '가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';

interface UseSignupCompleteSubmitOptions {
  onSuccess?: () => void | Promise<void>;
}

export function useSignupCompleteSubmit(options: UseSignupCompleteSubmitOptions = {}) {
  const router = useRouter();
  const signupComplete = useSignupComplete();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async () => {
    setError(null);

    try {
      await signupComplete.mutateAsync();
      if (options.onSuccess) {
        await options.onSuccess();
        return;
      }

      router.replace(AUTH_ROUTES.home);
    } catch (submitError) {
      setError(readApiErrorMessage(submitError, SIGNUP_COMPLETE_ERROR_MESSAGE));
    }
  };

  return {
    submit,
    isPending: signupComplete.isPending,
    error,
    clearError,
  };
}
