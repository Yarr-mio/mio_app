import {
  getNativeDevicePushTokenAsync,
  getNotificationPermissionGrantedAsync,
  getRememberedPushToken,
  requestNotificationPermissionAsync,
} from '@/notifications/fcm';

export type EnsurePushNotificationReadyResult = 'ready' | 'permission_denied' | 'token_unavailable';

interface EnsurePushNotificationReadyParams {
  registerDeviceToken: (pushToken: string) => Promise<unknown>;
}

/**
 * 설정 화면 등에서 알림을 켤 때 OS 권한, FCM 토큰, 서버 디바이스 등록 보장
 * - 이미 권한이 있으면 시스템 권한 얼럿을 다시 띄우지 않음
 * - 이미 같은 토큰이 등록되어 있으면 서버 등록 API를 다시 호출하지 않음
 */
export async function ensurePushNotificationReady({
  registerDeviceToken,
}: EnsurePushNotificationReadyParams): Promise<EnsurePushNotificationReadyResult> {
  const alreadyGranted = await getNotificationPermissionGrantedAsync();
  const granted = alreadyGranted ? true : await requestNotificationPermissionAsync();

  if (!granted) {
    return 'permission_denied';
  }

  let token: string | null;
  try {
    token = await getNativeDevicePushTokenAsync();
  } catch (error) {
    console.warn('[ensurePushNotificationReady] failed to get push token', error);
    return 'token_unavailable';
  }

  if (!token) {
    return 'token_unavailable';
  }

  const rememberedToken = await getRememberedPushToken();
  if (rememberedToken === token) {
    return 'ready';
  }

  try {
    await registerDeviceToken(token);
  } catch (error) {
    console.warn('[ensurePushNotificationReady] failed to register device', error);
    return 'token_unavailable';
  }

  return 'ready';
}
