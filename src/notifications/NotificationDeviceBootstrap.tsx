import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import { ensurePushNotificationReady } from '@/notifications/ensurePushNotificationReady';
import {
  getNativeDevicePushTokenAsync,
  getNotificationPermissionGrantedAsync,
  subscribeNativePushTokenRefresh,
} from '@/notifications/fcm';
import { useAuthStore } from '@/store/authStore';
import type { NotificationDeviceTokenResponse } from '@/types/notification';
import { getOrCreateDeviceId } from '@/utils/deviceId';

async function resolveDeviceIdForRegistration(): Promise<string | null> {
  const device_id = (await getOrCreateDeviceId()).trim();
  return device_id.length > 0 ? device_id : null;
}

interface PendingPushTokenRegistration {
  token: string;
  logContext: '' | ':refresh';
  force: boolean;
}

interface EnqueueRegisterPushTokenParams {
  token: string;
  logContext: '' | ':refresh';
  /** 앱 시작 시 동일 토큰도 POST 재호출용 */
  force: boolean;
  registerDeviceToken: (pushToken: string) => Promise<NotificationDeviceTokenResponse>;
  lastRegisteredTokenRef: { current: string | null };
  pendingRegistrationRef: { current: PendingPushTokenRegistration | null };
  registrationChainRef: { current: Promise<void> };
}

function enqueueRegisterPushToken({
  token,
  logContext,
  force,
  registerDeviceToken,
  lastRegisteredTokenRef,
  pendingRegistrationRef,
  registrationChainRef,
}: EnqueueRegisterPushTokenParams): Promise<void> {
  // 대기열은 최신 토큰만 유지
  pendingRegistrationRef.current = { token, logContext, force };

  const flushPendingRegistrations = async () => {
    while (pendingRegistrationRef.current) {
      const pending = pendingRegistrationRef.current;
      pendingRegistrationRef.current = null;

      if (!pending.force && lastRegisteredTokenRef.current === pending.token) {
        continue;
      }

      try {
        const device_id = await resolveDeviceIdForRegistration();
        if (!device_id) {
          if (__DEV__) {
            console.warn(
              `[NotificationDeviceBootstrap${pending.logContext}] device_id not ready, skipping registration`
            );
          }
          continue;
        }

        // device_id platform app_version은 등록 API에서 채움
        await registerDeviceToken(pending.token);
        lastRegisteredTokenRef.current = pending.token;
      } catch (error) {
        console.warn(`[NotificationDeviceBootstrap${pending.logContext}]`, error);
      }
    }
  };

  // 등록 요청은 순차 처리하고 최신 토큰만 반영 예정
  const next = registrationChainRef.current.then(
    flushPendingRegistrations,
    flushPendingRegistrations
  );
  registrationChainRef.current = next;
  return next;
}

export function NotificationDeviceBootstrap() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const pendingRegistrationRef = useRef<PendingPushTokenRegistration | null>(null);
  const registrationChainRef = useRef(Promise.resolve());
  const wasPermissionGrantedRef = useRef<boolean | null>(null);
  const isForegroundPermissionSyncInFlightRef = useRef(false);
  // 비로그인 시 디바이스 등록 스킵함
  const shouldRegisterDevice = accessToken !== null;

  useEffect(() => {
    if (!shouldRegisterDevice) {
      lastRegisteredTokenRef.current = null;
      pendingRegistrationRef.current = null;
      wasPermissionGrantedRef.current = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const token = await getNativeDevicePushTokenAsync();
        if (!token || cancelled) {
          return;
        }

        // 앱 시작 시 POST 강제 등록
        await enqueueRegisterPushToken({
          token,
          logContext: '',
          force: true,
          registerDeviceToken,
          lastRegisteredTokenRef,
          pendingRegistrationRef,
          registrationChainRef,
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
      await enqueueRegisterPushToken({
        token,
        logContext: ':refresh',
        force: false,
        registerDeviceToken,
        lastRegisteredTokenRef,
        pendingRegistrationRef,
        registrationChainRef,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [shouldRegisterDevice, registerDeviceToken]);

  // 포그라운드 복귀 시 권한 거부에서 허용으로 바뀐 경우만 디바이스 재등록함
  useEffect(() => {
    if (!shouldRegisterDevice) {
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      const granted = await getNotificationPermissionGrantedAsync();
      if (!cancelled) {
        wasPermissionGrantedRef.current = granted;
      }
    })();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      if (isForegroundPermissionSyncInFlightRef.current) {
        return;
      }

      isForegroundPermissionSyncInFlightRef.current = true;

      void (async () => {
        try {
          const granted = await getNotificationPermissionGrantedAsync();
          if (cancelled) {
            return;
          }

          const wasGranted = wasPermissionGrantedRef.current;
          wasPermissionGrantedRef.current = granted;

          if (wasGranted !== false || granted !== true) {
            return;
          }

          if (cancelled) {
            return;
          }

          const result = await ensurePushNotificationReady({ registerDeviceToken });
          if (cancelled || result !== 'ready') {
            return;
          }

          const token = await getNativeDevicePushTokenAsync();
          if (token) {
            lastRegisteredTokenRef.current = token;
          }
        } catch (error) {
          console.warn('[NotificationDeviceBootstrap:foreground]', error);
        } finally {
          isForegroundPermissionSyncInFlightRef.current = false;
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [shouldRegisterDevice, registerDeviceToken]);

  return null;
}
