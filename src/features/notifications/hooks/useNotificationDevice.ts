import { useMutation } from '@tanstack/react-query';

import {
  registerNotificationDevice,
  unregisterNotificationDevice,
} from '@/api/endpoints/notification';
import { HTTP_STATUS } from '@/constants/config';
import { forgetRegisteredPushToken, rememberRegisteredPushToken } from '@/notifications/fcm';
import type { NotificationDeviceTokenResponse } from '@/types/notification';
import { getAppVersion, getDevicePlatform } from '@/utils/appInfo';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';

function isNotificationDeviceNotFoundError(error: unknown): boolean {
  const status = readApiHttpStatus(error);
  const errorCode = readApiErrorCode(error);
  return status === HTTP_STATUS.NOT_FOUND || errorCode === 'NOT_FOUND';
}

export function useRegisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, string>({
    mutationFn: async (pushToken) => {
      const device_id = (await getOrCreateDeviceId()).trim();

      if (__DEV__) {
        console.log('[useRegisterNotificationDevice] register params', {
          device_id,
          push_token: pushToken,
          platform: getDevicePlatform(),
          app_version: getAppVersion(),
        });
      }

      if (!device_id) {
        throw new Error('device_id is not ready');
      }

      return registerNotificationDevice(pushToken);
    },
    onSuccess: async (_response, pushToken) => {
      await rememberRegisteredPushToken(pushToken);
    },
    onError: (error) => {
      console.warn('[useRegisterNotificationDevice]', error);
    },
  });
}

export function useUnregisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, string>({
    mutationFn: async (pushToken) => {
      try {
        return await unregisterNotificationDevice(pushToken);
      } catch (error) {
        if (isNotificationDeviceNotFoundError(error)) {
          console.warn(
            '[useUnregisterNotificationDevice] push token already unregistered (NOT_FOUND)'
          );
          const platform = getDevicePlatform();
          if (!platform) {
            throw error;
          }

          return {
            success: true,
            device_id: (await getOrCreateDeviceId()).trim(),
            platform,
          };
        }

        throw error;
      }
    },
    onSuccess: async () => {
      await forgetRegisteredPushToken();
    },
    onError: (error) => {
      console.warn('[useUnregisterNotificationDevice] failed to unregister push token', error);
    },
  });
}
