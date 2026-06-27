import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ApiResponse } from '@/types/common';
import type {
  ActiveSessionResponse,
  CbtEmotionScoreResponse,
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

// TODO mock 전용: 30분 idle 자동종료로 서버가 먼저 세션을 끝낸 뒤 메시지를 보내는 케이스(SSE 410)
// 수동 확인용 트리거. 한 번 소비되면 자동으로 해제되어 이후 정상 전송에는 영향을 주지 않음
export type MockSendMessageErrorCode = 'GONE';
let mockSendMessageErrorCode: MockSendMessageErrorCode | null = null;

export function setMockSendMessageErrorCode(code: MockSendMessageErrorCode | null): void {
  mockSendMessageErrorCode = code;
}

export function consumeMockSendMessageErrorCode(): MockSendMessageErrorCode | null {
  const code = mockSendMessageErrorCode;
  mockSendMessageErrorCode = null;
  return code;
}

// TODO mock 전용: 자동 종료 이후 사용자가 수동으로 "종료"를 다시 누르는 케이스 수동 확인용 트리거.
// 한 번 소비되면 자동으로 해제됨
export type MockEndSessionErrorCode = 'GONE' | 'NOT_FOUND';
let mockEndSessionErrorCode: MockEndSessionErrorCode | null = null;

export function setMockEndSessionErrorCode(code: MockEndSessionErrorCode | null): void {
  mockEndSessionErrorCode = code;
}

// TODO mock 전용: 포그라운드 복귀 시 activeSession 재조회가 "서버가 먼저 세션을 종료함"을 감지하는지
// 확인하는 트리거. 다음 fetchActiveSession 호출 한 번에만 적용되고 자동 해제됨 — 토글 후 앱을
// 백그라운드/포그라운드로 전환해 chat/index.tsx의 재진입 리다이렉트가 동작하는지 확인한다
let mockActiveSessionEndedSessionId: string | null = null;

export function setMockActiveSessionEndedOnNextFetch(sessionId: string | null): void {
  mockActiveSessionEndedSessionId = sessionId;
}

// axios.isAxiosError()는 isAxiosError === true 여부만 보므로, 실제 axios 요청 없이도 동일한 모양으로 흉내낼 수 있음
function mockApiError(status: number, code: string) {
  return { isAxiosError: true, response: { status, data: { error: { code } } } };
}

export async function fetchActiveSession(): Promise<ActiveSessionResponse> {
  if (USE_MOCK) {
    if (mockActiveSessionEndedSessionId) {
      const endedSessionId = mockActiveSessionEndedSessionId;
      mockActiveSessionEndedSessionId = null;
      return {
        session_id: null,
        character_id: null,
        status: null,
        started_at: null,
        last_message_at: null,
        message_count: null,
        last_summary_status: 'pending',
        last_ended_session_id: endedSessionId,
      };
    }

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
    if (mockEndSessionErrorCode) {
      const status = mockEndSessionErrorCode === 'GONE' ? 410 : 404;
      const code = mockEndSessionErrorCode;
      mockEndSessionErrorCode = null;
      throw mockApiError(status, code);
    }

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

export async function submitCbtEmotionScore(
  reconstructionId: string,
  score: number
): Promise<CbtEmotionScoreResponse> {
  if (USE_MOCK) {
    return {
      reconstruction_id: reconstructionId,
      emotion_score_after: score,
      updated_at: new Date().toISOString(),
    };
  }

  const { data } = await apiClient.post<ApiResponse<CbtEmotionScoreResponse>>(
    `/v1/cbt/reconstructions/${reconstructionId}/emotion-score`,
    { score }
  );
  return data.data;
}
