import type { NotificationResponse } from 'expo-notifications';
import { router, type Href } from 'expo-router';

import { markNotificationRead } from '@/api/endpoints/notification';
import { HOME_ROUTES, MAIN_ROUTES } from '@/constants/routes';
import { NOTIFICATION_TRIGGER_CODE, type PushNotificationDataPayload } from '@/notifications/types';

function readPushDataPayload(data: unknown): PushNotificationDataPayload {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const record = data as Record<string, unknown>;
  const notificationId = record.notification_id;
  const triggerCode = record.trigger_code;

  return {
    notification_id: typeof notificationId === 'string' ? notificationId : undefined,
    trigger_code: typeof triggerCode === 'string' ? triggerCode : undefined,
  };
}

function resolveNotificationRoute(triggerCode: string | undefined): Href {
  switch (triggerCode) {
    case NOTIFICATION_TRIGGER_CODE.checkinReminderMorning:
    case NOTIFICATION_TRIGGER_CODE.checkinReminderAfternoon:
    case NOTIFICATION_TRIGGER_CODE.checkinReminderEvening:
    case NOTIFICATION_TRIGGER_CODE.negativeEmotionStreak:
      return HOME_ROUTES.checkin;
    case NOTIFICATION_TRIGGER_CODE.reportWeekly:
      return HOME_ROUTES.report;
    case NOTIFICATION_TRIGGER_CODE.todoIncomplete:
    case NOTIFICATION_TRIGGER_CODE.crisisDetected:
    default:
      // MIO-Proactive-012 알림 탭 후 캐릭터 대화 세션 이동
      return MAIN_ROUTES.chat;
  }
}

/** 알림 탭 처리 열람 API 호출 및 트리거별 딥링크 이동 */
export async function handleNotificationTap(response: NotificationResponse): Promise<void> {
  const payload = readPushDataPayload(response.notification.request.content.data);
  const notificationId = payload.notification_id?.trim();

  if (notificationId) {
    try {
      await markNotificationRead(notificationId);
    } catch (error) {
      console.warn('[handleNotificationTap] mark read failed', error);
    }
  }

  router.push(resolveNotificationRoute(payload.trigger_code));
}
