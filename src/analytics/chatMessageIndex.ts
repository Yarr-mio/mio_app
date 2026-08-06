import queryClient from '@/api/queryClient';
import { queryKeys } from '@/api/queryKeys';
import type { ActiveSessionResponse } from '@/types/chat';

/**
 * `chat_message_sent.message_index` 원천 (event-logging-spec v3.5 §4-C)
 *
 * 세션별 "이번 실행에서 보낸 사용자 메시지 수"를 들고 있고, 앱 재시작으로 복귀한 세션은
 * 서버가 아는 메시지 수를 시드로 얹는다. 시드가 없으면 재시작 유저의 대화가 영영 index 0으로만
 * 찍혀 "유의미 대화"(index ≥ 1) 판정이 성립하지 않는다.
 *
 * ⚠️ 계측 상태를 `chatStore`에 넣지 않는다 — 채팅 도메인 스토어에 계측 관심사가 섞이고
 * `startSession`의 리셋 의미가 변한다. 계측은 계측 안에서 닫는다.
 * ⚠️ 시드는 세션당 정확히 1회만 잡는다 — activeSession 쿼리는 포그라운드 복귀로 refetch되는데,
 * 그때의 `message_count`에는 이번 실행에서 보낸 분이 이미 포함돼 있어 두 번 세어진다.
 */

interface SessionCounter {
  /** 세션 시작 시점에 서버가 알고 있던 메시지 수. 한 번 정하면 바꾸지 않는다 */
  seed: number;
  /** 이번 실행에서 이 세션으로 실제 전송한 건수 */
  sentCount: number;
}

const counters = new Map<string, SessionCounter>();

/**
 * 캐시된 활성 세션 응답에서 시드를 읽는다.
 * 신규 세션은 캐시에 해당 세션이 없어 0이 되고, 이는 사실과 일치한다.
 */
function readSeedFromActiveSession(sessionId: string): number {
  const activeSession = queryClient.getQueryData<ActiveSessionResponse>(
    queryKeys.chat.activeSession()
  );

  if (activeSession?.session_id !== sessionId || typeof activeSession.message_count !== 'number') {
    return 0;
  }

  return activeSession.message_count;
}

function getOrCreateCounter(sessionId: string): SessionCounter {
  let counter = counters.get(sessionId);
  if (!counter) {
    counter = { seed: readSeedFromActiveSession(sessionId), sentCount: 0 };
    counters.set(sessionId, counter);
  }

  return counter;
}

/** 다음에 보낼 메시지의 `message_index`. 아직 소비하지 않는다 */
export function peekNextMessageIndex(sessionId: string): number {
  const counter = getOrCreateCounter(sessionId);
  return counter.seed + counter.sentCount;
}

/** 전송이 실제로 이뤄진 턴에서만 호출해 index를 소비한다 */
export function commitSentMessage(sessionId: string): void {
  const counter = getOrCreateCounter(sessionId);
  counter.sentCount += 1;
}
