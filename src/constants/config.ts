import Constants from 'expo-constants';

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
    // 끝 슬래시 제거. axios는 baseURL + 상대 경로 조합 시 알아서 정규화하지만,
    // SSE 전송(useChatSse)은 스트리밍 때문에 axios를 못 쓰고 문자열로 URL을 조합해야 해서
    // 값에 슬래시가 남아 있으면 '//v1/...'로 요청이 나간다. 값을 읽는 이 지점에서 한 번만 처리한다.
    return url.replace(/\/+$/, '');
  }
  if (USE_MOCK) {
    return '';
  }
  throw new Error('EXPO_PUBLIC_API_BASE_URL is required when EXPO_PUBLIC_USE_MOCK is not "true"');
}

export const API_BASE_URL = resolveApiBaseUrl();

/** 약관 동의 API 요청 시 사용하는 약관 버전 */
export const AUTH_CONSENT_VERSION = '1.0';

// APP_VARIANT는 EXPO_PUBLIC 이 아니라 런타임 process.env 로 읽히지 않음
// Metro 가 평가한 expoConfig 의 bundleId 로 dev production 판별
// 로컬 pnpm start 시 APP_VARIANT 가 production 이면 bundleId 도 production 으로 내려옴
const IS_DEV_VARIANT =
  (Constants.expoConfig?.ios?.bundleIdentifier ?? Constants.expoConfig?.android?.package) ===
  'com.mio.yarr.dev';

/** 카카오 네이티브 앱 키 Kakao SDK 초기화용 app.config nativeAppKey 와 동일 분기 */
export const KAKAO_NATIVE_APP_KEY = IS_DEV_VARIANT
  ? (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY_DEV?.trim() ?? '')
  : (process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim() ?? '');

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
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/** 인증 API 에러 코드 */
export const AUTH_API_ERROR_CODE = {
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
} as const;

/** 리포트 PENDING 상태 폴링 간격(ms) */
export const REPORT_POLL_INTERVAL_MS = 5_000;

/** 리포트 PENDING 폴링 최대 횟수 (5초 × 12회 = 1분) */
export const REPORT_POLL_MAX_ATTEMPTS = 12;

/** 스플래시 화면이 표시되는 기본 시간(ms)*/
export const SPLASH_DURATION_MS = 2500;

/** 세션 요약이 summary_status='pending'일 때 재조회 주기(ms) */
export const SESSION_SUMMARY_POLL_INTERVAL_MS = 3000;

/**
 * 화면에 한 번 그려진 세션 요약을 쿼리 캐시에 유지하는 시간(ms).
 * 다음 세션 요약 화면이 감정 변화율 비교용으로 이 값을 다시 읽는데, 두 세션 사이의 간격이
 * 기본 gcTime(5분)보다 긴 경우가 많아 넉넉하게 24시간으로 잡는다.
 */
export const SESSION_SUMMARY_CACHE_GC_TIME_MS = 1000 * 60 * 60 * 24;

/**
 * 채팅 SSE 스트림 안전 타임아웃(ms).
 * 서버 SseEmitter 타임아웃이 60초라 그보다 약간 길게 잡아, 연결이 완전히 멈춰버리는 극단적 케이스에서만 클라이언트가 직접 중단시킨다.
 */
export const SSE_STREAM_SAFETY_TIMEOUT_MS = 65000;
/** AI 응답 청크가 화면에 나타날 때 적용하는 fade-in 애니메이션 시간(ms) */
export const CHAT_CHUNK_FADE_DURATION_MS = 180;
/** Axios 요청 타임아웃(ms) */
export const API_TIMEOUT_MS = 10_000;

/** 체크인 목록 페이지당 개수 (백엔드 CheckinService.PAGE_SIZE와 동일하게 유지) */
export const CHECKIN_LIST_PAGE_SIZE = 20;

/** iOS bundle identifier 폴백 (expoConfig 미설정 환경용) */
export const IOS_BUNDLE_IDENTIFIER_FALLBACK = 'com.mio.yarr.dev';
