import type { NotificationResponse } from 'expo-notifications';
import { router, type Href } from 'expo-router';

import { markNotificationRead } from '@/api/endpoints/notification';
import { AUTH_ROUTES, HOME_ROUTES, MAIN_ROUTES } from '@/constants/routes';
import { NOTIFICATION_TRIGGER_CODE, type PushNotificationDataPayload } from '@/notifications/types';

const SERVER_ROUTE_TO_HREF: Record<string, Href> = {
  '/checkin': HOME_ROUTES.checkin,
  '/chat': MAIN_ROUTES.chat,
  '/todo': HOME_ROUTES.todo,
  '/report': HOME_ROUTES.report,
  '/home': AUTH_ROUTES.home,
};

/** route 미전송 시 fallback — trigger_code -> 서버 경로*/
const TRIGGER_CODE_TO_SERVER_ROUTE: Record<string, string> = {
  [NOTIFICATION_TRIGGER_CODE.checkinReminderMorning]: '/checkin',
  [NOTIFICATION_TRIGGER_CODE.checkinReminderAfternoon]: '/checkin',
  [NOTIFICATION_TRIGGER_CODE.checkinReminderEvening]: '/checkin',
  [NOTIFICATION_TRIGGER_CODE.negativeEmotionStreak]: '/chat',
  [NOTIFICATION_TRIGGER_CODE.crisisDetected]: '/chat',
  [NOTIFICATION_TRIGGER_CODE.todoIncomplete]: '/todo',
  [NOTIFICATION_TRIGGER_CODE.reportWeekly]: '/report',
};

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readPushDataPayload(data: unknown): PushNotificationDataPayload {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const record = data as Record<string, unknown>;

  return {
    // 푸시 payload 는 `type` 키
    type: readString(record, 'type') ?? readString(record, 'trigger_code'),
    route: readString(record, 'route'),
    slot: readString(record, 'slot'),
    notification_id: readString(record, 'notification_id'),
  };
}

/**
 * 탭 시 이동할 화면을 결정
 */
function resolveNotificationRoute(payload: PushNotificationDataPayload): Href {
  const fromRoute = payload.route ? SERVER_ROUTE_TO_HREF[payload.route] : undefined;
  if (fromRoute) {
    return fromRoute;
  }

  const serverRoute = payload.type ? TRIGGER_CODE_TO_SERVER_ROUTE[payload.type] : undefined;
  const fromType = serverRoute ? SERVER_ROUTE_TO_HREF[serverRoute] : undefined;
  return fromType ?? AUTH_ROUTES.home;
}

/** 알림 탭 처리 열람 API 호출 및 트리거별 딥링크 이동 */
export async function handleNotificationTap(response: NotificationResponse): Promise<void> {
  const payload = readPushDataPayload(response.notification.request.content.data);
  const notificationId = payload.notification_id?.trim();

  // 서버가 notification_id 를 내려보내기 시작하면 재릴리스 없이 오픈율 집계가 켜지는 방어 분기
  if (notificationId) {
    try {
      await markNotificationRead(notificationId);
    } catch (error) {
      console.warn('[handleNotificationTap] mark read failed', error);
    }
  }

  const href = resolveNotificationRoute(payload);
  const slot = payload.slot?.trim();

  // 체크인 슬롯은 체크인 화면에만 전달 (화면이 slot param 을 소비하기 시작하면 자동 반영)
  if (slot && href === HOME_ROUTES.checkin) {
    router.push({ pathname: HOME_ROUTES.checkin, params: { slot } });
    return;
  }

  router.push(href);
}
