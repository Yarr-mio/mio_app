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
import { clearReportPollFetchCounts } from '@/api/reportPollFetchCountStore';
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
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthLoginResponse, Error, SocialLoginInput>({
    mutationFn: (input) => postAuthLogin(input),
    onSuccess: async (res) => {
      // 이전 계정 잔존 데이터 제거
      useUserStore.getState().reset();
      clearReportPollFetchCounts();
      queryClient.clear();

      await storage.refreshToken.set(res.data.refresh_token);
      setSignupStep(res.data.signup_step);
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
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthSignupConsentResponse, Error, AuthSignupConsentRequest>({
    mutationFn: (body) => postAuthSignupConsent(body),
    onSuccess: (res) => {
      setSignupStep(res.data.signup_step);
    },
  });
}

// 프로필 설정 화면
export function useSignupProfile() {
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthSignupProfileResponse, Error, AuthSignupProfileRequest>({
    mutationFn: (body) => postAuthSignupProfile(body),
    onSuccess: (res) => {
      setSignupStep(res.data.signup_step);
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

// 가입 이탈 재진입 시 signup_step 조회
export function useSignupStatus() {
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthSignupStatusResponse, Error, void>({
    mutationFn: () => getAuthSignupStatus(),
    onSuccess: (res) => {
      setSignupStep(res.data.signup_step);
    },
  });
}

// 회원가입 최종 완료
export function useSignupComplete() {
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthSignupCompleteResponse, Error, void>({
    mutationFn: () => postAuthSignupComplete(),
    onSuccess: (res) => {
      setSignupStep(res.data.signup_step);
      commitAuthProfileFromStoredSelection();
    },
  });
}

// 로그아웃
export function useLogout() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setSignupStep = useAuthStore((s) => s.setSignupStep);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);
  const { mutateAsync: unregisterDeviceToken } = useUnregisterNotificationDevice();

  return useMutation({
    mutationFn: async () => {
      // remembered 푸시 토큰 우선 native fallback
      const rememberedPushToken = await getRememberedPushToken();
      const pushToken =
        rememberedPushToken ??
        // remembered 유실 시 native 토큰 fallback
        (await getNativeDevicePushTokenAsync().catch(() => null));

      if (pushToken) {
        await unregisterDeviceToken(pushToken).catch(() => {
          // 토큰 해제 실패 시에도 로그아웃 계속
        });
      }

      return await postAuthLogout();
    },
    onSettled: async () => {
      setAccessToken(null);
      setSignupStep(null);
      useUserStore.getState().reset();
      try {
        await Promise.allSettled([
          storage.refreshToken.delete(),
          useUserStore.persist.clearStorage(),
        ]);
      } finally {
        clearReportPollFetchCounts();
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
  const setSignupStep = useAuthStore((s) => s.setSignupStep);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);

  return useMutation<AuthWithdrawResponse, Error, void>({
    mutationFn: () => deleteAuthWithdraw(),
    onSuccess: async () => {
      setAccessToken(null);
      setSignupStep(null);
      useUserStore.getState().reset();
      try {
        await Promise.allSettled([
          storage.refreshToken.delete(),
          useUserStore.persist.clearStorage(),
        ]);
      } finally {
        clearReportPollFetchCounts();
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
