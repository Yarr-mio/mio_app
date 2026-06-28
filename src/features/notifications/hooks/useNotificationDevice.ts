import { useMutation } from '@tanstack/react-query';

import {
  registerNotificationDevice,
  unregisterNotificationDevice,
} from '@/api/endpoints/notification';
import { forgetRegisteredPushToken, rememberRegisteredPushToken } from '@/notifications/fcm';
import type {
  NotificationDeviceTokenRequest,
  NotificationDeviceTokenResponse,
} from '@/types/notification';

export function useRegisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, NotificationDeviceTokenRequest>({
    mutationFn: (body) => registerNotificationDevice(body),
    onSuccess: async (_response, variables) => {
      await rememberRegisteredPushToken(variables.token);
    },
    onError: (error) => {
      console.error('[useRegisterNotificationDevice]', error);
    },
  });
}

export function useUnregisterNotificationDevice() {
  return useMutation<NotificationDeviceTokenResponse, Error, NotificationDeviceTokenRequest>({
    mutationFn: (body) => unregisterNotificationDevice(body.token),
    onSuccess: async () => {
      await forgetRegisteredPushToken();
    },
    onError: (error) => {
      console.error('[useUnregisterNotificationDevice]', error);
    },
  });
}
