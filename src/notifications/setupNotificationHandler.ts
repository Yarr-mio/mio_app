import * as Notifications from 'expo-notifications';

/** foreground 수신 시 OS 배너 목록 표시 여부 App 진입 시 모듈 로드 시점에 1회 등록함 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
