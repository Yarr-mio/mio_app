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

/** 푸시 data 페이로드 서버 to 디바이스 전달 필드 */
export interface PushNotificationDataPayload {
  notification_id?: string;
  trigger_code?: string;
}
