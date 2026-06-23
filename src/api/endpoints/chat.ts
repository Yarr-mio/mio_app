import type { OnboardingCharacterId } from '@/constants/characters';
import type { ActiveSessionResponse, EndSessionResponse, StartSessionResponse } from '@/types/chat';

// TODO: 서버 연동 전 mock 응답 사용

export async function fetchActiveSession(): Promise<ActiveSessionResponse> {
  // TODO mock: 활성 세션 없음 — 서버는 세션이 없어도 항상 객체를 반환하고 필드를 null로 채운다
  return {
    session_id: null,
    character_id: null,
    status: null,
    started_at: null,
    last_message_at: null,
    message_count: null,
    last_summary_status: null,
    last_ended_session_id: null,
  };
}

export async function startSession(
  characterId: OnboardingCharacterId
): Promise<StartSessionResponse> {
  // TODO mock: 고정 응답 반환
  return {
    session_id: `mock-session-${Date.now()}`,
    character_id: characterId,
    status: 'active',
    started_at: new Date().toISOString(),
  };
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  // TODO mock: 고정 응답 반환
  return {
    session_id: sessionId,
    status: 'ended',
    ended_at: new Date().toISOString(),
    message_count: 0,
    duration_seconds: 0,
    summary_status: 'pending',
  };
}
