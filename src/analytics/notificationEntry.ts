import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANALYTICS_STORAGE_KEYS, PUSH_ENTRY_POINT_WINDOW_MS } from '@/analytics/constants';
import { track } from '@/analytics/track';
import {
  getLastNotificationResponse,
  readNotificationResponseId,
  readNotificationType,
  subscribeNotificationResponse,
  type NotificationResponse,
} from '@/notifications/notificationResponse';

/**
 * 알림 탭 → `notification_opened` 발행 + 앱 세션 진입점(`push_notification`) 판정
 *
 * 세션 시작 판정보다 먼저 붙어야 한다. 늦게 붙으면 알림으로 열린 콜드 스타트가
 * `cold_start`로 잘못 찍힌다.
 */

/** 이번 실행에서 이미 처리한 응답 — 콜드 스타트 조회와 리스너가 같은 탭을 두 번 세지 않게 한다 */
const handledResponseIds = new Set<string>();

/** 알림 탭이 관측된 시각 — 이 값이 신선할 때 시작된 세션만 푸시 진입으로 본다 */
let pushEntryMarkedAt = 0;

/** 응답 1건을 처리하고 새로 처리한 것인지 반환한다 (동기 — 중간에 await가 없어야 중복이 안 생긴다) */
function handleNotificationResponse(response: NotificationResponse): boolean {
  const responseId = readNotificationResponseId(response);
  if (handledResponseIds.has(responseId)) {
    return false;
  }

  handledResponseIds.add(responseId);
  pushEntryMarkedAt = Date.now();
  track('notification_opened', { notification_type: readNotificationType(response) });
  return true;
}

/**
 * 직전에 관측된 알림 탭을 세션 진입점으로 소비한다.
 * 한 번 소비하면 사라지므로 다음 세션이 같은 탭을 다시 진입점으로 쓰지 않는다.
 */
export function consumePushEntry(): boolean {
  const isFresh =
    pushEntryMarkedAt > 0 && Date.now() - pushEntryMarkedAt <= PUSH_ENTRY_POINT_WINDOW_MS;
  pushEntryMarkedAt = 0;
  return isFresh;
}

/** 알림 탭 구독 시작. 반환한 함수를 호출하면 해제된다 */
export function startNotificationEntryTracking(): () => void {
  const subscription = subscribeNotificationResponse(handleNotificationResponse);
  return () => subscription.remove();
}

/**
 * 콜드 스타트가 알림 탭으로 시작됐는지 판정
 *
 * `getLastNotificationResponseAsync()`는 지난 실행의 응답도 그대로 돌려주므로,
 * 이미 소비한 응답 id를 남겨 두고 같으면 무시한다 — 안 그러면 그 뒤의 모든 콜드 스타트가
 * `push_notification`으로 찍힘
 */
export async function resolveColdStartPushEntry(): Promise<boolean> {
  try {
    const response = await getLastNotificationResponse();
    if (!response) {
      return false;
    }

    const responseId = readNotificationResponseId(response);
    const consumedResponseId = await AsyncStorage.getItem(
      ANALYTICS_STORAGE_KEYS.consumedNotificationId
    );
    if (consumedResponseId === responseId) {
      return false;
    }

    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEYS.consumedNotificationId, responseId);
    handleNotificationResponse(response);
    return true;
  } catch (error) {
    console.warn('[analytics] failed to resolve cold start push entry', error);
    return false;
  }
}
