import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useSignupStatus, useSocialLogin } from '@/features/auth/hooks/useAuth';
import {
  resolveSignupRoute,
  shouldFetchSignupStatus,
} from '@/features/auth/services/signupNavigation';
import { signInWithKakao } from '@/features/auth/utils/kakaoLogin';
import type { SignupStep } from '@/types/auth';

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export function useKakaoLogin() {
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

      const accessToken = await signInWithKakao();

      setIsSdkPending(false);

      const res = await socialLogin.mutateAsync({
        provider: 'kakao',
        access_token: accessToken,
        id_token: null,
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
