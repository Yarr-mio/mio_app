import { isAxiosError } from 'axios';

import apiClient from '@/api/client';
import { EVENT_RATE_LIMIT_FALLBACK_DELAY_MS, EVENTS_ENDPOINT } from '@/analytics/constants';
import type { AnyAnalyticsEvent } from '@/analytics/envelope';
import { HTTP_STATUS } from '@/constants/config';
import type { ApiResponse } from '@/types/common';

/**
 * 이벤트 배치 전송 (event-logging-spec v3.5 §5)
 *
 * ⚠️ `_skipAuthRefresh`·`_skipAuthRedirect`가 필수다. 없으면 이벤트 배치가 401 인터셉터의
 * refresh 재시도와 로그인 리다이렉트를 유발한다 — 계측이 앱 동작을 바꿔서는 안 된다.
 * 로그인 전에는 access token이 없어 그대로 익명 전송되고, 이는 §5④(익명 허용)와 일치한다.
 */

/** 202 부분 성공 시 서버가 돌려주는 거부 항목 */
export interface EventBatchRejection {
  /** 배치 내 0-base 위치 — `event_id`가 없어서 거부된 건을 큐에서 지우려면 이 값이 필요하다 */
  index: number;
  event_id: string | null;
  event_name: string | null;
  reason: string;
}

/**
 * 202 응답 본문 (`ApiResponse`의 `data`).
 *
 * ⚠️ 서버는 모든 엔드포인트를 `ApiResponse`로 감싼다 — `rejected`는 최상위가 아니라
 * `data` 안에 있다. 여기서 `ApiResponse<T>`를 쓰지 않고 형태를 직접 읽으면
 * 거부 목록이 영원히 빈 배열로 해석된다.
 */
export interface EventsIngestData {
  accepted_count: number;
  rejected: EventBatchRejection[];
}

export type EventBatchResult =
  /** 서버가 배치를 받았다. `rejections`에 실린 항목은 재전송해도 다시 거부되므로 큐에서 뺀다 */
  | { type: 'accepted'; acceptedCount: number; rejections: EventBatchRejection[] }
  /** 429 — 버퍼를 절대 버리지 않고 `Retry-After`만큼 기다린다 (§3-A) */
  | { type: 'rate_limited'; retryAfterMs: number }
  /** 네트워크 실패·5xx 등 — 큐를 유지한 채 백오프 재시도 */
  | { type: 'failed' };

/** `Retry-After`는 초 단위 정수 또는 HTTP-date로 온다 */
function readRetryAfterMs(headerValue: unknown): number {
  if (typeof headerValue !== 'string' || headerValue.trim().length === 0) {
    return EVENT_RATE_LIMIT_FALLBACK_DELAY_MS;
  }

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(headerValue);
  if (Number.isNaN(retryAt)) {
    return EVENT_RATE_LIMIT_FALLBACK_DELAY_MS;
  }

  return Math.max(0, retryAt - Date.now());
}

export async function sendEventBatch(events: AnyAnalyticsEvent[]): Promise<EventBatchResult> {
  try {
    // 본문은 이벤트 배열 그대로다 (§5④ "배열 배치 수신")
    const response = await apiClient.post<ApiResponse<EventsIngestData>>(EVENTS_ENDPOINT, events, {
      _skipAuthRefresh: true,
      _skipAuthRedirect: true,
    });

    // 계약을 벗어난 본문이 와도 큐 배출이 예외로 멈추지 않게 형태만 확인한다
    const ingested = response.data?.data;
    const rejected = ingested?.rejected;

    return {
      type: 'accepted',
      acceptedCount: typeof ingested?.accepted_count === 'number' ? ingested.accepted_count : 0,
      rejections: Array.isArray(rejected) ? rejected : [],
    };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      return {
        type: 'rate_limited',
        retryAfterMs: readRetryAfterMs(error.response.headers?.['retry-after']),
      };
    }

    return { type: 'failed' };
  }
}
