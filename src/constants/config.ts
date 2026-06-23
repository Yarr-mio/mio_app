/**
 * mock 모드 플래그
 *
 * - true: `api/endpoints/*`가 실제 서버 호출 대신 명세 기반 mock 응답을 반환
 * - false: `API_BASE_URL`로 실제 네트워크 요청 수행
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

function resolveApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (url) {
    return url;
  }
  if (USE_MOCK) {
    return '';
  }
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required when EXPO_PUBLIC_USE_MOCK is not "true"');
}

export const API_BASE_URL = resolveApiBaseUrl();

/** 약관 동의 API 요청 시 사용하는 약관 버전 */
export const AUTH_CONSENT_VERSION = '1.0';

/** 카카오 네이티브 앱 키 (Kakao SDK 초기화 및 config plugin용) */
export const KAKAO_NATIVE_APP_KEY =
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV?.trim() ??
  process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ??
  '';

/**
 * HTTP 상태 코드 상수
 * - 인터셉터나 에러 처리에서 숫자(401)를 직접 쓰지 않도록 상수화
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
} as const;

/** 스플래시 화면이 표시되는 기본 시간(ms)*/
export const SPLASH_DURATION_MS = 2500;

/** Axios 요청 타임아웃(ms) */
export const API_TIMEOUT_MS = 10_000;

/** iOS bundle identifier 폴백 (expoConfig 미설정 환경용) */
export const IOS_BUNDLE_IDENTIFIER_FALLBACK = 'com.mio.yarr.dev';
