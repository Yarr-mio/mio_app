import type { NotificationStatus } from '@/notifications/types';
import type { DevicePlatform } from '@/utils/appInfo';

/**
 * 푸시 알림 유형 (서버 `proactive_care_logs.trigger_code`)
 * — 이벤트 로그 `notification_opened.notification_type`의 도메인
 */
export type NotificationType =
  | 'checkin_reminder_morning'
  | 'checkin_reminder_afternoon'
  | 'checkin_reminder_evening'
  | 'todo_incomplete'
  | 'negative_emotion_streak'
  | 'report_weekly'
  | 'crisis_detected';

export interface NotificationDeviceRegisterRequest {
  device_id: string;
  push_token: string;
  platform: DevicePlatform;
  app_version: string;
}

export interface NotificationDeviceTokenResponse {
  success: boolean;
  device_id: string;
  platform: DevicePlatform;
}

export interface NotificationHistoryItem {
  notification_id: string;
  trigger_code: string;
  title: string;
  body: string;
  notification_status: NotificationStatus;
  sent_at: string;
  responded_at: string | null;
}

export interface MarkNotificationReadResponse {
  notification_id: string;
  notification_status: NotificationStatus;
  responded_at: string;
}

export interface FetchNotificationsParams {
  cursor?: string;
  limit?: number;
}
