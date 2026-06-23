# Mio Server REST API 명세

> 컨트롤러(`*Controller.java`)와 DTO(`dto/*.java`) 전체를 기준으로 정리한 문서입니다.
> 코드가 변경되면 이 문서도 함께 갱신해야 합니다 (자동 동기화 아님).

## 목차

1. [공통 규칙](#공통-규칙)
2. [Auth](#1-auth-authcontroller-devauthcontroller)
3. [Character](#2-character-charactercontroller)
4. [Checkin](#3-checkin-checkincontroller--v1checkins)
5. [Daily Test](#4-daily-test-dailytestcontroller--v1daily-test)
6. [My Page](#5-my-page-userprofilecontroller--v1usersme)
7. [Notification](#6-notification-4개-컨트롤러)
8. [Onboarding](#7-onboarding-onboardingcontroller--v1onboarding)
9. [Report](#8-report-reportcontroller--v1reports)
10. [Session / 채팅](#9-session--채팅-sessioncontroller--v1sessions) (메시지 전송 SSE 상세는 [SSE_SPEC.md](./SSE_SPEC.md) 참고)
11. [Todo](#10-todo-todocontroller--v1todos)
12. [주요 에러 코드](#주요-에러-코드-선택-발췌)

---

## 공통 규칙

**Base path**: `/v1`

**인증**: `Authorization: Bearer <JWT>` 헤더 필요. 토큰 없으면 `401 UNAUTHORIZED`.
화이트리스트(인증 불필요, `JwtAuthenticationFilter`):

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/dev/token`
- `GET /actuator/health`

**성공 응답 래퍼** — 모든 정상 응답은 이 구조로 감싸짐 (`com.mio.common.response.ApiResponse`):

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T; // null이면 키 자체가 생략됨 (@JsonInclude NON_NULL)
  error?: object;
  meta?: {
    trace_id?: string;
    next_cursor?: string; // 페이지네이션 응답에만 존재
    has_more?: boolean;
  };
}
```

**에러 응답** — `ApiResponse`로 감싸지지 _않고_ 별도 포맷, HTTP status는 에러코드별로 다름 (`com.mio.common.error.ErrorResponse` / `GlobalExceptionHandler`):

```ts
interface ErrorResponse {
  error: { code: string; message: string; trace_id: string | null };
}
```

**필드 네이밍 주의**: 전역 Jackson SNAKE_CASE 전략이 제거되어, `@JsonProperty`가 명시된 필드만 `snake_case`로 나가고, 어노테이션 없는 필드는 Java 필드명 그대로(camelCase 포함) 직렬화됩니다. 아래는 실제 JSON 키 기준으로 표기했고, camelCase로 나가는 예외 케이스는 주석으로 표시했습니다.

**공유 enum 값**

```ts
type SignupStep =
  | 'SOCIAL_AUTHENTICATED'
  | 'CONSENT_AGREED'
  | 'PROFILE_COMPLETED'
  | 'ONBOARDING_COMPLETED'
  | 'COMPLETED';
type SessionStatus = 'active' | 'ended';
type SummaryStatus = 'pending' | 'done' | 'viewed' | 'failed';
type TaskStatus = 'suggested' | 'completed' | 'skipped' | 'expired';
```

---

## 1. Auth (`AuthController`, `DevAuthController`)

| Method | Path                                | 인증                                                                                    |
| ------ | ----------------------------------- | --------------------------------------------------------------------------------------- |
| POST   | `/v1/auth/login`                    | 불필요                                                                                  |
| GET    | `/v1/auth/signup/status`            | 필요                                                                                    |
| POST   | `/v1/auth/signup/consent`           | 필요                                                                                    |
| POST   | `/v1/auth/signup/profile`           | 필요                                                                                    |
| POST   | `/v1/auth/signup/complete`          | 필요                                                                                    |
| GET    | `/v1/auth/nickname/duplicate-check` | 필요                                                                                    |
| POST   | `/v1/auth/refresh`                  | 불필요                                                                                  |
| POST   | `/v1/auth/logout`                   | 필요                                                                                    |
| DELETE | `/v1/auth/withdraw`                 | 필요                                                                                    |
| POST   | `/v1/auth/dev/token`                | 불필요 (⚠️ `local` 프로필 + `auth.dev-token-enabled=true`일 때만 존재. 프로덕션엔 없음) |

```ts
// POST /v1/auth/login
interface LoginRequest {
  provider: string; // 필수
  idToken?: string; // camelCase 키! (snake_case 아님)
  accessToken?: string; // camelCase 키!
  deviceId: string; // camelCase 키! 필수
}
interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user: boolean;
  is_new_device: boolean;
  signup_step: SignupStep;
  onboarding_step: number;
  user?: {
    id: string;
    nickname: string;
    preferred_character_id?: string;
    is_minor: boolean;
    is_premium: boolean;
    status: string;
  };
}

// GET /v1/auth/signup/status
interface SignupStatusResponse {
  signup_step: SignupStep;
  onboarding_step: number;
}

// POST /v1/auth/signup/consent
interface ConsentRequest {
  consents: { type: string; agreed: boolean; version: string }[];
} // 1개 이상
interface ConsentResponse {
  signup_step: SignupStep;
}

// POST /v1/auth/signup/profile
interface SignupCompleteRequest {
  nickname: string; // 2~13자 필수
  ageRange?: string; // camelCase 키! (snake_case 아님)
  gender?: string;
}
interface SignupCompleteResponse {
  signup_step: SignupStep;
  onboarding_step: number;
  nickname: string;
}

// POST /v1/auth/signup/complete (body 없음)
interface SignupFinalizeResponse {
  signup_step: SignupStep;
  status: string;
}

// GET /v1/auth/nickname/duplicate-check?nickname=xxx (query 필수)
// response data: { duplicate: boolean }

// POST /v1/auth/refresh
interface TokenRefreshRequest {
  refresh_token: string;
}
interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
} // 항상 900

// POST /v1/auth/logout
interface LogoutRequest {
  device_id: string;
}
// response data: { success: boolean }

// DELETE /v1/auth/withdraw (body 없음)
interface WithdrawResponse {
  success: boolean;
  withdrawn_at: string;
  hard_delete_scheduled_at: string;
} // +30일

// POST /v1/auth/dev/token (로컬 전용)
interface DevTokenRequest {
  user_id: string;
} // UUID
interface DevTokenResponse {
  access_token: string;
  expires_in: number;
}
```

---

## 2. Character (`CharacterController`)

| Method | Path                 | 인증 |
| ------ | -------------------- | ---- |
| GET    | `/v1/characters`     | 필요 |
| POST   | `/v1/user/character` | 필요 |
| GET    | `/v1/user/character` | 필요 |

```ts
interface CharacterListResponse {
  current_character_id: string;
  characters: {
    character_id: string;
    name: string;
    animal: string;
    description: string;
    tags: string[];
    is_current: boolean;
  }[];
}

interface CharacterChangeRequest {
  character_id: string;
} // 필수
interface CharacterChangeResponse {
  character_id: string;
  name: string;
  changed: boolean;
  greeting_message: string;
}

interface UserCharacterResponse {
  character_id: string;
  name: string;
  animal: string;
}
```

---

## 3. Checkin (`CheckinController`) — `/v1/checkins`

| Method | Path                       | 인증 | 비고                               |
| ------ | -------------------------- | ---- | ---------------------------------- |
| POST   | `/v1/checkins`             | 필요 | `201`, `Idempotency-Key` 헤더 옵션 |
| PUT    | `/v1/checkins/{checkinId}` | 필요 |                                    |
| GET    | `/v1/checkins/today`       | 필요 |                                    |
| GET    | `/v1/checkins?cursor=`     | 필요 | data가 배열 자체                   |

```ts
interface CheckinRequest {
  time_of_day: string; // 필수
  emotion_type: string; // 필수
  condition_score: number; // 1~5 필수
  memo?: string; // max 200자
}
interface CheckinCreateResponse {
  checkin_id: string;
  time_of_day: string;
  emotion_type: string;
  condition_score: number;
  memo?: string;
  ai_response?: string;
  created_at: string;
}

interface CheckinUpdateRequest {
  emotion_type?: string;
  condition_score?: number /*1~5*/;
  memo?: string /*max200*/;
}
interface CheckinUpdateResponse {
  checkin_id: string;
  time_of_day: string;
  emotion_type: string;
  condition_score: number;
  memo?: string;
  ai_response?: string;
  updated_at: string;
}

interface CheckinResponse {
  checkin_id: string;
  time_of_day: string;
  emotion_type: string;
  condition_score: number;
  memo?: string;
  ai_response?: string;
  created_at: string;
  updated_at: string;
}

interface CheckinTodayResponse {
  date: string;
  checkins: CheckinResponse[];
  completed_slots: string[];
  available_slots: string[];
}

// GET /v1/checkins?cursor=  ->  data: CheckinResponse[]
```

---

## 4. Daily Test (`DailyTestController`) — `/v1/daily-test`

| Method | Path                             | 인증         |
| ------ | -------------------------------- | ------------ |
| GET    | `/v1/daily-test/today`           | 필요         |
| POST   | `/v1/daily-test/{testId}/answer` | 필요 (`201`) |

```ts
// 완료 전/후 두 상태가 한 타입에 섞여있음 (completed_today로 분기)
interface DailyTestTodayResponse {
  completed_today: boolean;
  test_id?: string;
  title?: string;
  estimated_minutes?: number;
  questions?: {
    question_id: string;
    order: number;
    text: string;
    options: { option_id: string; text: string }[];
  }[];
  result?: { summary: string; tags: string[] }; // completed_today=true일 때만
}

interface AnswerSubmitRequest {
  answers: Record<string, string>;
} // questionId -> optionId, 1개 이상

interface DailyTestResultResponse {
  result: { summary: string; description: string; tags: string[]; character_comment: string };
  completed_at: string;
}
```

---

## 5. My Page (`UserProfileController`) — `/v1/users/me`

| Method | Path           | 인증 |
| ------ | -------------- | ---- |
| GET    | `/v1/users/me` | 필요 |
| PATCH  | `/v1/users/me` | 필요 |

```ts
interface UserProfileResponse {
  user_id: string;
  nickname: string;
  age_range?: string;
  preferred_character?: { character_id: string; name: string; animal: string; description: string };
  stats: { total_checkins: number; consecutive_days: number; todo_completed: number };
  monthly_emotion_distribution: { emotion_type: string; label: string; percentage: number }[];
  signup_step: string;
}

// 부분 수정용 — 필드를 "보내지 않음"과 "null로 보냄"을 구분해서 처리함(ageRangePresent 플래그)
interface UserProfileUpdateRequest {
  nickname?: string;
  age_range?: string | null;
}
interface UserProfileUpdateResponse {
  user_id: string;
  nickname: string;
  age_range?: string;
  updated_at: string;
}
```

---

## 6. Notification (4개 컨트롤러)

### 6-1. `DeviceTokenController` — `/v1/notifications/devices`

| Method | Path                                | 인증 |
| ------ | ----------------------------------- | ---- |
| POST   | `/v1/notifications/devices`         | 필요 |
| DELETE | `/v1/notifications/devices/{token}` | 필요 |

```ts
interface DeviceTokenRegisterRequest {
  device_id: string;
  push_token: string;
  platform: 'ios' | 'android';
  app_version: string;
} // 전부 필수
interface DeviceTokenResponse {
  success: boolean;
  device_id: string;
  platform: string;
}
// DELETE 응답 data: { success: boolean }
```

### 6-2. `NotificationController` — `/v1/notifications`

| Method | Path                                      | 인증 |
| ------ | ----------------------------------------- | ---- |
| GET    | `/v1/notifications?cursor=&limit=`        | 필요 |
| PATCH  | `/v1/notifications/{notificationId}/read` | 필요 |

```ts
// 주의: 페이지네이션 정보가 data 안이 아니라 ApiResponse.meta에 들어감
// data: NotificationHistoryItemResponse[], meta: { next_cursor, has_more }
interface NotificationHistoryItemResponse {
  notification_id: string;
  trigger_code: string;
  title: string;
  body: string;
  notification_status: string;
  sent_at: string;
  responded_at?: string;
}

interface NotificationReadResponse {
  notification_id: string;
  notification_status: string;
  responded_at: string;
}
```

### 6-3. `NotificationSettingController` — `/v1/notifications/settings`

| Method | Path                         | 인증 |
| ------ | ---------------------------- | ---- |
| GET    | `/v1/notifications/settings` | 필요 |
| PATCH  | `/v1/notifications/settings` | 필요 |

```ts
interface NotificationSettingResponse {
  checkin_enabled: boolean;
  checkin_time: { morning: string; afternoon: string; evening: string }; // "HH:mm"
  character_enabled: boolean;
  report_enabled: boolean;
}
interface NotificationSettingUpdateRequest {
  checkin_enabled?: boolean;
  checkin_time?: { morning?: string; afternoon?: string; evening?: string }; // 각각 "HH:mm" 정규식 검증
  character_enabled?: boolean;
  report_enabled?: boolean;
}
```

### 6-4. `NotificationTestController` — `/v1/notifications/test`

⚠️ `notification.test-endpoint-enabled=true`일 때만 빈이 등록됨 (보통 비활성).

```ts
interface NotificationTestRequest {
  title: string;
  body: string;
}
// response data 없음 (success만)
```

---

## 7. Onboarding (`OnboardingController`) — `/v1/onboarding`

| Method | Path                       | 인증 |
| ------ | -------------------------- | ---- |
| POST   | `/v1/onboarding/step/1`    | 필요 |
| POST   | `/v1/onboarding/step/2`    | 필요 |
| POST   | `/v1/onboarding/step/3`    | 필요 |
| POST   | `/v1/onboarding/character` | 필요 |
| GET    | `/v1/onboarding/status`    | 필요 |

```ts
interface QuestionResponse {
  question_id: string;
  answer: string;
}

interface OnboardingStep1Request {
  emotion_state: string;
  responses?: QuestionResponse[];
} // emotion_state 필수
interface OnboardingStep2Request {
  concern_types: string[];
  responses?: QuestionResponse[];
} // concern_types 1개 이상 필수
interface OnboardingStep3Request {
  preferred_style: string;
  responses?: QuestionResponse[];
} // preferred_style 필수
interface OnboardingStepResponse {
  onboarding_step: number;
} // step1, step2 공통 응답

interface CharacterRecommendationDto {
  character_id: string;
  name: string;
  match_score: number;
  reason: string;
}
interface OnboardingStep3Response {
  onboarding_step: number;
  character_recommendations: CharacterRecommendationDto[];
}

interface CharacterSelectRequest {
  character_id?: string;
}
interface CharacterSelectResponse {
  preferred_character_id: string;
  signup_step: SignupStep;
}

interface OnboardingStatusResponse {
  onboarding_step: number;
  signup_step: SignupStep;
  character_recommendations: CharacterRecommendationDto[];
}
```

---

## 8. Report (`ReportController`) — `/v1/reports`

| Method | Path                                         | 인증 |
| ------ | -------------------------------------------- | ---- |
| GET    | `/v1/reports/weekly?week_start=YYYY-MM-DD`   | 필요 |
| GET    | `/v1/reports/monthly?month_start=YYYY-MM-DD` | 필요 |
| GET    | `/v1/reports/emotion-trend?period=&days=`    | 필요 |

```ts
// Weekly/Monthly 둘 다 동일 구조 (필드명만 week_*/month_* 차이)
// status === "INSUFFICIENT_DATA"이면 narrative 이하 필드들이 전부 생략됨(NON_NULL)
interface WeeklyReportResponse {
  report_id?: string;
  week_start: string;
  week_end: string;
  status: string;
  is_partial?: boolean;
  checkin_count?: number;
  required_count?: number;
  avg_emotion_score?: number;
  distortion_top3?: { type: string; label: string; count: number }[];
  narrative?: string;
  coaching_direction?: string;
  todo_summary?: {
    total: number;
    completed: number;
    skipped: number;
    expired: number;
    completion_rate: number;
    category_distribution: Record<string, number>;
  };
  session_summary?: { total: number; total_minutes: number };
  generated_at?: string;
  message?: string; // 데이터 부족 안내 메시지
}
interface MonthlyReportResponse extends Omit<WeeklyReportResponse, 'week_start' | 'week_end'> {
  month_start: string;
  month_end: string;
}

interface EmotionTrendResponse {
  period_start: string;
  period_end: string;
  points: { date: string; avg_condition_score: number | null; checkin_count: number }[];
}
```

---

## 9. Session / 채팅 (`SessionController`) — `/v1/sessions`

| Method | Path                                | 인증 | 비고                                                           |
| ------ | ----------------------------------- | ---- | -------------------------------------------------------------- |
| GET    | `/v1/sessions/active`               | 필요 |                                                                |
| POST   | `/v1/sessions`                      | 필요 | `201`                                                          |
| POST   | `/v1/sessions/{sessionId}/messages` | 필요 | **SSE** (REST 아님) — 상세는 [SSE_SPEC.md](./SSE_SPEC.md) 참고 |
| POST   | `/v1/sessions/{sessionId}/end`      | 필요 |                                                                |
| GET    | `/v1/sessions/{sessionId}/summary`  | 필요 | `summary_status==="pending"`이면 `202`, 아니면 `200`           |

```ts
interface ActiveSessionResponse {
  // 활성 세션 없으면 아래 6개는 명시적 null, 마지막 2개만 값이 들어옴
  session_id: string | null;
  character_id: string | null;
  status: SessionStatus | null;
  started_at: string | null;
  last_message_at: string | null;
  message_count: number | null;
  last_summary_status: SummaryStatus | null;
  last_ended_session_id: string | null;
}

interface CreateSessionRequest {
  character_id?: string;
} // max 50자
interface SessionResponse {
  session_id: string;
  character_id: string;
  status: SessionStatus;
  started_at: string;
}

interface EndSessionResponse {
  session_id: string;
  status: SessionStatus;
  ended_at: string;
  message_count: number;
  duration_seconds: number;
  summary_status: SummaryStatus;
}

interface SessionSummaryResponse {
  session_id: string;
  summary_status: SummaryStatus;
  ended_at: string;
  duration_seconds: number;
  message_count: number;
  summary: string | null;
  avg_emotion_score: number | null;
  bias_types_detected: string | null;
  cbt_intervened: boolean | null;
}
```

> `POST /v1/sessions/{sessionId}/messages`의 요청 바디(`SendMessageRequest`), SSE 이벤트 종류, 시나리오별 시퀀스, gotcha 등 전체 내용은 **[SSE_SPEC.md](./SSE_SPEC.md)**에 별도로 정리했습니다.

---

## 10. Todo (`TodoController`) — `/v1/todos`

| Method | Path                                | 인증 | 비고  |
| ------ | ----------------------------------- | ---- | ----- |
| POST   | `/v1/todos/generate`                | 필요 | `201` |
| GET    | `/v1/todos?date=YYYY-MM-DD&status=` | 필요 |       |
| POST   | `/v1/todos/{todoId}/checkin`        | 필요 |       |

```ts
interface TodoGenerateRequest {
  source: 'checkin' | 'chat';
  source_id?: string;
} // source 필수

interface TodoResponse {
  todo_id: string;
  action_text: string;
  category: string;
  difficulty: number;
  estimated_minutes: number;
  status: TaskStatus;
  created_at: string;
  character_comment: string;
}
interface TodoListResponse {
  todos: TodoResponse[];
}

interface TodoCheckinRequest {
  status: 'completed' | 'skipped';
  before_emotion?: number;
  after_emotion?: number;
  feedback?: string;
} // status 필수
interface TodoCheckinResponse {
  status: string;
  before_emotion?: number;
  after_emotion?: number;
  character_reaction: string;
}
```

---

## 주요 에러 코드 (선택 발췌)

| code                                                                               | http status | 의미                         |
| ---------------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `VALIDATION_ERROR`                                                                 | 400         | 입력값 검증 실패             |
| `UNAUTHORIZED` / `AUTH_TOKEN_INVALID` / `AUTH_TOKEN_EXPIRED`                       | 401         | 인증 실패                    |
| `FORBIDDEN` / `ONBOARDING_REQUIRED`                                                | 403         | 권한 없음 / 온보딩 미완료    |
| `USER_NOT_FOUND` / `SESSION_NOT_FOUND` / `CHECKIN_NOT_FOUND` / `TODO_NOT_FOUND` 등 | 404         | 리소스 없음                  |
| `ALREADY_CHECKED_IN` / `SESSION_ALREADY_ACTIVE` / `TODO_ALREADY_COMPLETED`         | 409         | 중복/충돌                    |
| `LOCKED_BY_SAFETY`                                                                 | 423         | 안전정책 차단 (위기 감지 등) |
| `BUSINESS_RULE_VIOLATION` (당일 체크인 수정 등)                                    | 422         | 비즈니스 규칙 위반           |
| `RATE_LIMITED`                                                                     | 429         | 요청 한도 초과               |
| `INTERNAL_ERROR`                                                                   | 500         | 서버 오류                    |

전체 코드는 [`src/main/java/com/mio/common/error/ErrorCode.java`](../src/main/java/com/mio/common/error/ErrorCode.java)에 있습니다.
