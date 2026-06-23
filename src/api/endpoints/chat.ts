import type { OnboardingCharacterId } from '@/constants/characters';
import type {
  ActiveSessionResponse,
  EndSessionResponse,
  SessionSummaryResponse,
  StartSessionResponse,
} from '@/types/chat';

// TODO: 서버 연동 전 mock 응답 사용

// TODO mock 전용: 세션 시작 실패 케이스(10번 작업) 수동 확인용 트리거. 11번 작업(실제 SSE 연동)에서 mock 제거 시 같이 삭제
export type MockStartSessionErrorCode = 'ONBOARDING_REQUIRED' | 'SESSION_ALREADY_ACTIVE' | 'OTHER';
let mockStartSessionErrorCode: MockStartSessionErrorCode | null = null;

export function setMockStartSessionError(code: MockStartSessionErrorCode | null): void {
  mockStartSessionErrorCode = code;
}

// axios.isAxiosError()는 isAxiosError === true 여부만 보므로, 실제 axios 요청 없이도 동일한 모양으로 흉내낼 수 있음
function mockApiError(status: number, code: string) {
  return { isAxiosError: true, response: { status, data: { error: { code } } } };
}

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
  if (mockStartSessionErrorCode === 'ONBOARDING_REQUIRED') {
    throw mockApiError(403, 'ONBOARDING_REQUIRED');
  }
  if (mockStartSessionErrorCode === 'SESSION_ALREADY_ACTIVE') {
    throw mockApiError(409, 'SESSION_ALREADY_ACTIVE');
  }
  if (mockStartSessionErrorCode === 'OTHER') {
    throw mockApiError(500, 'INTERNAL_ERROR');
  }

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

export async function fetchSessionSummary(sessionId: string): Promise<SessionSummaryResponse> {
  // TODO mock: 고정 응답 반환 (실제 연동 시 summary_status='pending' 폴링 동작은 서버가 결정)
  return {
    session_id: sessionId,
    summary_status: 'done',
    ended_at: new Date().toISOString(),
    duration_seconds: 600,
    message_count: 12,
    summary:
      '오늘은 업무 마감 압박감으로 불안함을 느꼈지만, 작은 실수에 너무 가혹하지 않아도 된다는 걸 다시 떠올렸어요.',
    avg_emotion_score: 45,
    bias_types_detected: '재앙화, 흑백논리',
    cbt_intervened: true,
  };
}
