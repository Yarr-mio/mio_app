import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import { EVENT_SCHEMA_VERSION } from '@/analytics/constants';
import type { AnalyticsEventName, AnalyticsEventPropertiesMap } from '@/analytics/events';
import { getOrCreateAppSessionId } from '@/analytics/session';
import { useAuthStore } from '@/store/authStore';
import { getAppVersion, getDevicePlatform } from '@/utils/appInfo';
import { formatKstIsoWithOffset } from '@/utils/date';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { readUserIdFromAccessToken } from '@/utils/jwt';

/**
 * 공통 envelope (event-logging-spec v3.5 §2)
 *
 * 필수 5종(`event_id`·`event_name`·`ts_client`·`anonymous_id`·`app_session_id`)이 비면
 * 서버가 그 이벤트를 거부한다. 나머지는 비어도 통과한다.
 */
export interface AnalyticsEvent<N extends AnalyticsEventName = AnalyticsEventName> {
  /** 발행 시점에 생성. 재시도해도 절대 재생성하지 않는다 — 중복 제거 키 (§3) */
  event_id: string;
  event_name: N;
  schema_version: number;
  /** offset 포함 ISO8601 (KST) */
  ts_client: string;
  anonymous_id: string;
  /** 로그인 전에는 null */
  user_id: string | null;
  app_session_id: string;
  app_version: string;
  platform: string;
  os_version: string;
  /** flatten하지 않고 중첩 그대로 보낸다 */
  properties: AnalyticsEventPropertiesMap[N];
}

/**
 * 큐·버퍼·전송이 다루는 이벤트 타입.
 * 발행 시점에 이름과 properties의 짝은 `track()`이 보장하므로, 이후 층은 짝을 다시 좁히지 않는다.
 */
export type AnyAnalyticsEvent = AnalyticsEvent<AnalyticsEventName>;

/**
 * `Crypto.randomUUID()`를 그대로 쓴다 — `useChatSse`가 이미 `Idempotency-Key`로 쓰고 있어
 * UUID 생성을 다시 구현할 이유가 없다.
 */
function createEventId(): string {
  return Crypto.randomUUID();
}

/**
 * 발행 시점에 고정해야 하는 값.
 *
 * envelope 조립이 비동기(device id 조회)라, 그 사이에 시간이 흐르거나 로그아웃·탈퇴로 토큰이
 * 비워질 수 있다. 발행 순간의 값을 `track()`이 동기로 캡처해 넘긴다.
 *
 * `appSessionId`도 같은 이유다 — device id 조회 사이에 30분 규칙으로 세션이 갈리면 이전 세션에서
 * 발행한 이벤트가 새 세션 id를 달고 나가 세션 경계가 흐려진다.
 */
export interface AnalyticsEventContext {
  tsClient: string;
  accessToken: string | null;
  appSessionId: string;
}

export function captureEventContext(): AnalyticsEventContext {
  return {
    tsClient: formatKstIsoWithOffset(),
    accessToken: useAuthStore.getState().accessToken,
    appSessionId: getOrCreateAppSessionId(),
  };
}

export async function buildAnalyticsEvent<N extends AnalyticsEventName>(
  eventName: N,
  properties: AnalyticsEventPropertiesMap[N],
  context: AnalyticsEventContext
): Promise<AnalyticsEvent<N>> {
  return {
    event_id: createEventId(),
    event_name: eventName,
    schema_version: EVENT_SCHEMA_VERSION,
    ts_client: context.tsClient,
    anonymous_id: await getOrCreateDeviceId(),
    user_id: readUserIdFromAccessToken(context.accessToken),
    app_session_id: context.appSessionId,
    app_version: getAppVersion(),
    platform: getDevicePlatform() ?? Platform.OS,
    os_version: String(Platform.Version),
    properties,
  };
}
