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

export function useEnsurePushNotificationReady() {
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();

  const ensureReady = async (): Promise<boolean> => {
    const result = await ensurePushNotificationReady({ registerDeviceToken });

    if (result === 'permission_denied') {
      showPermissionDeniedAlert();
      return false;
    }

    if (result === 'token_unavailable') {
      showTokenUnavailableAlert();
      return false;
    }

    return true;
  };

  return { ensureReady };
}
