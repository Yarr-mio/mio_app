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
   * 스플래시/인증 리다이렉트가 끝나기 전에는 탭을 큐에 담아둠
   */
  const processResponse = (response: Notifications.NotificationResponse) => {
    if (!useAuthStore.getState().splashDone) {
      pendingResponseRef.current = response;
      return;
    }
    // 로그인 상태에서만 보호 화면으로 이동
    if (!useAuthStore.getState().accessToken) {
      // 폐기한 응답이 다음 콜드 스타트에서 다시 조회되지 않도록 플랫폼 캐시도 비운다
      Notifications.clearLastNotificationResponse();
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

  // 스플래시/인증 완료 시 대기 중이던 콜드 스타트 탭을 실행
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
      // 버린 탭이 다음 콜드 스타트에서 다시 조회되지 않도록 플랫폼 캐시도 비운다
      Notifications.clearLastNotificationResponse();
      return;
    }
    runNotificationTap(pending);
  }, [splashDone]);

  return null;
}
