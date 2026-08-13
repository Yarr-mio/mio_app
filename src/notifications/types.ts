/** 푸시 data payload 및 알림 이력 API 트리거 코드 */
export const NOTIFICATION_TRIGGER_CODE = {
  checkinReminderMorning: 'checkin_reminder_morning',
  checkinReminderAfternoon: 'checkin_reminder_afternoon',
  checkinReminderEvening: 'checkin_reminder_evening',
  todoIncomplete: 'todo_incomplete',
  negativeEmotionStreak: 'negative_emotion_streak',
  crisisDetected: 'crisis_detected',
  reportWeekly: 'report_weekly',
} as const;

export type NotificationTriggerCode =
  (typeof NOTIFICATION_TRIGGER_CODE)[keyof typeof NOTIFICATION_TRIGGER_CODE];

export const NOTIFICATION_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  OPENED: 'OPENED',
  FAILED: 'FAILED',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

/**
 * 푸시 data 페이로드 서버 to 디바이스 전달 필드
 *
 * 알림 탭 라우팅
 * REST 이력 조회의 `trigger_code` 와 달리
 * 푸시 payload 에서 알림 종류는 `type` 키로 전달
 */
export interface PushNotificationDataPayload {
  /** 값 알림 종류 구분용 (푸시 payload 키는 `type`) */
  type?: string;
  /** 알림 탭 시 이동할 서버 경로 */
  route?: string;
  /** 체크인 슬롯 - 체크인 리마인더에만 포함 */
  slot?: string;
  /** 알림 고유 ID 서버 미전송 — forward-compatibility */
  notification_id?: string;
}
