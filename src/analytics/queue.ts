import {
  EVENT_BATCH_MAX_BYTES,
  EVENT_BATCH_MAX_COUNT,
  EVENT_BATCH_OVERHEAD_BYTES,
  EVENT_FLUSH_INTERVAL_MS,
  EVENT_FLUSH_THRESHOLD_COUNT,
  EVENT_RETRY_BACKOFF_FACTOR,
  EVENT_RETRY_BASE_DELAY_MS,
  EVENT_RETRY_MAX_DELAY_MS,
} from '@/analytics/constants';
import { loadBufferedEvents, saveBufferedEvents, trimToBufferLimit } from '@/analytics/buffer';
import type { AnyAnalyticsEvent } from '@/analytics/envelope';
import { sendEventBatch, type EventBatchRejection } from '@/analytics/transport';

/**
 * 이벤트 전송 큐
 *
 * 메모리 큐 + 영속 버퍼를 하나의 목록으로 다룬다. 큐가 바뀔 때마다 통째로 다시 쓰기 때문에
 * 앱이 어느 시점에 죽어도 다음 실행에서 같은 `event_id`로 재전송된다.
 *
 * ⚠️ 재전송 시 `event_id`를 절대 재생성하지 않는다 — 재생성하면 뒷단 중복 제거가 무력해져
 * Core Action 건수가 부풀고 지표가 틀린 채로 그럴듯하게 나온다.
 */

let queue: AnyAnalyticsEvent[] = [];
let restorePromise: Promise<void> | null = null;
let flushPromise: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
/** 429·전송 실패 백오프 — 이 시각 전에는 전송을 시도하지 않는다 */
let retryNotBeforeAt = 0;
let consecutiveFailures = 0;
/** 영속화 순서 보장용 — 겹쳐 쓰면 오래된 스냅샷이 최신을 덮을 수 있다 */
let persistChain: Promise<void> = Promise.resolve();

function utf8ByteLength(text: string): number {
  let bytes = 0;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      // surrogate pair — 4바이트 문자 하나
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }

  return bytes;
}

function persistQueue(): void {
  const snapshot = [...queue];
  persistChain = persistChain.then(() => saveBufferedEvents(snapshot));
}

/** 배치 상한(건수·바이트)에 맞춰 큐 앞에서 잘라낸다 */
function takeBatch(): AnyAnalyticsEvent[] {
  const batch: AnyAnalyticsEvent[] = [];
  let bytes = EVENT_BATCH_OVERHEAD_BYTES;

  for (const event of queue) {
    if (batch.length >= EVENT_BATCH_MAX_COUNT) {
      break;
    }

    const eventBytes = utf8ByteLength(JSON.stringify(event));
    // 첫 건이 혼자 상한을 넘겨도 일단 보낸다 — 안 보내면 큐가 그 자리에서 영원히 막힌다
    if (batch.length > 0 && bytes + eventBytes > EVENT_BATCH_MAX_BYTES) {
      break;
    }

    bytes += eventBytes;
    batch.push(event);
  }

  return batch;
}

function logRejections(batch: AnyAnalyticsEvent[], rejections: EventBatchRejection[]): void {
  for (const rejection of rejections) {
    const eventName = rejection.event_name ?? batch[rejection.index]?.event_name ?? 'unknown';
    console.warn(
      `[analytics] event rejected by server — index=${rejection.index} event_name=${eventName} reason=${rejection.reason}`
    );
  }
}

function scheduleBackoff(): void {
  consecutiveFailures += 1;
  const delay = Math.min(
    EVENT_RETRY_BASE_DELAY_MS * EVENT_RETRY_BACKOFF_FACTOR ** (consecutiveFailures - 1),
    EVENT_RETRY_MAX_DELAY_MS
  );
  retryNotBeforeAt = Date.now() + delay;
}

/**
 * 큐를 비울 때까지 배치를 연달아 보낸다.
 * 거부된 항목은 재전송해도 다시 거부되므로 배치 전체를 큐에서 뺀다.
 */
async function drainQueue(): Promise<void> {
  while (queue.length > 0 && Date.now() >= retryNotBeforeAt) {
    const batch = takeBatch();
    const result = await sendEventBatch(batch);

    if (result.type === 'rate_limited') {
      // ⚠️ 429에서 버퍼를 버리면 오프라인이 잦은 유저가 선택적으로 지워져 리텐션이 좋아 보인다
      retryNotBeforeAt = Date.now() + result.retryAfterMs;
      return;
    }

    if (result.type === 'failed') {
      scheduleBackoff();
      return;
    }

    logRejections(batch, result.rejections);
    queue = queue.slice(batch.length);
    consecutiveFailures = 0;
    retryNotBeforeAt = 0;
    persistQueue();
  }
}

/** 진행 중인 flush가 있으면 그것을 기다린다 — 같은 이벤트를 두 번 보내지 않기 위해 직렬화한다 */
export function flushQueue(): Promise<void> {
  flushPromise ??= drainQueue().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

/** 앱 시작 시 1회. 디스크에 남아 있던 이벤트를 큐 앞(오래된 순)에 붙인다 */
export function restoreQueue(): Promise<void> {
  restorePromise ??= (async () => {
    const buffered = await loadBufferedEvents();
    if (buffered.length > 0) {
      queue = trimToBufferLimit([...buffered, ...queue]);
      persistQueue();
    }
  })();

  return restorePromise;
}

export function enqueueEvent(event: AnyAnalyticsEvent): void {
  queue = trimToBufferLimit([...queue, event]);
  persistQueue();

  if (queue.length >= EVENT_FLUSH_THRESHOLD_COUNT) {
    void flushQueue();
  }
}

/** 주기 flush 시작. 반환한 함수를 호출하면 멈춘다 */
export function startQueueAutoFlush(): () => void {
  flushTimer ??= setInterval(() => {
    void flushQueue();
  }, EVENT_FLUSH_INTERVAL_MS);

  return () => {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
  };
}
