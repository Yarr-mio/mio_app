import { useEffect, useRef } from 'react';

import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import {
  getNativeDevicePushTokenAsync,
  subscribeNativePushTokenRefresh,
} from '@/notifications/fcm';
import { useAuthStore } from '@/store/authStore';
import type { NotificationDeviceTokenResponse } from '@/types/notification';
import { getOrCreateDeviceId } from '@/utils/deviceId';

async function resolveDeviceIdForRegistration(): Promise<string | null> {
  const device_id = (await getOrCreateDeviceId()).trim();
  return device_id.length > 0 ? device_id : null;
}

interface RegisterPushTokenOnceParams {
  token: string;
  logContext: '' | ':refresh';
  registerDeviceToken: (pushToken: string) => Promise<NotificationDeviceTokenResponse>;
  syncedTokenRef: { current: string | null };
  inFlightTokenRef: { current: string | null };
}

async function registerPushTokenOnce({
  token,
  logContext,
  registerDeviceToken,
  syncedTokenRef,
  inFlightTokenRef,
}: RegisterPushTokenOnceParams): Promise<void> {
  if (syncedTokenRef.current === token || inFlightTokenRef.current === token) {
    return;
  }

  const previousSyncedToken = syncedTokenRef.current;
  // 초기 등록과 refresh listener가 동시에 같은 token으로 진입하는 것을 막기 위해 API 호출 전에 먼저 반영
  syncedTokenRef.current = token;
  inFlightTokenRef.current = token;

  try {
    const device_id = await resolveDeviceIdForRegistration();
    if (!device_id) {
      syncedTokenRef.current = previousSyncedToken;
      if (__DEV__) {
        console.warn(
          `[NotificationDeviceBootstrap${logContext}] device_id not ready, skipping registration`
        );
      }
      return;
    }

    await registerDeviceToken(token);
  } catch (error) {
    syncedTokenRef.current = previousSyncedToken;
    console.warn(`[NotificationDeviceBootstrap${logContext}]`, error);
  } finally {
    if (inFlightTokenRef.current === token) {
      inFlightTokenRef.current = null;
    }
  }
}

export function NotificationDeviceBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const signupStep = useAuthStore((state) => state.signupStep);
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();
  const syncedTokenRef = useRef<string | null>(null);
  const inFlightTokenRef = useRef<string | null>(null);
  // 가입 완료(COMPLETED) 전에는 서버 디바이스 등록을 시도하지 않음
  const shouldRegisterDevice = accessToken !== null && signupStep === 'COMPLETED';

  useEffect(() => {
    if (!shouldRegisterDevice) {
      syncedTokenRef.current = null;
      inFlightTokenRef.current = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getNativeDevicePushTokenAsync();
        if (!token || cancelled) {
          return;
        }

        await registerPushTokenOnce({
          token,
          logContext: '',
          registerDeviceToken,
          syncedTokenRef,
          inFlightTokenRef,
        });
      } catch (error) {
        if (!cancelled) {
          console.warn('[NotificationDeviceBootstrap]', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldRegisterDevice, registerDeviceToken]);

  useEffect(() => {
    if (!shouldRegisterDevice) {
      return undefined;
    }

    const subscription = subscribeNativePushTokenRefresh(async (token) => {
      await registerPushTokenOnce({
        token,
        logContext: ':refresh',
        registerDeviceToken,
        syncedTokenRef,
        inFlightTokenRef,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [shouldRegisterDevice, registerDeviceToken]);

  return null;
}
