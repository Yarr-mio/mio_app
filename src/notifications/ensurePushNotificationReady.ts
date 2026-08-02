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

// 알림 ON 시 권한 확인
// 미허용 시 요청
// 토큰 획득 및 디바이스 등록
// 기존 허용 시 재요청 생략
// 동일 토큰 재등록 생략
// 실패 시 결과만 반환
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
