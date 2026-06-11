import { useMutation } from '@tanstack/react-query';
import type { Router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  getAuthNicknameDuplicateCheck,
  getAuthSignupStatus,
  postAuthLogin,
  postAuthLogout,
  postAuthRefresh,
  postAuthSignupComplete,
  postAuthSignupConsent,
  postAuthSignupProfile,
} from '@/api/endpoints/auth';
import { HTTP_STATUS } from '@/constants/config';
import { handleSignupStepInvalid } from '@/features/auth/utils/handleSignupStepInvalid';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';
import { useAuthStore } from '@/store/authStore';
import type {
  AuthLoginResponse,
  AuthNicknameDuplicateCheckResponse,
  AuthSignupCompleteResponse,
  AuthSignupConsentRequest,
  AuthSignupConsentResponse,
  AuthSignupProfileRequest,
  AuthSignupProfileResponse,
  AuthSignupStatusResponse,
  SocialProvider,
} from '@/types/auth';
import { storage } from '@/utils/storage';

interface SocialLoginInput {
  provider: SocialProvider;
  idToken: string | null;
  accessToken: string | null;
}

// 카카오/애플 로그인
export function useSocialLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation<AuthLoginResponse, Error, SocialLoginInput>({
    mutationFn: (input) => postAuthLogin(input),
    onSuccess: async (res) => {
      await storage.refreshToken.set(res.data.refresh_token);
      setAccessToken(res.data.access_token);
    },
  });
}

// 이용약관 동의
export function useSignupConsent() {
  return useMutation<AuthSignupConsentResponse, Error, AuthSignupConsentRequest>({
    mutationFn: (body) => postAuthSignupConsent(body),
  });
}

// 프로필 설정 화면
export function useSignupProfile() {
  return useMutation<AuthSignupProfileResponse, Error, AuthSignupProfileRequest>({
    mutationFn: (body) => postAuthSignupProfile(body),
  });
}

// 닉네임 중복 확인
export function useNicknameDuplicateCheck() {
  return useMutation<AuthNicknameDuplicateCheckResponse, Error, string>({
    mutationFn: (nickname) => getAuthNicknameDuplicateCheck(nickname),
  });
}

// 가입 이탈 후 재진입 시 signup_step 조회
export function useSignupStatus() {
  return useMutation<AuthSignupStatusResponse, Error, void>({
    mutationFn: () => getAuthSignupStatus(),
  });
}

// 회원가입 최종 완료
export function useSignupComplete() {
  return useMutation<AuthSignupCompleteResponse, Error, void>({
    mutationFn: () => postAuthSignupComplete(),
  });
}

interface UseSignupCompleteOnMountResult {
  isReady: boolean;
  isPending: boolean;
}

// 회원가입 완료 화면 진입 시 complete API 호출
export function useSignupCompleteOnMount(router: Router): UseSignupCompleteOnMountResult {
  const { mutateAsync, isPending } = useSignupComplete();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const completeSignup = async () => {
      try {
        const response = await mutateAsync();

        if (cancelled) {
          return;
        }

        if (response.data.signup_step === 'COMPLETED' && response.data.status === 'ACTIVE') {
          setIsReady(true);
          return;
        }

        throw new Error('회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.');
      } catch (error) {
        if (cancelled) {
          return;
        }

        const status = readApiHttpStatus(error);
        const errorCode = readApiErrorCode(error);

        if (status === HTTP_STATUS.FORBIDDEN && errorCode === 'SIGNUP_STEP_INVALID') {
          await handleSignupStepInvalid(router);
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : '회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';
        Alert.alert('회원가입 완료', message);
      }
    };

    void completeSignup();

    return () => {
      cancelled = true;
    };
  }, [router, mutateAsync]);

  return {
    isReady,
    isPending,
  };
}

// 로그아웃
export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: () => postAuthLogout(),
    onSuccess: async () => {
      setAccessToken(null);
      await storage.refreshToken.delete();
    },
  });
}

// 새 access token 발급
export function useRefreshToken() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await storage.refreshToken.get();
      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }
      return await postAuthRefresh({ refresh_token: refreshToken });
    },
    onSuccess: (res) => {
      setAccessToken(res.data.access_token);
    },
  });
}
