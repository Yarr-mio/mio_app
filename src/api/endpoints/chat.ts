import apiClient from '@/api/client';
import type { OnboardingCharacterId } from '@/constants/characters';
import {
  SESSION_HISTORY_MAX_PAGES,
  SESSION_HISTORY_PAGE_SIZE,
  SESSION_HISTORY_TOTAL_TIMEOUT_MS,
} from '@/constants/config';
import type { ApiResponse } from '@/types/common';
import type {
  ActiveSessionResponse,
  CbtEmotionScoreResponse,
  EndSessionResponse,
  SessionHistoryMessage,
  SessionMessagesResponse,
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

export async function fetchSessionMessages(
  sessionId: string,
  params?: { cursor?: string; limit?: number },
  signal?: AbortSignal
): Promise<SessionMessagesResponse> {
  const { data } = await apiClient.get<ApiResponse<SessionMessagesResponse>>(
    `/v1/sessions/${sessionId}/messages`,
    { params, signal }
  );
  return data.data;
}

/**
 * 세션의 대화 이력을 next_cursor를 따라가며 전량 수집한다.
 *
 * 이력 복원은 "전량을 받아 한 번에 시딩"하는 연산이라 페이지 상태를 화면에 노출할 필요가 없다.
 * useInfiniteQuery(useCheckin 선례)는 사용자가 스크롤로 더 받는 UI용이라 여기선 쓰지 않는다.
 */
export async function fetchAllSessionMessages(sessionId: string): Promise<SessionHistoryMessage[]> {
  const collected: SessionHistoryMessage[] = [];
  let cursor: string | undefined;

  // 수집이 끝날 때까지 입력창이 잠겨 있으므로(ChatMain) 전체에 마감을 건다 —
  // 요청당 타임아웃만으로는 페이지 수와 재시도만큼 대기가 늘어난다
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), SESSION_HISTORY_TOTAL_TIMEOUT_MS);

  try {
    for (let page = 0; page < SESSION_HISTORY_MAX_PAGES; page += 1) {
      const response = await fetchSessionMessages(
        sessionId,
        { cursor, limit: SESSION_HISTORY_PAGE_SIZE },
        controller.signal
      );
      collected.push(...response.messages);

      if (!response.has_next || !response.next_cursor) {
        return collected;
      }
      cursor = response.next_cursor;
    }

    // 상한에 닿았다는 것은 서버가 has_next를 계속 참으로 주고 있다는 뜻 — 조용히 자르지 않고 남긴다
    console.warn('[ChatHistory] 페이지 상한 도달, 이력이 잘렸을 수 있음', { sessionId });
    return collected;
  } finally {
    clearTimeout(deadline);
  }
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
