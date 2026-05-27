/**
 * 앱 전역 설정/상수.
 *
 * Coding Rules 준수:
 * - 환경변수(process.env.EXPO_PUBLIC_*)는 오직 이 파일에서만 읽는다. (규칙 #9)
 * - 매직 넘버/문자열을 여기로 모아두고, 다른 레이어에서는 import해서 쓴다. (규칙 #2)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'https://api-dev.mio.app';

/**
 * mock 모드 플래그.
 *
 * - true: `api/endpoints/*`가 실제 서버 호출 대신 명세 기반 mock 응답을 반환
 * - false: `API_BASE_URL`로 실제 네트워크 요청 수행
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

/**
 * HTTP 상태 코드 상수.
 *
 * - 인터셉터나 에러 처리에서 숫자(401)를 직접 쓰지 않도록 상수화.
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
} as const;

/** 스플래시 화면이 표시되는 기본 시간(ms)*/
export const SPLASH_DURATION_MS = 2500;
