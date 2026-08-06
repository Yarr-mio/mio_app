import * as Crypto from 'expo-crypto';

/**
 * 앱 세션 상태 — 모든 이벤트가 물고 나가는 `app_session_id`의 단일 원천 (event-logging-spec v3.5 §2)
 *
 * 세션 경계 판정(30분 규칙·진입점)은 `AnalyticsSessionProvider`가 담당하고,
 * 이 모듈은 "지금 세션이 무엇인가"만 들고 있는다.
 *
 * ⚠️ id 발급은 반드시 동기다. 세션 시작 판정에 필요한 값(최초 실행 여부 등)은 AsyncStorage에서
 * 비동기로 읽어오는데, 그 사이에 발행되는 이벤트도 `app_session_id`가 비면 안 되기 때문이다
 * (필수 5종 중 하나라 비면 그 이벤트만 거부된다).
 */
interface AppSessionState {
  id: string;
  startedAt: number;
  screenCount: number;
  lastScreen: string | null;
}

export interface AppSessionSnapshot {
  id: string;
  durationMs: number;
  screenCount: number;
  lastScreen: string | null;
}

let session: AppSessionState | null = null;

function createSession(): AppSessionState {
  return {
    id: Crypto.randomUUID(),
    startedAt: Date.now(),
    screenCount: 0,
    lastScreen: null,
  };
}

/** 현재 세션 id. 세션이 없으면 즉시 새로 만든다 */
export function getOrCreateAppSessionId(): string {
  session ??= createSession();
  return session.id;
}

export function hasActiveAppSession(): boolean {
  return session !== null;
}

/** 새 세션을 시작하고 그 id를 반환한다 (30분 규칙 충족 시 프로바이더가 호출) */
export function beginAppSession(): string {
  session = createSession();
  return session.id;
}

/**
 * 화면 진입 기록. 이번 화면의 referrer(직전 화면)를 돌려준다 — 세션 첫 화면이면 null.
 * 같은 화면이 연속으로 들어오면 재진입으로 보지 않고 무시한다(리렌더로 인한 중복 발행 방지).
 */
export function recordScreenView(screenName: string): { referrerScreen: string | null } | null {
  const current = session ?? createSession();
  session = current;

  if (current.lastScreen === screenName) {
    return null;
  }

  const referrerScreen = current.lastScreen;
  current.lastScreen = screenName;
  current.screenCount += 1;
  return { referrerScreen };
}

/** `app_session_ended` 발행용 스냅샷. 세션이 없으면 null */
export function getAppSessionSnapshot(): AppSessionSnapshot | null {
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    durationMs: Date.now() - session.startedAt,
    screenCount: session.screenCount,
    lastScreen: session.lastScreen,
  };
}
