import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateNotificationSettings } from '@/api/endpoints/notification';
import { queryKeys } from '@/api/queryKeys';
import { NOTIFICATION_SETTINGS_ALL_DISABLED } from '@/constants/notifications';
import type { NotificationSettings } from '@/types/user';

export function useOnboardingNotificationLater() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, Error, void>({
    mutationFn: () => updateNotificationSettings(NOTIFICATION_SETTINGS_ALL_DISABLED),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.my.notificationSettings(), data);
    },
    onError: (error) => {
      console.warn('[useOnboardingNotificationLater]', error);
    },
  });
}
