import apiClient from '@/api/client';
import { NOTIFICATION_ENDPOINTS } from '@/constants/notifications';
import type { ApiResponse } from '@/types/common';
import type {
  NotificationDeviceRegisterRequest,
  NotificationDeviceTokenResponse,
} from '@/types/notification';
import type { NotificationSettings, NotificationSettingsUpdateParams } from '@/types/user';
import { getAppVersion, getDevicePlatform } from '@/utils/appInfo';
import { getOrCreateDeviceId } from '@/utils/deviceId';

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

async function buildNotificationDeviceRegisterBody(
  pushToken: string
): Promise<NotificationDeviceRegisterRequest> {
  const normalizedPushToken = pushToken.trim();
  const platform = getDevicePlatform();
  const device_id = (await getOrCreateDeviceId()).trim();
  const app_version = getAppVersion().trim();

  if (!isNonEmptyString(normalizedPushToken)) {
    throw new Error('push_token is required');
  }
  if (!platform) {
    throw new Error('platform must be ios or android');
  }
  if (!isNonEmptyString(device_id)) {
    throw new Error('device_id is required');
  }
  if (!isNonEmptyString(app_version)) {
    throw new Error('app_version is required');
  }

  const body: NotificationDeviceRegisterRequest = {
    device_id,
    push_token: normalizedPushToken,
    platform,
    app_version,
  };

  return body;
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data } = await apiClient.get<ApiResponse<NotificationSettings>>(
    '/v1/notifications/settings'
  );
  return data.data;
}

export async function registerNotificationDevice(
  pushToken: string
): Promise<NotificationDeviceTokenResponse> {
  const body = await buildNotificationDeviceRegisterBody(pushToken);

  const { data } = await apiClient.post<ApiResponse<NotificationDeviceTokenResponse>>(
    NOTIFICATION_ENDPOINTS.devices,
    body
  );
  return data.data;
}

export async function unregisterNotificationDevice(
  token: string
): Promise<NotificationDeviceTokenResponse> {
  const normalizedToken = token.trim();
  if (!isNonEmptyString(normalizedToken)) {
    throw new Error('push_token is required');
  }

  const { data } = await apiClient.delete<ApiResponse<NotificationDeviceTokenResponse>>(
    NOTIFICATION_ENDPOINTS.device(normalizedToken)
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
