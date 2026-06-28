import apiClient from '@/api/client';
import { NOTIFICATION_ENDPOINTS } from '@/constants/notifications';
import type { ApiResponse } from '@/types/common';
import type {
  NotificationDeviceTokenRequest,
  NotificationDeviceTokenResponse,
} from '@/types/notification';
import type { NotificationSettings, NotificationSettingsUpdateParams } from '@/types/user';

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await apiClient.get<ApiResponse<NotificationSettings>>(
    '/v1/notifications/settings'
  );
  return data.data;
}

export async function registerNotificationDevice(
  body: NotificationDeviceTokenRequest
): Promise<NotificationDeviceTokenResponse> {
  const { data } = await apiClient.post<ApiResponse<NotificationDeviceTokenResponse>>(
    NOTIFICATION_ENDPOINTS.devices,
    body
  );
  return data.data;
}

export async function unregisterNotificationDevice(
  token: string
): Promise<NotificationDeviceTokenResponse> {
  const { data } = await apiClient.delete<ApiResponse<NotificationDeviceTokenResponse>>(
    NOTIFICATION_ENDPOINTS.device(token)
  );
  return data.data;
}

export async function updateNotificationSettings(
  params: NotificationSettingsUpdateParams
): Promise<NotificationSettings> {
  const { data } = await apiClient.patch<ApiResponse<NotificationSettings>>(
    '/v1/notifications/settings',
    params
  );
  return data.data;
}
