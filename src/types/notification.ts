import type { DevicePlatform } from '@/utils/appInfo';

export interface NotificationDeviceRegisterRequest {
  device_id: string;
  push_token: string;
  platform: DevicePlatform;
  app_version: string;
}

export interface NotificationDeviceTokenResponse {
  success: boolean;
}
