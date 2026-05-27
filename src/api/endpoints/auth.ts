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
  AuthSignupCompleteRequest,
  AuthSignupCompleteResponse,
  AuthSignupStatusResponse,
  SignupStep,
} from '@/types/auth';
import type { ApiMeta } from '@/types/common';
import { getOrCreateDeviceId } from '@/utils/deviceId';

/**
 * Auth 도메인 순수 fetcher(endpoints).
 *
 * 요구사항 핵심:
 * - 모든 API 호출을 별도 레이어로 분리 (이 파일)
 * - 각 함수가 `USE_MOCK` 플래그로 실제/mock 분기
 *   - mock: 명세 Success Response 구조를 그대로 반환 (data/meta)
 *   - real: `apiClient`(Axios)로 `API_BASE_URL`에 요청
 *
 * 주의:
 * - 이 레이어에서는 try/catch로 에러를 "삼키지 않는다". (CODING_RULES.md #11)
 * - 에러의 공통 처리(401 refresh/retry)는 `api/client.ts` 인터셉터가 담당한다.
 */
function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

function mockSignupStep(): SignupStep {
  return 'SOCIAL_AUTHENTICATED';
}

export async function postAuthLogin(
  input: Omit<AuthLoginRequest, 'device_id'>
): Promise<AuthLoginResponse> {
  const deviceId = await getOrCreateDeviceId();
  const body: AuthLoginRequest = { ...input, device_id: deviceId };

  /**
   * POST /v1/auth/login
   *
   * - provider별 필요한 토큰(id_token / access_token)을 body에 포함
   * - device_id는 백엔드에서 "신규 기기 여부(is_new_device)" 판단 기준이므로 항상 포함
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
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<AuthLoginResponse>('/v1/auth/login', body);
  return data;
}

/**
 * GET /v1/auth/signup/status
 *
 * 가입 이탈 후 재진입 시, "현재 signup_step/onboarding_step"을 조회한다.
 * 로그인 응답에서 is_new_user=true 인데 signup_step이 SOCIAL_AUTHENTICATED가 아니라면
 * 명세상 이 API를 우선 호출해 현재 단계를 확정하는 흐름을 권장한다.
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
 * POST /v1/auth/signup/complete
 *
 * signup_step이 SOCIAL_AUTHENTICATED일 때,
 * 닉네임 설정 + 약관 동의를 한 번에 완료 처리한다.
 */
export async function postAuthSignupComplete(
  body: AuthSignupCompleteRequest
): Promise<AuthSignupCompleteResponse> {
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

  const { data } = await apiClient.post<AuthSignupCompleteResponse>(
    '/v1/auth/signup/complete',
    body
  );
  return data;
}

/**
 * GET /v1/auth/nickname/duplicate-check
  

 *
 * - UI에서 debounce(300ms) 적용을 권장(요구사항에 따라 UI 레이어에서 처리).
 * - 서버는 nickname 쿼리 파라미터를 기반으로 중복 여부를 반환한다.
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
 * - refresh_token으로 Access Token만 갱신한다(명세상 refresh_token은 rotation하지 않음).
 * - 이 호출 자체는 401 refresh 로직의 대상이 되면 안 되므로 `_skipAuthRefresh`를 설정한다.
 */
export async function postAuthRefresh(body: AuthRefreshRequest): Promise<AuthRefreshResponse> {
  console.log('USE_MOCK:', USE_MOCK);
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
 * - 명세상 body에는 device_id가 필요하다.
 * - 이 구현에서는 "현재 디바이스의 device_id"를 내부에서 가져와 항상 포함한다.
 */
export async function postAuthLogout(
  _body?: Partial<AuthLogoutRequest>
): Promise<AuthLogoutResponse> {
  const deviceId = await getOrCreateDeviceId();
  const body: AuthLogoutRequest = { device_id: deviceId };

  if (USE_MOCK) {
    return { data: { success: true }, meta: createMockMeta() };
  }

  const { data } = await apiClient.post<AuthLogoutResponse>('/v1/auth/logout', body);
  return data;
}
