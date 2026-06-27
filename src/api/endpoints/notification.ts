import apiClient from '@/api/client';
import type { ApiResponse } from '@/types/common';
import type { NotificationSettings, NotificationSettingsUpdateParams } from '@/types/user';

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await apiClient.get<ApiResponse<NotificationSettings>>(
    '/v1/notifications/settings'
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
