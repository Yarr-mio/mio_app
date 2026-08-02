import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNotificationSettings } from '@/api/endpoints/notification';
import { queryKeys } from '@/api/queryKeys';
import { NOTIFICATION_SETTINGS_ALL_ENABLED } from '@/constants/notifications';
import type { NotificationSettings } from '@/types/user';

// 온보딩 알림 동의 시 설정 전체 활성화
export function useOnboardingNotificationAgree() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, Error, void>({
    mutationFn: () => updateNotificationSettings(NOTIFICATION_SETTINGS_ALL_ENABLED),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.my.notificationSettings(), data);
    },
    onError: (error) => {
      console.warn('[useOnboardingNotificationAgree]', error);
    },
  });
}
