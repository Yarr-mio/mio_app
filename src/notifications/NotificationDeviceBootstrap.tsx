import { useEffect, useRef } from 'react';

import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import {
  getNativeDevicePushTokenAsync,
  subscribeNativePushTokenRefresh,
} from '@/notifications/fcm';
import { useAuthStore } from '@/store/authStore';
import { getOrCreateDeviceId } from '@/utils/deviceId';

async function resolveDeviceIdForRegistration(): Promise<string | null> {
  const device_id = (await getOrCreateDeviceId()).trim();
  return device_id.length > 0 ? device_id : null;
}

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

    void (async () => {
      try {
        const device_id = await resolveDeviceIdForRegistration();
        if (!device_id || cancelled) {
          if (__DEV__ && !device_id) {
            console.warn(
              '[NotificationDeviceBootstrap] device_id not ready, skipping registration'
            );
          }
          return;
        }

        const token = await getNativeDevicePushTokenAsync();
        if (!token || cancelled || syncedTokenRef.current === token) {
          return;
        }

        await registerDeviceToken(token);
        syncedTokenRef.current = token;
      } catch (error) {
        console.warn('[NotificationDeviceBootstrap]', error);
      }
    })();

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
        const device_id = await resolveDeviceIdForRegistration();
        if (!device_id) {
          if (__DEV__) {
            console.warn(
              '[NotificationDeviceBootstrap:refresh] device_id not ready, skipping registration'
            );
          }
          return;
        }

        await registerDeviceToken(token);
        syncedTokenRef.current = token;
      } catch (error) {
        console.warn('[NotificationDeviceBootstrap:refresh]', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [accessToken, registerDeviceToken]);

  return null;
}
