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
  const signupStep = useAuthStore((state) => state.signupStep);
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const pendingRegistrationRef = useRef<PendingPushTokenRegistration | null>(null);
  const registrationChainRef = useRef(Promise.resolve());
  // 가입 미완료 시 서버 디바이스 등록 스킵
  const shouldRegisterDevice = accessToken !== null && signupStep === 'COMPLETED';

  useEffect(() => {
    if (!shouldRegisterDevice) {
      lastRegisteredTokenRef.current = null;
      pendingRegistrationRef.current = null;
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

  return null;
}
