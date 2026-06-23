import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ApiResponse } from '@/types/common';
import type {
  ActiveSessionResponse,
  EndSessionResponse,
  SessionSummaryResponse,
  StartSessionResponse,
} from '@/types/chat';

// TODO mock 전용: 세션 시작 실패 케이스(10번 작업) 수동 확인용 트리거. USE_MOCK이 아닐 때는 효과 없음
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
  if (USE_MOCK) {
    // 활성 세션 없음 — 서버는 세션이 없어도 항상 객체를 반환하고 필드를 null로 채운다
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

  const { data } = await apiClient.get<ApiResponse<ActiveSessionResponse>>('/v1/sessions/active');
  return data.data;
}

export async function startSession(
  characterId: OnboardingCharacterId
): Promise<StartSessionResponse> {
  if (USE_MOCK) {
    if (mockStartSessionErrorCode === 'ONBOARDING_REQUIRED') {
      throw mockApiError(403, 'ONBOARDING_REQUIRED');
    }
    if (mockStartSessionErrorCode === 'SESSION_ALREADY_ACTIVE') {
      throw mockApiError(409, 'SESSION_ALREADY_ACTIVE');
    }
    if (mockStartSessionErrorCode === 'OTHER') {
      throw mockApiError(500, 'INTERNAL_ERROR');
    }

    return {
      session_id: `mock-session-${Date.now()}`,
      character_id: characterId,
      status: 'active',
      started_at: new Date().toISOString(),
    };
  }

  const { data } = await apiClient.post<ApiResponse<StartSessionResponse>>('/v1/sessions', {
    character_id: characterId,
  });
  return data.data;
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  if (USE_MOCK) {
    return {
      session_id: sessionId,
      status: 'ended',
      ended_at: new Date().toISOString(),
      message_count: 0,
      duration_seconds: 0,
      summary_status: 'pending',
    };
  }

  const { data } = await apiClient.post<ApiResponse<EndSessionResponse>>(
    `/v1/sessions/${sessionId}/end`
  );
  return data.data;
}

export async function fetchSessionSummary(sessionId: string): Promise<SessionSummaryResponse> {
  if (USE_MOCK) {
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

  const { data } = await apiClient.get<ApiResponse<SessionSummaryResponse>>(
    `/v1/sessions/${sessionId}/summary`
  );
  return data.data;
}
