import axios, { create, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_BASE_URL, HTTP_STATUS } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';
import type { AuthRefreshResponse } from '@/types/auth';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { storage } from '@/utils/storage';

/**
 * Axios 클라이언트(단일 인스턴스) + 인터셉터.
 *
 * 요구사항 충족:
 * - 공통 헤더 자동 주입: X-Device-Id, X-App-Version, X-Platform, Authorization
 * - 401 AUTH_TOKEN_EXPIRED: refresh 후 원 요청 1회 재시도
 * - 401 REFRESH_TOKEN_INVALID: 로컬 토큰 전부 삭제 후 로그인 화면 이동
 *
 * 레이어 책임(CODING_RULES.md #11):
 * - `api/client.ts`는 "공통 정책(헤더/재시도/강제 로그아웃)"을 담당한다.
 * - `api/endpoints/*`는 try/catch로 삼키지 않고 에러를 그대로 throw한다.
 */
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _skipAuthRefresh?: boolean;
  }
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
  }
}

const apiClient = create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

/**
 * 앱 버전 문자열을 구한다.
 *
 * - Expo Router/Expo 앱에서 버전은 주로 `Constants.expoConfig.version`에 존재.
 * - 일부 환경에서는 `Constants.manifest.version` 형태로 내려오는 경우가 있어 안전하게 폴백한다.
 */
function getAppVersion(): string {
  // unavoidable cast: expo-constants 타입이 런타임 필드(Constants.manifest)를 노출하지 않는 환경이 있어 안전한 폴백을 위해 접근
  const manifest = (Constants as unknown as { manifest?: unknown }).manifest;
  const maybeManifestVersion =
    isRecord(manifest) && typeof manifest.version === 'string' ? manifest.version : null;

  return Constants.expoConfig?.version || maybeManifestVersion || '0.0.0';
}

/**
 * 백엔드 에러코드를 AxiosError에서 추출한다.
 *
 * 명세가 완전히 Swagger로 확정된 상태가 아니라서,
 * 아래와 같은 형태들을 유연하게 지원하도록 방어적으로 구현했다.
 *
 * - { error_code: "AUTH_TOKEN_EXPIRED" }
 * - { error: { code: "AUTH_TOKEN_EXPIRED" } }
 */
function readErrorCode(error: AxiosError): string | null {
  const data = error.response?.data as unknown;
  if (!data || typeof data !== 'object') return null;
  const obj = data as Record<string, unknown>;

  const direct = obj['error_code'];
  if (typeof direct === 'string') return direct;

  const nested = obj['error'];
  if (nested && typeof nested === 'object') {
    const code = (nested as Record<string, unknown>)['code'];
    if (typeof code === 'string') return code;
  }
  return null;
}

/**
 * Authorization 주입.
 *
 * - accessToken이 있고, 요청에 Authorization이 직접 지정되지 않았다면 자동으로 Bearer 토큰 주입.
 */
function injectAuthAndCommonHeaders(
  config: InternalAxiosRequestConfig,
  accessToken: string | null
) {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}

/**
 * Request interceptor:
 * - device_id를 가져오거나 생성(최초 1회)한 뒤 헤더에 주입
 * - app version / platform 주입
 * - access token 주입
 */
apiClient.interceptors.request.use(async (config) => {
  const accessToken = useAuthStore.getState().accessToken;
  const deviceId = await getOrCreateDeviceId();

  config.headers['X-Device-Id'] = deviceId;
  config.headers['X-App-Version'] = getAppVersion();
  config.headers['X-Platform'] = Platform.OS;

  return injectAuthAndCommonHeaders(config, accessToken);
});

let refreshPromise: Promise<string> | null = null;

/**
 * Access Token 갱신.
 *
 * - refresh_token은 Secure Storage에서 읽는다.
 * - refresh API 호출에는 (만료된) access token을 붙이지 않도록 별도 axios를 사용한다.
 * - 갱신 성공 시, Zustand 메모리 accessToken을 갱신한다.
 */
async function refreshAccessToken(): Promise<string> {
  const refreshToken = await storage.refreshToken.get();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const deviceId = await getOrCreateDeviceId();
  const { data } = await axios.post<AuthRefreshResponse>(
    `${API_BASE_URL}/v1/auth/refresh`,
    { refresh_token: refreshToken },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
        'X-App-Version': getAppVersion(),
        'X-Platform': Platform.OS,
      },
    }
  );

  const nextAccessToken = data.data.access_token;
  useAuthStore.getState().setAccessToken(nextAccessToken);
  return nextAccessToken;
}

/**
 * 로컬 인증정보 삭제 + 로그인 화면 이동(콜백).
 *
 * - accessToken: 메모리에서 제거
 * - refreshToken: Secure Storage에서 제거
 * - 라우팅: `app/_layout.tsx`에서 등록된 `onAuthInvalid` 콜백 실행
 */
async function clearLocalAuthAndRedirect(): Promise<void> {
  useAuthStore.getState().setAccessToken(null);
  await storage.refreshToken.delete();

  const handler = useAuthStore.getState().onAuthInvalid;
  handler?.();
}

/**
 * Response interceptor:
 * - 401 + AUTH_TOKEN_EXPIRED → refresh → 원 요청 1회 재시도
 * - 401 + REFRESH_TOKEN_INVALID → 강제 로그아웃
 *
 * 동시성:
 * - 여러 요청이 동시에 401을 맞아도 refresh는 1번만 수행하도록 `refreshPromise`로 병합한다.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = readErrorCode(error);

    if (!originalRequest || status !== HTTP_STATUS.UNAUTHORIZED) {
      throw error;
    }

    if (originalRequest._skipAuthRefresh) {
      throw error;
    }

    // 토큰 전부 삭제 + 로그인 화면으로 이동
    if (errorCode === 'REFRESH_TOKEN_INVALID') {
      await clearLocalAuthAndRedirect();
      throw error;
    }

    // 401
    if (errorCode !== 'AUTH_TOKEN_EXPIRED') {
      throw error;
    }

    if (originalRequest._retry) {
      throw error;
    }
    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const nextAccessToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return await apiClient(originalRequest);
    } catch (refreshError) {
      await clearLocalAuthAndRedirect();
      throw refreshError;
    }
  }
);

export default apiClient;
