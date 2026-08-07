import { useRegisterNotificationDevice } from '@/features/notifications/hooks/useNotificationDevice';
import {
  ensurePushNotificationReady,
  type EnsurePushNotificationReadyResult,
} from '@/notifications/ensurePushNotificationReady';

// 알림 ON 시 권한 요청 및 디바이스 등록
// permission_denied와 token_unavailable UI는 호출부에서 처리함
export function useEnsurePushNotificationReady() {
  const { mutateAsync: registerDeviceToken } = useRegisterNotificationDevice();

  const ensureReady = async (): Promise<EnsurePushNotificationReadyResult> => {
    return ensurePushNotificationReady({ registerDeviceToken });
  };

  return { ensureReady };
}
