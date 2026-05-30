import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthLogoutRequest,
  AuthLogoutResponse,
  AuthNicknameDuplicateCheckResponse,
  AuthRefreshRequest,
  AuthRefreshResponse,
  AuthSignupCompleteResponse,
  AuthSignupConsentRequest,
  AuthSignupConsentResponse,
  AuthSignupProfileRequest,
  AuthSignupProfileResponse,
  AuthSignupStatusResponse,
  SignupStep,
} from '@/types/auth';
import type { ApiMeta } from '@/types/common';
import { getOrCreateDeviceId } from '@/utils/deviceId';

function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

function mockSignupStep(): SignupStep {
  return 'SOCIAL_AUTHENTICATED';
}

export async function postAuthLogin(
  input: Omit<AuthLoginRequest, 'deviceId'>
): Promise<AuthLoginResponse> {
  const deviceId = await getOrCreateDeviceId();
  const body: AuthLoginRequest = { ...input, deviceId };

  /**
   * POST /v1/auth/login
   *
   */
  if (USE_MOCK) {
    const step = mockSignupStep();
    return {
      data: {
        access_token: 'eyJhbGci.mock_access',
        refresh_token: 'mio_refresh_mock_123',
        expires_in: 900,
        is_new_user: true,
        is_new_device: true,
        signup_step: step,
        onboarding_step: 0,
        user: null,
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthLoginResponse>('/v1/auth/login', body);
  return data;
}

/**
 * 가입 이탈 후 재진입 시 온보딩 상태 조회
 */
export async function getAuthSignupStatus(): Promise<AuthSignupStatusResponse> {
  if (USE_MOCK) {
    return {
      data: { signup_step: 'SOCIAL_AUTHENTICATED', onboarding_step: 0 },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.get<AuthSignupStatusResponse>('/v1/auth/signup/status');
  return data;
}

/**
 * 회원가입 이용약관 동의
 */
export async function postAuthSignupConsent(
  body: AuthSignupConsentRequest
): Promise<AuthSignupConsentResponse> {
  if (USE_MOCK) {
    return {
      data: { signup_step: 'CONSENT_AGREED' },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthSignupConsentResponse>('/v1/auth/signup/consent', body);
  return data;
}

/**
 * 회원가입 프로필 설정
 */
export async function postAuthSignupProfile(
  body: AuthSignupProfileRequest
): Promise<AuthSignupProfileResponse> {
  if (USE_MOCK) {
    return {
      data: {
        signup_step: 'PROFILE_COMPLETED',
        onboarding_step: 0,
        nickname: body.nickname,
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthSignupProfileResponse>('/v1/auth/signup/profile', body);
  return data;
}

/**
 * 회원가입 완료
 */
export async function postAuthSignupComplete(): Promise<AuthSignupCompleteResponse> {
  if (USE_MOCK) {
    return {
      data: {
        signup_step: 'COMPLETED',
        status: 'ACTIVE',
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthSignupCompleteResponse>('/v1/auth/signup/complete');
  return data;
}

/**
 * 닉네임 중복 체크
 */
export async function getAuthNicknameDuplicateCheck(
  nickname: string
): Promise<AuthNicknameDuplicateCheckResponse> {
  if (USE_MOCK) {
    return {
      data: { duplicate: nickname.trim() === '효찬' },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.get<AuthNicknameDuplicateCheckResponse>(
    '/v1/auth/nickname/duplicate-check',
    { params: { nickname } }
  );
  return data;
}

/**
 * POST /v1/auth/refresh
 *
 * - refresh_token으로 Access Token만 갱신한다(명세상 refresh_token은 rotation하지 않음)
 * - 이 호출 자체는 401 refresh 로직의 대상이 되면 안 되므로 `_skipAuthRefresh`를 설정한다
 */
export async function postAuthRefresh(body: AuthRefreshRequest): Promise<AuthRefreshResponse> {
  if (USE_MOCK) {
    return {
      data: { access_token: 'eyJhbGci.mock_refreshed_access', expires_in: 900 },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthRefreshResponse>('/v1/auth/refresh', body, {
    _skipAuthRefresh: true,
  });
  return data;
}

/**
 * POST /v1/auth/logout
 *
 * - 명세상 body에는 deviceId가 필요하므로
 * - 현재 디바이스의 deviceId를 내부에서 가져와 항상 포함시키도록!
 */
export async function postAuthLogout(
  _body?: Partial<AuthLogoutRequest>
): Promise<AuthLogoutResponse> {
  const deviceId = await getOrCreateDeviceId();
  const body: AuthLogoutRequest = { deviceId };

  if (USE_MOCK) {
    return { data: { success: true }, meta: createMockMeta() };
  }

  const { data } = await apiClient.post<AuthLogoutResponse>('/v1/auth/logout', body);
  return data;
}
