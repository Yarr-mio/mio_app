export const NOTIFICATION_ENDPOINTS = {
  devices: '/v1/notifications/devices',
  device: (token: string) => `/v1/notifications/devices/${encodeURIComponent(token)}`,
} as const;

export const NOTIFICATION_PERMISSION = {
  androidRuntimePermissionVersion: 33,
} as const;

export const NOTIFICATION_CHANNEL = {
  id: 'default',
  name: 'MIO 알림',
} as const;

export const NOTIFICATION_MODAL = {
  title: (partnerName: string) => `${partnerName}가 먼저 안부를 물을게요`,
  description: (partnerName: string) =>
    `${partnerName}와 함께하는 체크인과 마음 기록을\n알림으로 놓치지 않게 도와드릴게요`,
  confirmLabel: '동의하기',
  cancelLabel: '나중에 할게',
} as const;

export const NOTIFICATION_SETTINGS_LABELS = {
  all: '푸시 알림 전체 동의',
  checkin: '체크인 알림',
  character: '캐릭터 메시지 알림',
  report: '리포트 알림',
} as const;

export const NotificationModalColors = {
  icon: '#7060E0',
  iconBg: '#7060E01A',
  iconBorder: '#7060E033',
} as const;
