import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { handleNotificationTap } from '@/notifications/handleTap';
import '@/notifications/setupNotificationHandler';
import { useAuthStore } from '@/store/authStore';

/** foreground background killed 알림 수신 및 탭 리스너 1회 마운트 */
export function NotificationListenersBootstrap() {
  const splashDone = useAuthStore((s) => s.splashDone);
  const lastHandledResponseIdRef = useRef<string | null>(null);
  // 스플래시/인증이 끝나기 전에 도착한 콜드 스타트 탭을 잠시 보관해 둔다
  const pendingResponseRef = useRef<Notifications.NotificationResponse | null>(null);

  /** 탭 네비게이션 실제 실행 — 같은 응답을 두 번 처리하지 않는다 */
  const runNotificationTap = (response: Notifications.NotificationResponse) => {
    const responseId = response.notification.request.identifier;
    if (lastHandledResponseIdRef.current === responseId) {
      return;
    }
    lastHandledResponseIdRef.current = responseId;
    // 처리 완료 응답 초기화
    Notifications.clearLastNotificationResponse();
    void handleNotificationTap(response);
  };

  /**
   * 스플래시/인증 리다이렉트가 끝나기 전에는 탭을 큐에 담아 둔다.
   *
   * 콜드 스타트(앱 종료 상태 탭)에서 곧바로 router.push 하면, 뒤이어 실행되는
   * restoreSession 의 router.replace(홈)에 딥링크가 덮여 어떤 알림을 눌러도 홈으로 떨어진다.
   * splashDone 이 true 가 된 뒤(= 인증 리다이렉트 이후)에만 이동시켜 이를 막는다.
   */
  const processResponse = (response: Notifications.NotificationResponse) => {
    if (!useAuthStore.getState().splashDone) {
      pendingResponseRef.current = response;
      return;
    }
    // 로그인 상태에서만 보호 화면으로 이동 (로그아웃 사용자는 로그인 리다이렉트를 덮지 않는다)
    if (!useAuthStore.getState().accessToken) {
      return;
    }
    runNotificationTap(response);
  };

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      if (__DEV__) {
        console.log('[NotificationListenersBootstrap] received', {
          title: notification.request.content.title,
          data: notification.request.content.data,
        });
      }
    });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(processResponse);

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        processResponse(response);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 스플래시/인증 완료 시 대기 중이던 콜드 스타트 탭을 실행한다.
  // 이 시점은 restoreSession 의 router.replace(홈) 이후이므로 딥링크가 덮이지 않는다.
  useEffect(() => {
    if (!splashDone) {
      return;
    }
    const pending = pendingResponseRef.current;
    if (!pending) {
      return;
    }
    pendingResponseRef.current = null;
    // 로그아웃 상태면 로그인 리다이렉트를 존중하고 대기 탭을 버린다
    if (!useAuthStore.getState().accessToken) {
      return;
    }
    runNotificationTap(pending);
  }, [splashDone]);

  return null;
}
