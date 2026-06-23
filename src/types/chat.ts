import type { EmotionType } from '@/types/checkin';
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
  resources: { hotlines: SseCrisisResource[] };
}

export interface SseDoneData {
  msg_id: string;
  // TODO: 소크라테스 질문 식별 필드 백엔드 확인 필요 (message_type?: 'socratic')
  emotion_score: number | null;
  is_crisis_flagged: boolean;
  finished_reason: 'stop' | 'crisis_flow' | 'security_refusal' | 'replaced_by_guard' | 'error';
}

export interface ActiveSession {
  session_id: string;
  character_id: OnboardingCharacterId;
  status: 'active';
  started_at: string;
  last_message_at: string;
  message_count: number;
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
  summary_status: 'pending' | 'done';
}

export interface ChatSummaryEmotion {
  emotionType: EmotionType;
  intensity: number;
  percentChange: number;
}

export interface ChatSummary {
  primaryEmotion: ChatSummaryEmotion;
  keyPoints: string[];
  newThoughts: string[];
  recommendedActions: string[];
}
