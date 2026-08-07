import type { NotificationType } from '@/types/notification';

export const NOTIFICATION_ENDPOINTS = {
  devices: '/v1/notifications/devices',
  device: (token: string) => `/v1/notifications/devices/${encodeURIComponent(token)}`,
  list: '/v1/notifications',
  read: (notificationId: string) => `/v1/notifications/${encodeURIComponent(notificationId)}/read`,
  settings: '/v1/notifications/settings',
} as const;

/** 푸시 payload에서 알림 유형을 읽을 때 우선순위대로 확인하는 키 (발송 측 필드명 미확정) */
export const NOTIFICATION_TYPE_PAYLOAD_KEYS = [
  'notification_type',
  'trigger_code',
  'type',
] as const;

/** 알림 유형 허용값 — payload 값이 이 목록 밖이면 유형 미상(null)으로 적재한다 */
export const NOTIFICATION_TYPES = [
  'checkin_reminder_morning',
  'checkin_reminder_afternoon',
  'checkin_reminder_evening',
  'todo_incomplete',
  'negative_emotion_streak',
  'report_weekly',
  'crisis_detected',
] as const satisfies readonly NotificationType[];

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

export const NOTIFICATION_PERMISSION_DENIED_MODAL = {
  title: '알림 권한이 꺼져 있어요',
  description: '기기 알림 권한이 꺼져 있어 알림을 받을 수 없어요.\n설정에서 알림을 허용해 주세요.',
  confirmLabel: '설정으로 이동',
  cancelLabel: '닫기',
} as const;

// 마지막 확인한 OS 알림 권한 상태 영속 키 비밀값 아님
export const LAST_OS_NOTIFICATION_PERMISSION_STORAGE_KEY =
  'notification.last_os_permission_granted' as const;

export const OS_PERMISSION_GRANTED_STORAGE_VALUE = {
  granted: '1',
  denied: '0',
} as const;

export const NOTIFICATION_TOKEN_UNAVAILABLE_ALERT = {
  title: '앱을 열면 알림을 확인할 수 있어요',
  message:
    '기기 알림을 바로 준비하지 못했어요. 지금은 앱을 열었을 때 알림을 확인할 수 있어요. 잠시 후 다시 시도해 주세요.',
} as const;

export const NOTIFICATION_TOKEN_UNAVAILABLE_MODAL = {
  title: '알림을 바로 준비하지 못했어요',
  description: '기기 알림을 준비하는 중 문제가 생겼어요.\n잠시 후 다시 시도해 주세요.',
  confirmLabel: '확인',
} as const;

export const NotificationModalColors = {
  icon: '#7060E0',
  iconBg: '#7060E01A',
  iconBorder: '#7060E033',
} as const;
