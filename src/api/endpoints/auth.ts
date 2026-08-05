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
  AuthWithdrawResponse,
  SignupStep,
} from '@/types/auth';
import type { ApiMeta } from '@/types/common';
import { getOrCreateDeviceId } from '@/utils/deviceId';

function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

let mockSignupStepState: SignupStep = 'SOCIAL_AUTHENTICATED';

function setMockSignupStep(step: SignupStep): void {
  mockSignupStepState = step;
}

export async function postAuthLogin(
  input: Omit<AuthLoginRequest, 'device_id'>
): Promise<AuthLoginResponse> {
  const device_id = await getOrCreateDeviceId();
  const body: AuthLoginRequest = { ...input, device_id };

  /**
   * 소셜 로그인 요청
   */
  if (USE_MOCK) {
    setMockSignupStep('SOCIAL_AUTHENTICATED');
    return {
      data: {
        access_token: 'eyJhbGci.mock_access',
        refresh_token: 'mio_refresh_mock_123',
        expires_in: 900,
        is_new_user: true,
        is_new_device: true,
        signup_step: mockSignupStepState,
        onboarding_step: 0,
        user: null,
      },
      meta: createMockMeta(),
    };
  }

  const apiBody = {
    provider: body.provider,
    device_id: body.device_id,
    ...(body.id_token ? { id_token: body.id_token } : {}),
    ...(body.access_token ? { access_token: body.access_token } : {}),
  };

  const { data } = await apiClient.post<AuthLoginResponse>('/v1/auth/login', apiBody, {
    _skipAuthInjection: true,
  });
  return data;
}

/**
 * 가입 상태 조회
 */
export async function getAuthSignupStatus(): Promise<AuthSignupStatusResponse> {
  if (USE_MOCK) {
    return {
      data: { signup_step: mockSignupStepState, onboarding_step: 0 },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.get<AuthSignupStatusResponse>('/v1/auth/signup/status');
  return data;
}

/**
 * 이용약관 동의
 */
export async function postAuthSignupConsent(
  body: AuthSignupConsentRequest
): Promise<AuthSignupConsentResponse> {
  if (USE_MOCK) {
    setMockSignupStep('CONSENT_AGREED');
    return {
      data: { signup_step: 'CONSENT_AGREED' },
      meta: createMockMeta(),
    };
  }

  if (__DEV__) {
    console.log('[AUTH] consent request body:', JSON.stringify(body));
  }
  const { data } = await apiClient.post<AuthSignupConsentResponse>('/v1/auth/signup/consent', body);
  if (__DEV__) {
    console.log('[AUTH] consent response:', JSON.stringify(data));
  }
  return data;
}

/**
 * 프로필 설정
 */
export async function postAuthSignupProfile(
  body: AuthSignupProfileRequest
): Promise<AuthSignupProfileResponse> {
  if (USE_MOCK) {
    setMockSignupStep('PROFILE_COMPLETED');
    return {
      data: {
        signup_step: 'PROFILE_COMPLETED',
        onboarding_step: 0,
        nickname: body.nickname,
      },
      meta: createMockMeta(),
    };
  }

  if (__DEV__) {
    console.log('[AUTH] profile request body:', JSON.stringify(body));
  }
  const { data } = await apiClient.post<AuthSignupProfileResponse>('/v1/auth/signup/profile', body);
  if (__DEV__) {
    console.log('[AUTH] profile response:', JSON.stringify(data));
  }
  return data;
}

/**
 * 회원가입 최종 완료
 */
export async function postAuthSignupComplete(): Promise<AuthSignupCompleteResponse> {
  if (USE_MOCK) {
    setMockSignupStep('COMPLETED');
    return {
      data: {
        signup_step: 'COMPLETED',
        status: 'ACTIVE',
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthSignupCompleteResponse>('/v1/auth/signup/complete');
  if (__DEV__) {
    console.log('[AUTH] signup complete response:', JSON.stringify(data));
  }
  return data;
}

/**
 * 닉네임 중복 확인
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

  if (__DEV__) {
    console.log('[AUTH] nickname duplicate check:', nickname);
  }
  const { data } = await apiClient.get<AuthNicknameDuplicateCheckResponse>(
    '/v1/auth/nickname/duplicate-check',
    { params: { nickname } }
  );
  if (__DEV__) {
    console.log('[AUTH] nickname duplicate response:', JSON.stringify(data));
  }
  return data;
}

/**
 * Access Token 갱신
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
    _skipAuthInjection: true,
  });
  return data;
}

/**
 * 로그아웃
 */
export async function postAuthLogout(
  _body?: Partial<AuthLogoutRequest>
): Promise<AuthLogoutResponse> {
  const device_id = await getOrCreateDeviceId();
  const body: AuthLogoutRequest = { device_id };

  if (USE_MOCK) {
    setMockSignupStep('SOCIAL_AUTHENTICATED');
    return { data: { success: true }, meta: createMockMeta() };
  }

  const { data } = await apiClient.post<AuthLogoutResponse>('/v1/auth/logout', body);
  return data;
}

/**
 * 회원 탈퇴
 */
export async function deleteAuthWithdraw(): Promise<AuthWithdrawResponse> {
  if (USE_MOCK) {
    setMockSignupStep('SOCIAL_AUTHENTICATED');
    return { data: { success: true }, meta: createMockMeta() };
  }

  const { data } = await apiClient.delete<AuthWithdrawResponse>('/v1/auth/withdraw');
  return data;
}
