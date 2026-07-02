import { useMutation } from '@tanstack/react-query';

import {
  deleteAuthWithdraw,
  getAuthNicknameDuplicateCheck,
  getAuthSignupStatus,
  postAuthLogin,
  postAuthLogout,
  postAuthRefresh,
  postAuthSignupComplete,
  postAuthSignupConsent,
  postAuthSignupProfile,
} from '@/api/endpoints/auth';
import queryClient from '@/api/queryClient';
import { syncAuthProfileCharacterFromServer } from '@/features/auth/services/syncAuthProfileCharacter';
import { useUnregisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import { getNativeDevicePushTokenAsync, getRememberedPushToken } from '@/notifications/fcm';
import { useAuthStore } from '@/store/authStore';
import { commitAuthProfileFromStoredSelection, useUserStore } from '@/store/userStore';
import type {
  AuthLoginResponse,
  AuthNicknameDuplicateCheckResponse,
  AuthSignupCompleteResponse,
  AuthSignupConsentRequest,
  AuthSignupConsentResponse,
  AuthSignupProfileRequest,
  AuthSignupProfileResponse,
  AuthSignupStatusResponse,
  AuthWithdrawResponse,
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
      // 이전 계정 잔존 데이터 제거 (authProfile, onboardingResult, 서버 쿼리 캐시)
      useUserStore.getState().reset();
      queryClient.clear();

      await storage.refreshToken.set(res.data.refresh_token);
      setAccessToken(res.data.access_token);

      if (!res.data.is_new_user && res.data.signup_step === 'COMPLETED' && res.data.user) {
        useUserStore.getState().setAuthProfile({
          nickname: res.data.user.nickname,
          characterId: res.data.user.preferred_character_id,
        });
        void syncAuthProfileCharacterFromServer();
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
    onSuccess: (res) => {
      useUserStore.getState().patchOnboardingNickname(res.data.nickname);
    },
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
    onSuccess: () => {
      commitAuthProfileFromStoredSelection();
    },
  });
}

// 로그아웃
export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);
  const { mutateAsync: unregisterDeviceToken } = useUnregisterNotificationDevice();

  return useMutation({
    mutationFn: async () => {
      // device_id UPSERT 구조상 remembered가 서버에 등록된 최신 토큰과 가장 근접함! native fallback은 remembered 유실 시에만 사용
      const rememberedPushToken = await getRememberedPushToken();
      const pushToken =
        rememberedPushToken ??
        // remembered 유실 시 native 토큰으로 fallback
        (await getNativeDevicePushTokenAsync().catch(() => null));

      if (pushToken) {
        await unregisterDeviceToken(pushToken).catch(() => {
          // onError에서 로깅됨 — 해제 실패는 로그아웃을 막지 않음
        });
      }

      return await postAuthLogout();
    },
    onSettled: async () => {
      setAccessToken(null);
      useUserStore.getState().reset();
      try {
        await Promise.allSettled([
          storage.refreshToken.delete(),
          useUserStore.persist.clearStorage(),
        ]);
      } finally {
        queryClient.clear();
        onAuthInvalid?.();
      }
    },
    onError: (error) => {
      console.error('[useLogout]', error);
    },
  });
}

// 회원 탈퇴
export function useWithdraw() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);

  return useMutation<AuthWithdrawResponse, Error, void>({
    mutationFn: () => deleteAuthWithdraw(),
    onSuccess: async () => {
      setAccessToken(null);
      useUserStore.getState().reset();
      try {
        await Promise.allSettled([
          storage.refreshToken.delete(),
          useUserStore.persist.clearStorage(),
        ]);
      } finally {
        queryClient.clear();
        onAuthInvalid?.();
      }
    },
    onError: (error) => {
      console.error('[useWithdraw]', error);
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
