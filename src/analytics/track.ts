import { buildAnalyticsEvent, captureEventContext } from '@/analytics/envelope';
import type { AnalyticsEventName, AnalyticsEventPropertiesMap } from '@/analytics/events';
import { enqueueEvent, flushQueue, restoreQueue, startQueueAutoFlush } from '@/analytics/queue';
import { USE_MOCK } from '@/constants/config';
import { getOrCreateDeviceId } from '@/utils/deviceId';

/**
 * 이벤트 발행 단일 진입점
 *
 * ⚠️ `USE_MOCK`이면 여기서 곧장 no-op이다. mock 모드는 네트워크를 타지 않고 mock 응답을
 * 반환하는데 `onSuccess`는 정상 통과하므로, 막지 않으면 개발자가 mock으로 앱을 만질 때마다
 * 가짜 가입·가짜 체크인이 실적재된다. 표본이 작아 개발자 몇 명의 세션이 코호트를 통째로 왜곡한다.
 * 발행 지점마다 조건을 흩지 말고 반드시 이 한 곳에서만 막는다.
 */
export function track<N extends AnalyticsEventName>(
  eventName: N,
  properties: AnalyticsEventPropertiesMap[N]
): void {
  if (USE_MOCK) {
    return;
  }

  // 발행 시각·토큰은 호출 시점에 고정한다 — envelope 조립이 비동기라 그 사이 상태가 바뀔 수 있다
  // (예: account_withdrawn은 발행 직후 토큰이 지워져 user_id가 비게 된다)
  const context = captureEventContext();

  void (async () => {
    try {
      enqueueEvent(await buildAnalyticsEvent(eventName, properties, context));
    } catch (error) {
      console.warn(`[analytics] failed to enqueue ${eventName}`, error);
    }
  })();
}

/**
 * 로그인 성공 시 익명 id와 유저 id를 이어 붙인다 (§2-B).
 * 이 이벤트가 빠지면 뒷단이 가입 전후를 다른 사람으로 센다.
 *
 * ⚠️ 토큰 갱신·재시도 경로에서는 절대 호출하지 않는다 — 로그인 성공에만 정확히 1회.
 */
export async function trackIdentify(userId: string): Promise<void> {
  if (USE_MOCK) {
    return;
  }

  track('identify', {
    previous_anonymous_id: await getOrCreateDeviceId(),
    user_id: userId,
  });
}

/** 앱 시작 시 1회 — 디스크에 남아 있던 이벤트를 복원하고 주기 전송을 시작한다 */
export function startAnalytics(): () => void {
  if (USE_MOCK) {
    return () => {};
  }

  void restoreQueue().then(() => flushQueue());
  return startQueueAutoFlush();
}

/** 백그라운드 전환처럼 앱이 멈추기 직전에 큐를 밀어낸다 */
export function flushAnalytics(): void {
  if (USE_MOCK) {
    return;
  }

  void flushQueue();
}
