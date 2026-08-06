import { useMutation } from '@tanstack/react-query';

import { track, trackIdentify } from '@/analytics/track';
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
  SignupConsent,
  SocialProvider,
} from '@/types/auth';
import { readUserIdFromAccessToken } from '@/utils/jwt';
import { storage } from '@/utils/storage';

interface SocialLoginInput {
  provider: SocialProvider;
  id_token: string | null;
  access_token: string | null;
}

function findConsent(consents: SignupConsent[], type: SignupConsent['type']) {
  return consents.find((consent) => consent.type === type);
}

// 카카오/애플 로그인
export function useSocialLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthLoginResponse, Error, SocialLoginInput>({
    mutationFn: (input) => postAuthLogin(input),
    onSuccess: async (res, variables) => {
      // 이전 계정 잔존 데이터 제거
      useUserStore.getState().reset();
      clearReportPollFetchCounts();
      queryClient.clear();

      await storage.refreshToken.set(res.data.refresh_token);
      setSignupStep(res.data.signup_step);
      setAccessToken(res.data.access_token);

      // ⚠️ identify는 로그인 성공에만 1회 — 토큰 갱신·재시도 경로에는 절대 걸지 않는다.
      // user_id는 응답 user가 신규 가입 중 null이므로 access token의 sub에서 뽑는다
      const userId = readUserIdFromAccessToken(res.data.access_token);
      if (userId) {
        void trackIdentify(userId);
      }
      track('login_succeeded', {
        provider: variables.provider,
        is_new_user: res.data.is_new_user,
        is_new_device: res.data.is_new_device,
      });

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
    onSuccess: (res, variables) => {
      setSignupStep(res.data.signup_step);

      track('consent_agreed', {
        consent_version: findConsent(variables.consents, 'terms')?.version ?? null,
        marketing_agree: findConsent(variables.consents, 'marketing')?.agreed ?? false,
        sensitive_info_agreed: findConsent(variables.consents, 'sensitive_info')?.agreed ?? false,
      });
    },
  });
}

// 프로필 설정 화면
export function useSignupProfile() {
  const setSignupStep = useAuthStore((s) => s.setSignupStep);

  return useMutation<AuthSignupProfileResponse, Error, AuthSignupProfileRequest>({
    mutationFn: (body) => postAuthSignupProfile(body),
    onSuccess: (res, variables) => {
      setSignupStep(res.data.signup_step);
      useUserStore.getState().patchOnboardingNickname(res.data.nickname);

      // 같은 200에서 2건을 연달아 발행한다 — 의도된 것이다.
      // profile_submitted는 "제출 사실", signup_completed는 리텐션 t0 앵커로 역할이 다르다.
      // ⚠️ signup_completed를 가입 완료 화면 진입에 걸면 온보딩 개편으로 t0가 통째로 어긋난다
      // (개편으로 그 화면이 캐릭터 선택 뒤로 이동했다)
      track('profile_submitted', {
        age_range: variables.age_range ?? null,
        gender: variables.gender ?? null,
        employment_status: variables.employment_status ?? null,
      });
      track('signup_completed', {});
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
      track('onboarding_completed', {});
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
      // 인증정보를 지우기 전에 발행해야 envelope의 user_id가 채워진다 (투영의 탈퇴 제외 근거)
      track('account_withdrawn', {});

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
