import type { OnboardingCharacterId } from '@/constants/characters';
import type { EmotionType } from '@/types/checkin';
import type { DistortionType } from '@/types/report';

export type ChatMessageRole = 'user' | 'ai';
export type ChatMessageType = 'normal' | 'socratic' | 'crisis';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  type: ChatMessageType;
  content: string;
  timestamp: string;
  crisisResources?: SseCrisisResource[];
}

export interface SseSessionMetaData {
  message_id: string;
  received_at: string;
}

export interface SseDeltaData {
  chunk: string;
  msg_id: string;
}

// 지금까지 누적한 delta.chunk를 모두 버리고 safe_response로 통째로 교체해야 함 (append 금지)
export interface SseDeltaReplaceData {
  safe_response: string;
  msg_id: string;
}

export interface SseCrisisResource {
  name: string;
  number: string;
  hours: string;
}

export interface SseCrisisData {
  severity: number;
  fixed_response: string;
  // severity 1은 null (핫라인 없는 진정 유도 문구만)
  resources: { hotlines: SseCrisisResource[] } | null;
}

export interface SseDoneData {
  msg_id: string;
  // optional — 필드 자체가 생략될 수 있음(undefined). null이 아니므로 `!== null` 체크로는 못 걸러냄
  emotion_score?: number;
  is_crisis_flagged: boolean;
  // LLM 분류기(CbtMetadataClassifier) 기반 판정 — AI가 소크라테스식 질문을 던진 턴에서만 true.
  // cbt_intervention_state==='completed'와는 별개 신호(완료 턴은 보통 false) — chat-trouble-shoot/04-cbt-emotion-score-redesign.md §5 참고
  is_socratic: boolean;
  cbt_intervention_state: 'none' | 'socratic_asked' | 'followup_needed' | 'completed';
  completion_reason:
    | 'user_reframed_thought'
    | 'user_declined'
    | 'max_questions_reached'
    | 'stabilized'
    | 'not_applicable'
    | null;
  requires_emotion_score: boolean;
  // emotion-score 제출 엔드포인트(POST /v1/cbt/reconstructions/{id}/emotion-score)의 path variable
  emotion_score_target_id: string | null;
  emotion_score_phase: 'after' | null;
  finished_reason: 'stop' | 'crisis_flow' | 'security_refusal' | 'replaced_by_guard' | 'error';
}

export type SummaryStatus = 'pending' | 'done' | 'viewed' | 'failed';

// 서버는 재진입 응답에도 initial_message를 싣지만 FE는 읽지 않는다 —
// 이력 조회(GET /v1/sessions/{id}/messages)가 오프닝을 목록 첫 항목으로 포함하기 때문
export interface ActiveSessionResponse {
  // 활성 세션이 없으면 앞 6개는 명시적 null, last_summary_status/last_ended_session_id만 값이 들어옴
  session_id: string | null;
  character_id: OnboardingCharacterId | null;
  status: 'active' | null;
  started_at: string | null;
  last_message_at: string | null;
  message_count: number | null;
  last_summary_status: SummaryStatus | null;
  last_ended_session_id: string | null;
}

// POST /v1/sessions의 선제 인사(session opening) — 서버가 LLM 없이 고른 검수 문구.
// 문구는 서버 소유다. 클라이언트에 인사말을 하드코딩하지 않는다 (명세 v1.4.0 · #428)
export interface SessionInitialMessage {
  message_id: string;
  role: 'assistant';
  kind: 'session_opening';
  content: string;
  created_at: string;
}

export interface StartSessionResponse {
  session_id: string;
  character_id: OnboardingCharacterId;
  status: 'active';
  started_at: string;
  // BE #428 배포 전에는 필드 자체가 없다(undefined) — `!== null` 체크로는 못 거른다.
  // 배포 후 신규 세션에는 항상 존재한다
  initial_message?: SessionInitialMessage | null;
}

// 서버 이력 DTO — 앱 도메인 타입 ChatMessage와 별개다 (role 값이 다르고 type/crisisResources가 없다)
export interface SessionHistoryMessage {
  message_id: string;
  role: 'user' | 'assistant';
  kind: 'conversation' | 'session_opening';
  content: string;
  created_at: string;
}

export interface SessionMessagesResponse {
  session_id: string;
  messages: SessionHistoryMessage[];
  // opaque 문자열 — 파싱하거나 만들어 쓰지 않는다. 서버가 준 값을 그대로 되돌려준다
  next_cursor: string | null;
  has_next: boolean;
}

export interface EndSessionResponse {
  session_id: string;
  status: 'ended';
  ended_at: string;
  message_count: number;
  duration_seconds: number;
  summary_status: SummaryStatus;
}

// GET /v1/todos의 TodoResponse와 다른 축약형 — status/created_at/character_comment 없음 (읽기 전용 표시만 가능)
export interface SessionTodoItem {
  todo_id: string;
  action_text: string;
  // 카테고리(심리_안정/인지_재구성/행동_활성화) 포맷 미확정 — 렌더링 시 formatTodoCategoryLabel로 `_`만 공백 치환
  category: string;
  difficulty: number;
  estimated_minutes: number;
}

export interface SessionKeyThought {
  content: string;
  distortion_type: DistortionType | null;
}

export interface SessionSummaryResponse {
  session_id: string;
  summary_status: SummaryStatus;
  ended_at: string;
  duration_seconds: number;
  message_count: number;
  summary: string | null;
  avg_emotion_score: number | null;
  // 인지왜곡 유형 — 실측 결과 문자열 배열로 옴(감지된 게 없으면 [])
  bias_types_detected: DistortionType[] | null;
  cbt_intervened: boolean | null;
  // pending이거나 ExtractorLLM이 유효한 코드를 못 뽑은 경우 null (둘 다 정상)
  dominant_emotion: EmotionType | null;
  // pending에도 항상 [] — null은 절대 안 옴
  todos: SessionTodoItem[];
  key_thoughts: SessionKeyThought[] | null;
  socratic_count: number | null;
}

export interface CbtEmotionScoreResponse {
  reconstruction_id: string;
  emotion_score_after: number;
  updated_at: string;
}
