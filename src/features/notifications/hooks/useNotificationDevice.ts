import { useMutation } from '@tanstack/react-query';

import {
  registerNotificationDevice,
  unregisterNotificationDevice,
} from '@/api/endpoints/notification';
import { forgetRegisteredPushToken, rememberRegisteredPushToken } from '@/notifications/fcm';
import type { NotificationDeviceTokenResponse } from '@/types/notification';

export function useRegisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, string>({
    mutationFn: (pushToken) => registerNotificationDevice(pushToken),
    onSuccess: async (_response, pushToken) => {
      await rememberRegisteredPushToken(pushToken);
    },
    onError: (error) => {
      console.error('[useRegisterNotificationDevice]', error);
    },
  });
}

export function useUnregisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, string>({
    mutationFn: (pushToken) => unregisterNotificationDevice(pushToken),
    onSuccess: async () => {
      await forgetRegisteredPushToken();
    },
    onError: (error) => {
      console.error('[useUnregisterNotificationDevice]', error);
    },
  });
}
