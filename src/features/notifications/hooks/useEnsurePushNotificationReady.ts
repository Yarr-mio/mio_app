import { Alert, Linking } from 'react-native';

import {
  NOTIFICATION_PERMISSION_DENIED_ALERT,
  NOTIFICATION_TOKEN_UNAVAILABLE_ALERT,
} from '@/constants/notifications';
import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import { ensurePushNotificationReady } from '@/notifications/ensurePushNotificationReady';

function showPermissionDeniedAlert(): void {
  Alert.alert(
    NOTIFICATION_PERMISSION_DENIED_ALERT.title,
    NOTIFICATION_PERMISSION_DENIED_ALERT.message,
    [
      { text: NOTIFICATION_PERMISSION_DENIED_ALERT.cancelLabel, style: 'cancel' },
      {
        text: NOTIFICATION_PERMISSION_DENIED_ALERT.confirmLabel,
        onPress: () => {
          void Linking.openSettings();
        },
      },
    ]
  );
}

function showTokenUnavailableAlert(): void {
  Alert.alert(
    NOTIFICATION_TOKEN_UNAVAILABLE_ALERT.title,
    NOTIFICATION_TOKEN_UNAVAILABLE_ALERT.message
  );
}

// 알림 ON 시 권한 요청 및 디바이스 등록
// 실패 시에도 PATCH 허용
// void 반환
export function useEnsurePushNotificationReady() {
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();

  const ensureReady = async (): Promise<void> => {
    const result = await ensurePushNotificationReady({ registerDeviceToken });

    if (result === 'permission_denied') {
      showPermissionDeniedAlert();
      return;
    }

    if (result === 'token_unavailable') {
      showTokenUnavailableAlert();
    }
  };

  return { ensureReady };
}
