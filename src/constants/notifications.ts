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

export const NOTIFICATION_SETTINGS_ALL_DISABLED = {
  checkin_enabled: false,
  character_enabled: false,
  report_enabled: false,
} as const;

export const NOTIFICATION_SETTINGS_ALL_ENABLED = {
  checkin_enabled: true,
  character_enabled: true,
  report_enabled: true,
} as const;

export const NOTIFICATION_SETTINGS_LABELS = {
  all: '푸시 알림 전체 동의',
  checkin: '체크인 알림',
  character: '캐릭터 메시지 알림',
  report: '리포트 알림',
} as const;

export const CHECKIN_TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const;

export const CHECKIN_REMINDER_LABELS = {
  morning: '아침 리마인드',
  afternoon: '점심 리마인드',
  evening: '저녁 리마인드',
} as const;

export const TimePickerLabels = {
  confirm: '확인',
  cancel: '취소',
} as const;

export const NOTIFICATION_PERMISSION_DENIED_ALERT = {
  title: '앱을 열면 알림을 확인할 수 있어요',
  message:
    '기기 알림 권한이 꺼져 있어 잠금 화면이나 알림창으로는 받지 못해요. 앱을 열었을 때 알림을 확인할 수 있어요. 기기 알림도 받으려면 설정에서 알림을 허용해 주세요.',
  confirmLabel: '설정으로 이동',
  cancelLabel: '닫기',
} as const;

export const NOTIFICATION_TOKEN_UNAVAILABLE_ALERT = {
  title: '앱을 열면 알림을 확인할 수 있어요',
  message:
    '기기 알림을 바로 준비하지 못했어요. 지금은 앱을 열었을 때 알림을 확인할 수 있어요. 잠시 후 다시 시도해 주세요.',
} as const;

export const NotificationModalColors = {
  icon: '#7060E0',
  iconBg: '#7060E01A',
  iconBorder: '#7060E033',
} as const;
