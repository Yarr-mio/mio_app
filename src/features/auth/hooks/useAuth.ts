import { useMutation } from '@tanstack/react-query';

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
import { hydrateUserStoreFromAuthUser } from '@/features/auth/utils/mapAuthUserToUserStore';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
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
  id_token: string | null;
  access_token: string | null;
}

// 카카오/애플 로그인
export function useSocialLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation<AuthLoginResponse, Error, SocialLoginInput>({
    mutationFn: (input) => postAuthLogin(input),
    onSuccess: async (res) => {
      await storage.refreshToken.set(res.data.refresh_token);
      setAccessToken(res.data.access_token);

      if (!res.data.is_new_user && res.data.signup_step === 'COMPLETED' && res.data.user) {
        hydrateUserStoreFromAuthUser(res.data.user);
      }
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

// 로그아웃
export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);

  return useMutation({
    mutationFn: () => postAuthLogout(),
    onSettled: async () => {
      setAccessToken(null);
      await storage.refreshToken.delete();
      useUserStore.getState().reset();
      await useUserStore.persist.clearStorage();
      onAuthInvalid?.();
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
