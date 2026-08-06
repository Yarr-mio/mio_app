import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANALYTICS_STORAGE_KEYS, EVENT_BUFFER_MAX_COUNT } from '@/analytics/constants';
import type { AnyAnalyticsEvent } from '@/analytics/envelope';

/**
 * 이벤트 영속 버퍼 (AsyncStorage)
 *
 * 메모리 큐만 두면 flush 전에 큐가 통째로 사라지는 경로가 셋이다 —
 * 앱 강제 종료·크래시 / 네트워크 실패 후 종료 / 429 대기 중 종료.
 * 그 유실은 무작위가 아니라 **오래 오프라인이던 기기 = 앱을 잘 안 여는 유저**에 몰린다.
 * 그 집단만 골라 지워지면 리텐션이 실제보다 좋아 보이므로 디스크 버퍼가 필수다.
 *
 * ⚠️ `utils/storage.ts`(SecureStore)를 쓰면 안 된다 — 키체인이라 항목 크기 제한·쓰기 비용이 크고,
 * 애초에 비밀값이 아니다.
 */

function isAnalyticsEvent(value: unknown): value is AnyAnalyticsEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AnyAnalyticsEvent>;
  return typeof candidate.event_id === 'string' && typeof candidate.event_name === 'string';
}

/**
 * 버퍼 상한을 넘으면 오래된 것부터 버린다.
 * ⚠️ 버린 건수는 반드시 로깅한다 — 조용히 사라지면 대시보드의 빈 칸이 무엇 때문인지 구분되지 않는다.
 */
export function trimToBufferLimit(events: AnyAnalyticsEvent[]): AnyAnalyticsEvent[] {
  if (events.length <= EVENT_BUFFER_MAX_COUNT) {
    return events;
  }

  const droppedCount = events.length - EVENT_BUFFER_MAX_COUNT;
  console.warn(
    `[analytics] event buffer overflow — dropped ${droppedCount} oldest events (limit ${EVENT_BUFFER_MAX_COUNT})`
  );
  return events.slice(droppedCount);
}

/** 앱 시작 시 복원. 손상된 값은 조용히 버리고 빈 배열로 시작한다 */
export async function loadBufferedEvents(): Promise<AnyAnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEYS.eventQueue);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isAnalyticsEvent);
  } catch (error) {
    console.warn('[analytics] failed to restore event buffer', error);
    return [];
  }
}

export async function saveBufferedEvents(events: AnyAnalyticsEvent[]): Promise<void> {
  try {
    if (events.length === 0) {
      await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEYS.eventQueue);
      return;
    }

    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEYS.eventQueue, JSON.stringify(events));
  } catch (error) {
    console.warn('[analytics] failed to persist event buffer', error);
  }
}
