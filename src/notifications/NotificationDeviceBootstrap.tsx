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

interface RegisterPushTokenParams {
  token: string;
  logContext: '' | ':refresh';
  /** 앱 시작 시 매번 POST용 force 플래그 refresh는 동일 토큰 중복 스킵 */
  force: boolean;
  registerDeviceToken: (pushToken: string) => Promise<NotificationDeviceTokenResponse>;
  lastRegisteredTokenRef: { current: string | null };
  inFlightTokenRef: { current: string | null };
}

async function registerPushToken({
  token,
  logContext,
  force,
  registerDeviceToken,
  lastRegisteredTokenRef,
  inFlightTokenRef,
}: RegisterPushTokenParams): Promise<void> {
  // 초기 등록과 refresh 동시 진입만 차단 force면 동일 토큰도 POST 재호출함
  if (inFlightTokenRef.current === token) {
    return;
  }
  if (!force && lastRegisteredTokenRef.current === token) {
    return;
  }

  inFlightTokenRef.current = token;

  try {
    const device_id = await resolveDeviceIdForRegistration();
    if (!device_id) {
      if (__DEV__) {
        console.warn(
          `[NotificationDeviceBootstrap${logContext}] device_id not ready, skipping registration`
        );
      }
      return;
    }

    // body의 device_id platform app_version은 registerNotificationDevice에서 채움
    await registerDeviceToken(token);
    lastRegisteredTokenRef.current = token;
  } catch (error) {
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
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const inFlightTokenRef = useRef<string | null>(null);
  // 가입 완료 COMPLETED 전에는 서버 디바이스 등록 시도 안 함
  const shouldRegisterDevice = accessToken !== null && signupStep === 'COMPLETED';

  useEffect(() => {
    if (!shouldRegisterDevice) {
      lastRegisteredTokenRef.current = null;
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

        // 명세 앱 시작 시마다 POST devices 동일 device_id면 서버 토큰 교체함
        await registerPushToken({
          token,
          logContext: '',
          force: true,
          registerDeviceToken,
          lastRegisteredTokenRef,
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
      await registerPushToken({
        token,
        logContext: ':refresh',
        force: false,
        registerDeviceToken,
        lastRegisteredTokenRef,
        inFlightTokenRef,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [shouldRegisterDevice, registerDeviceToken]);

  return null;
}
