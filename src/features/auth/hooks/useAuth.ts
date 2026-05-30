import { useMutation } from '@tanstack/react-query';

import {
  postAuthLogin,
  postAuthLogout,
  postAuthRefresh,
  postAuthSignupComplete,
  postAuthSignupConsent,
  postAuthSignupProfile,
} from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type {
  AuthLoginResponse,
  AuthSignupCompleteResponse,
  AuthSignupConsentRequest,
  AuthSignupConsentResponse,
  AuthSignupProfileRequest,
  AuthSignupProfileResponse,
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
      setAccessToken(res.data.access_token);
      await storage.refreshToken.set(res.data.refresh_token);
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

// 회원가입 완료
export function useSignupComplete() {
  /**
   * POST /v1/auth/signup/complete
   *
   * 명세 진입 조건: signup_step = ONBOARDING_COMPLETED (온보딩 전체 완료 후)
   * 실제 호출 위치: OnboardingCompleteScreen.handleStart (마지막 온보딩 단계)
   *
   * TODO: 온보딩 작업 시 SignUpCompleteScreen에 임시 연동된 호출을 제거하고,
   *       OnboardingCompleteScreen으로 이전해야 함!!!
   */
  return useMutation<AuthSignupCompleteResponse, Error, void>({
    mutationFn: () => postAuthSignupComplete(),
  });
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
