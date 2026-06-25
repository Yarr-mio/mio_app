import type { OnboardingCharacterId } from '@/constants/characters';

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

export interface StartSessionResponse {
  session_id: string;
  character_id: OnboardingCharacterId;
  status: 'active';
  started_at: string;
}

export interface EndSessionResponse {
  session_id: string;
  status: 'ended';
  ended_at: string;
  message_count: number;
  duration_seconds: number;
  summary_status: SummaryStatus;
}

export interface SessionSummaryResponse {
  session_id: string;
  summary_status: SummaryStatus;
  ended_at: string;
  duration_seconds: number;
  message_count: number;
  summary: string | null;
  avg_emotion_score: number | null;
  // 인지왜곡 유형 — 구분자 포맷 불명 (CHAT_BACKEND_QUESTIONS §8 확인 전까지 raw 문자열 그대로 표시)
  bias_types_detected: string | null;
  cbt_intervened: boolean | null;
}

export interface CbtEmotionScoreResponse {
  reconstruction_id: string;
  emotion_score_after: number;
  updated_at: string;
}
