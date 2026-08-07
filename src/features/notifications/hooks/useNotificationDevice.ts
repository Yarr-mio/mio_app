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

// 400(VALIDATION_ERROR), 401(AUTH_TOKEN_EXPIRED) 등 요청을 다시 보내도 같은 결과가 나오는 에러는 재시도하지 않는다.
// 네트워크 단절/5xx 등 일시적 실패만 재시도 대상으로 본다.
function isRetryableRegistrationError(error: unknown): boolean {
  const status = readApiHttpStatus(error);
  if (status === null) {
    // 네트워크 자체가 끊긴 경우(HTTP 상태 없음)는 재시도 대상
    return true;
  }
  return status >= 500;
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
    // 일시적 오류(네트워크 끊김, 5xx)만 최대 2회 재시도. 400/401 등은 즉시 실패 처리.
    retry: (failureCount, error) => failureCount < 2 && isRetryableRegistrationError(error),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
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
