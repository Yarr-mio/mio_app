import { Alert } from 'react-native';

import { NOTIFICATION_TOKEN_UNAVAILABLE_ALERT } from '@/constants/notifications';
import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import {
  ensurePushNotificationReady,
  type EnsurePushNotificationReadyResult,
} from '@/notifications/ensurePushNotificationReady';

function showTokenUnavailableAlert(): void {
  Alert.alert(
    NOTIFICATION_TOKEN_UNAVAILABLE_ALERT.title,
    NOTIFICATION_TOKEN_UNAVAILABLE_ALERT.message
  );
}

// 알림 ON 시 권한 요청 및 디바이스 등록
// permission_denied는 호출부에서 PATCH 차단 처리함
export function useEnsurePushNotificationReady() {
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();

  const ensureReady = async (): Promise<EnsurePushNotificationReadyResult> => {
    const result = await ensurePushNotificationReady({ registerDeviceToken });

    if (result === 'token_unavailable') {
      showTokenUnavailableAlert();
    }

    return result;
  };

  return { ensureReady };
}
