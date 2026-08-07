/**
 * 이벤트 계측 상수 (event-logging-spec v3.5)
 *
 * 전송·버퍼·세션 판정에 쓰이는 수치를 한곳에 모은다 (docs/CODING_RULES.md §2 매직 넘버 금지).
 */

/** 수집 API 경로 */
export const EVENTS_ENDPOINT = '/v1/events';

/** 이벤트 계약 버전 (§2 — 현재 3 고정) */
export const EVENT_SCHEMA_VERSION = 3;

/** 배치당 최대 이벤트 건수 (§3) */
export const EVENT_BATCH_MAX_COUNT = 100;

/** 배치 요청 본문 최대 바이트 (§3 — 1MB) */
export const EVENT_BATCH_MAX_BYTES = 1024 * 1024;

/** 배치 본문에서 이벤트 배열을 감싸는 JSON 구조·구분자 몫으로 남겨두는 여유 바이트 */
export const EVENT_BATCH_OVERHEAD_BYTES = 1024;

/**
 * 큐 자동 flush 주기(ms).
 * §3-A의 속도 제한이 `X-Device-Id`당 분당 20배치이므로, 15초 주기(분당 4배치)면 상한에 닿지 않는다.
 */
export const EVENT_FLUSH_INTERVAL_MS = 15_000;

/** 이 건수 이상 쌓이면 주기를 기다리지 않고 즉시 flush */
export const EVENT_FLUSH_THRESHOLD_COUNT = 20;

/**
 * 영속 버퍼 최대 보관 건수. 초과하면 오래된 것부터 버린다.
 * 이벤트 1건이 300~500B이므로 2,000건이면 약 1MB 수준이다.
 */
export const EVENT_BUFFER_MAX_COUNT = 2_000;

/**
 * 영속 버퍼 직렬화 최대 바이트. 건수 상한이 가정한 "1건 300~500B"가 깨져도
 * AsyncStorage 한 항목이 플랫폼 상한(Android SQLite CursorWindow)에 닿지 않게 바이트로도 막는다.
 */
export const EVENT_BUFFER_MAX_BYTES = 1024 * 1024;

/** 전송 실패 재시도 백오프 초기 대기(ms) */
export const EVENT_RETRY_BASE_DELAY_MS = 2_000;

/** 전송 실패 재시도 백오프 배수 */
export const EVENT_RETRY_BACKOFF_FACTOR = 2;

/** 전송 실패 재시도 백오프 상한(ms) */
export const EVENT_RETRY_MAX_DELAY_MS = 5 * 60 * 1000;

/** `Retry-After` 헤더가 없는 429 응답에 적용할 기본 대기(ms) */
export const EVENT_RATE_LIMIT_FALLBACK_DELAY_MS = 60_000;

/** 앱 세션 만료 기준(ms) — 백그라운드 체류가 이 시간을 넘기면 새 세션 (§1) */
export const APP_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * 알림 탭 응답이 앱 세션의 진입점으로 인정되는 유효 시간(ms).
 * 탭 → 앱 활성화 사이의 순서가 플랫폼마다 달라, 이 창 안에서 도착한 응답만 `push_notification`으로 본다.
 */
export const PUSH_ENTRY_POINT_WINDOW_MS = 5_000;

/** 이벤트 계측용 AsyncStorage 키 (비밀값이 아니므로 SecureStore를 쓰지 않는다) */
export const ANALYTICS_STORAGE_KEYS = {
  /** 전송 대기 중인 이벤트 큐 */
  eventQueue: 'analytics.event_queue',
  /** 최초 실행 여부 판정용 — 값이 있으면 첫 세션이 아니다 */
  firstLaunchAt: 'analytics.first_launch_at',
  /** 직전 앱 세션 시작 시각 — `days_since_last_session` 산출용 */
  lastSessionStartedAt: 'analytics.last_session_started_at',
  /** 진입점 판정에 이미 사용한 알림 응답 id — 오래된 응답이 세션마다 재사용되는 것을 막는다 */
  consumedNotificationId: 'analytics.consumed_notification_id',
} as const;
