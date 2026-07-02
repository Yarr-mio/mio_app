import { useEffect, useRef } from 'react';

import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import {
  getNativeDevicePushTokenAsync,
  subscribeNativePushTokenRefresh,
} from '@/notifications/fcm';
import { useAuthStore } from '@/store/authStore';

export function NotificationDeviceBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();
  const syncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      syncedTokenRef.current = null;
      return;
    }

    let cancelled = false;

    void getNativeDevicePushTokenAsync()
      .then(async (token) => {
        if (!token || cancelled || syncedTokenRef.current === token) {
          return;
        }

        await registerDeviceToken(token);
        syncedTokenRef.current = token;
      })
      .catch((error) => {
        console.error('[NotificationDeviceBootstrap]', error);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, registerDeviceToken]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const subscription = subscribeNativePushTokenRefresh(async (token) => {
      if (syncedTokenRef.current === token) {
        return;
      }

      try {
        await registerDeviceToken(token);
        syncedTokenRef.current = token;
      } catch (error) {
        console.error('[NotificationDeviceBootstrap:refresh]', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [accessToken, registerDeviceToken]);

  return null;
}
