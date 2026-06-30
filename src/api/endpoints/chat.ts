import apiClient from '@/api/client';
import type { OnboardingCharacterId } from '@/constants/characters';
import type { ApiResponse } from '@/types/common';
import type {
  ActiveSessionResponse,
  CbtEmotionScoreResponse,
  EndSessionResponse,
  SessionSummaryResponse,
  StartSessionResponse,
} from '@/types/chat';

export async function fetchActiveSession(): Promise<ActiveSessionResponse> {
  const { data } = await apiClient.get<ApiResponse<ActiveSessionResponse>>('/v1/sessions/active');
  return data.data;
}

export async function startSession(
  characterId: OnboardingCharacterId
): Promise<StartSessionResponse> {
  const { data } = await apiClient.post<ApiResponse<StartSessionResponse>>('/v1/sessions', {
    character_id: characterId,
  });
  return data.data;
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  const { data } = await apiClient.post<ApiResponse<EndSessionResponse>>(
    `/v1/sessions/${sessionId}/end`
  );
  return data.data;
}

export async function fetchSessionSummary(sessionId: string): Promise<SessionSummaryResponse> {
  const { data } = await apiClient.get<ApiResponse<SessionSummaryResponse>>(
    `/v1/sessions/${sessionId}/summary`
  );
  return data.data;
}

export async function submitCbtEmotionScore(
  reconstructionId: string,
  score: number
): Promise<CbtEmotionScoreResponse> {
  const { data } = await apiClient.post<ApiResponse<CbtEmotionScoreResponse>>(
    `/v1/cbt/reconstructions/${reconstructionId}/emotion-score`,
    { score }
  );
  return data.data;
}
