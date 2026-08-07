import type { OnboardingCharacterId } from '@/constants/characters';
import type { ReportPeriod } from '@/constants/report';
import type { AgeRange, EmploymentStatus, Gender, SocialProvider } from '@/types/auth';
import type { EmotionType, TimeOfDay } from '@/types/checkin';
import type { SseDoneData } from '@/types/chat';
import type { NotificationType } from '@/types/notification';
import type { TodoCheckinRequest } from '@/types/todo';

/**
 * 이벤트 카탈로그 (event-logging-spec v3.5 §4)
 *
 * ⚠️ 이름과 properties는 서버 화이트리스트와 맺은 계약이다. 카탈로그 밖 키는 조용히 드롭되고,
 * 카탈로그 밖 이름은 이벤트 전체가 거부된다(기본 deny).
 * ⚠️ `any`/`Record<string, unknown>` 금지 — 이벤트별로 좁힌 interface만 쓴다.
 */

/** 앱 세션 진입점 (§8 — 클라 정의) */
export type EntryPoint = 'cold_start' | 'push_notification' | 'background_resume' | 'deep_link';

/** 리포트 열람 기간 — 앱 내부 `ReportPeriod`(week/month)와 표기가 다르다 */
export type ReportViewPeriod = 'weekly' | 'monthly';

/** 앱 내부 리포트 기간 → 로그 적재값 */
export const REPORT_PERIOD_TO_EVENT_PERIOD: Record<ReportPeriod, ReportViewPeriod> = {
  week: 'weekly',
  month: 'monthly',
};

/** properties가 없는 이벤트 */
export type EmptyEventProperties = Record<string, never>;

export interface AppSessionStartedProperties {
  entry_point: EntryPoint;
  is_first_session: boolean;
  days_since_last_session: number | null;
}

export interface AppSessionEndedProperties {
  last_screen: string | null;
  duration_ms: number;
  screen_count: number;
}

export interface ScreenViewedProperties {
  screen_name: string;
  /** 세션의 첫 화면은 null */
  referrer_screen: string | null;
}

export interface IdentifyProperties {
  previous_anonymous_id: string;
  user_id: string;
}

export interface LoginSucceededProperties {
  provider: SocialProvider;
  is_new_user: boolean;
  is_new_device: boolean;
}

export interface ConsentAgreedProperties {
  consent_version: string | null;
  marketing_agree: boolean;
  sensitive_info_agreed: boolean;
}

export interface ProfileSubmittedProperties {
  age_range: AgeRange | null;
  gender: Gender | null;
  /**
   * MVP 코호트 분할의 축. 서버 화이트리스트는 3종으로 확장됐으나(#347) **프로덕션에는
   * 아직 반영되지 않았다** — 프로덕션 화이트리스트는 여전히 2종이라
   * `student_or_unemployed`는 이 property만 드롭되고 `(미응답)`으로 흡수된다 (분석 R-3).
   *
   * 이벤트는 그래도 적재되지만 가입 API는 400으로 막히므로, 그쪽은
   * `mapSignupProfileInput`에서 해당 값을 미전송해 우회 중이다. 서버 반영 시 함께 되돌린다.
   */
  employment_status: EmploymentStatus | null;
}

export interface CharacterSelectedProperties {
  character_id: OnboardingCharacterId;
  /**
   * 개편 후 `Step4CharacterScreen`은 선택해야만 「다음」 CTA를 노출하므로 앱이 보내는 요청은
   * 전부 명시 선택이다 → `false` 고정이 사실과 일치한다 (분석 R-4).
   * 서버 자동 배정은 앱이 이 API를 호출하지 않은 경우에만 일어나고, 그때는 이 이벤트 자체가 없다.
   * BE 응답에 필드가 열리면 그 값으로 교체한다.
   */
  is_auto_assigned: boolean;
}

/** 푸시 권한 요청 경로 (§8 — 클라 정의). 퍼널 5행은 `signup_flow`만 센다 */
export type PushPermissionTrigger = 'signup_flow' | 'settings' | 're_prompt';

/**
 * ⚠️ `rePrompt`는 정의만 두고 발행하지 않는다 — 앱에 재요청 경로가 없다.
 * `settings`를 `signup_flow`와 나누지 않으면 퍼널 5행 분모가 설정 재동의로 부푼다(감사 M-1).
 */
export const PUSH_PERMISSION_TRIGGER = {
  signupFlow: 'signup_flow',
  settings: 'settings',
  rePrompt: 're_prompt',
} as const satisfies Record<string, PushPermissionTrigger>;

export interface PushPermissionPromptedProperties {
  trigger: PushPermissionTrigger;
}

export interface PushPermissionResultProperties {
  granted: boolean;
  trigger: PushPermissionTrigger;
}

export interface CheckinCompletedProperties {
  condition_score: number;
  /** 메모 원문은 절대 싣지 않는다 (§6) — 존재 여부만 */
  has_memo: boolean;
  emotion_type: EmotionType;
  time_of_day: TimeOfDay;
}

export interface ChatMessageSentProperties {
  chat_session_id: string;
  message_index: number;
  /** 본문은 절대 싣지 않는다 (§6) — 길이만 */
  char_count: number;
  /** 아래 4개는 SSE `done`을 못 받고 턴이 끝나면 전부 null (결손을 0으로 감추지 않는다) */
  ai_emotion_score: number | null;
  is_socratic: boolean | null;
  cbt_intervention_state: SseDoneData['cbt_intervention_state'] | null;
  is_crisis_flagged: boolean | null;
}

export interface SessionSummaryViewedProperties {
  chat_session_id: string;
}

export interface TodoCheckedInProperties {
  todo_id: string;
  task_status: TodoCheckinRequest['status'];
  /** 아래 4개는 현재 UI가 수집하지 않아 대부분 null/false — 억지로 채우지 않는다 */
  emotion_before: number | null;
  emotion_after: number | null;
  emotion_delta: number | null;
  /** 피드백 원문은 절대 싣지 않는다 (§6) — 존재 여부만 */
  has_feedback: boolean;
}

export interface ReportViewedProperties {
  period: ReportViewPeriod;
}

export interface NotificationOpenedProperties {
  /** 푸시 payload에 유형이 없으면 null (§5 — 결손을 감추지 않는다) */
  notification_type: NotificationType | null;
}

/** 이벤트 이름 → properties 타입 */
export interface AnalyticsEventPropertiesMap {
  app_installed: EmptyEventProperties;
  app_session_started: AppSessionStartedProperties;
  app_session_ended: AppSessionEndedProperties;
  screen_viewed: ScreenViewedProperties;
  identify: IdentifyProperties;
  login_succeeded: LoginSucceededProperties;
  consent_agreed: ConsentAgreedProperties;
  profile_submitted: ProfileSubmittedProperties;
  signup_completed: EmptyEventProperties;
  character_selected: CharacterSelectedProperties;
  onboarding_completed: EmptyEventProperties;
  push_permission_prompted: PushPermissionPromptedProperties;
  push_permission_result: PushPermissionResultProperties;
  account_withdrawn: EmptyEventProperties;
  checkin_completed: CheckinCompletedProperties;
  chat_message_sent: ChatMessageSentProperties;
  session_summary_viewed: SessionSummaryViewedProperties;
  todo_checked_in: TodoCheckedInProperties;
  report_viewed: ReportViewedProperties;
  notification_opened: NotificationOpenedProperties;
}

export type AnalyticsEventName = keyof AnalyticsEventPropertiesMap;
