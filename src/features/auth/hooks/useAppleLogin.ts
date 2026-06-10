import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useSignupStatus, useSocialLogin } from '@/features/auth/hooks/useAuth';
import { signInWithApple } from '@/features/auth/utils/appleLogin';
import {
  resolveSignupRoute,
  shouldFetchSignupStatus,
} from '@/features/auth/utils/navigateAfterLogin';
import type { SignupStep } from '@/types/auth';

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

/**
 * Apple 로그인 플로우
 *
 * useSocialLogin(토큰 저장 side effect 포함)을 기반으로
 * SDK 로그인 -> API 로그인 -> 라우팅
 */
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

      const result = await signInWithApple();

      setIsSdkPending(false);

      if (result.cancelled) {
        return;
      }

      const res = await socialLogin.mutateAsync({
        provider: 'apple',
        idToken: result.identityToken,
        accessToken: null,
      });

      const { signup_step, is_new_user } = res.data;
      let fetchedSignupStep: SignupStep | undefined;

      if (shouldFetchSignupStatus(signup_step, is_new_user)) {
        const status = await signupStatus.mutateAsync();
        fetchedSignupStep = status.data.signup_step;
      }

      const route = resolveSignupRoute(signup_step, is_new_user, fetchedSignupStep);
      router.replace(route);
    } catch (err) {
      setIsSdkPending(false);
      setError(getLoginErrorMessage(err));
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
