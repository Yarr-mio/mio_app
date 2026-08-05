import {
  getNativeDevicePushTokenAsync,
  getNotificationPermissionGrantedAsync,
  requestNotificationPermissionAsync,
} from '@/notifications/fcm';

export type EnsurePushNotificationReadyResult = 'ready' | 'permission_denied' | 'token_unavailable';

interface EnsurePushNotificationReadyParams {
  registerDeviceToken: (pushToken: string) => Promise<unknown>;
}

// 알림 ON 시 권한 확인 후 토큰 획득 및 디바이스 등록
// 동일 토큰이어도 서버 UPSERT용 등록 API 호출함
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

  try {
    await registerDeviceToken(token);
  } catch (error) {
    console.warn('[ensurePushNotificationReady] failed to register device', error);
    return 'token_unavailable';
  }

  return 'ready';
}
