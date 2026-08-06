import * as Notifications from 'expo-notifications';

import { NOTIFICATION_TYPE_PAYLOAD_KEYS, NOTIFICATION_TYPES } from '@/constants/notifications';
import type { NotificationType } from '@/types/notification';

/**
 * 알림 탭(응답) 처리
 *
 * `fcm.ts`가 권한·토큰만 다루는 것과 달리, 이 모듈은 "사용자가 알림을 탭했다"는 사실만 다룬다.
 * 탭 응답은 `notification_opened` 발행과 앱 세션 진입점(`push_notification`) 판정의 원천이다.
 */

export type NotificationResponse = Notifications.NotificationResponse;

export function subscribeNotificationResponse(
  listener: (response: NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/** 콜드 스타트 판정용 — 앱을 열게 만든 알림 응답이 있으면 돌려준다 */
export async function getLastNotificationResponse(): Promise<NotificationResponse | null> {
  return (await Notifications.getLastNotificationResponseAsync()) ?? null;
}

/** 같은 응답을 두 번 소비하지 않기 위한 식별자 */
export function readNotificationResponseId(response: NotificationResponse): string {
  return response.notification.request.identifier;
}

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

/**
 * 푸시 payload에서 알림 유형을 읽는다.
 *
 * 발송 측(BE)이 유형을 아직 싣지 않을 수 있고, 그때는 null로 적재한다 —
 * 결손을 감추지 않는 것이 정본이라 소비 측이 `(유형 미상)` 행으로 그린다.
 */
export function readNotificationType(response: NotificationResponse): NotificationType | null {
  const data: unknown = response.notification.request.content.data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as Record<string, unknown>;
  for (const key of NOTIFICATION_TYPE_PAYLOAD_KEYS) {
    const value = payload[key];
    if (isNotificationType(value)) {
      return value;
    }
  }

  return null;
}
