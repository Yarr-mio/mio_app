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
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  TOO_MANY_REQUESTS: 429,
} as const;

/** 스플래시 화면이 표시되는 기본 시간(ms)*/
export const SPLASH_DURATION_MS = 2500;

/** 세션 요약이 summary_status='pending'일 때 재조회 주기(ms) */
export const SESSION_SUMMARY_POLL_INTERVAL_MS = 3000;

/**
 * 채팅 SSE 스트림 안전 타임아웃(ms).
 * 서버 SseEmitter 타임아웃이 60초라 그보다 약간 길게 잡아, 연결이 완전히 멈춰버리는 극단적 케이스에서만 클라이언트가 직접 중단시킨다.
 */
export const SSE_STREAM_SAFETY_TIMEOUT_MS = 65000;
