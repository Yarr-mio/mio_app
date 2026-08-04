import type { NotificationStatus } from '@/notifications/types';
import type { DevicePlatform } from '@/utils/appInfo';

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
