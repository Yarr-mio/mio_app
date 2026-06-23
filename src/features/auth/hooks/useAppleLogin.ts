import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useSignupStatus, useSocialLogin } from '@/features/auth/hooks/useAuth';
import { runAppleLoginFlow } from '@/features/auth/services/appleLoginFlow';

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export function useAppleLogin() {
  const router = useRouter();
  const socialLogin = useSocialLogin();
  const signupStatus = useSignupStatus();
  const [error, setError] = useState<string | null>(null);
  const [isSdkPending, setIsSdkPending] = useState(false);

  const login = async () => {
    if (isSdkPending || socialLogin.isPending || signupStatus.isPending) {
      return;
    }

    setError(null);

    try {
      setIsSdkPending(true);

      await runAppleLoginFlow({
        socialLogin: (input) => socialLogin.mutateAsync(input),
        fetchSignupStatus: () => signupStatus.mutateAsync(),
        replaceRoute: (route) => router.replace(route),
      });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setIsSdkPending(false);
    }
  };

  return {
    login: () => {
      void login();
    },
    isPending: isSdkPending || socialLogin.isPending || signupStatus.isPending,
    error,
  };
}
