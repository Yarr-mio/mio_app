import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { handleNotificationTap } from '@/notifications/handleTap';
import '@/notifications/setupNotificationHandler';

/** foreground background killed 알림 수신 및 탭 리스너 App 루트에서 1회 마운트함 */
export function NotificationListenersBootstrap() {
  const lastHandledResponseIdRef = useRef<string | null>(null);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (__DEV__) {
        console.log('[NotificationListenersBootstrap] received', {
          title: notification.request.content.title,
          data: notification.request.content.data,
        });
      }
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const responseId = response.notification.request.identifier;
        if (lastHandledResponseIdRef.current === responseId) {
          return;
        }
        lastHandledResponseIdRef.current = responseId;
        void handleNotificationTap(response);
      }
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) {
        return;
      }

      const responseId = response.notification.request.identifier;
      if (lastHandledResponseIdRef.current === responseId) {
        return;
      }
      lastHandledResponseIdRef.current = responseId;
      void handleNotificationTap(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return null;
}
