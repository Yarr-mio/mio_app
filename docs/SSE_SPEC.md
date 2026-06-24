# Mio Server SSE 채팅 스펙 — `POST /v1/sessions/{sessionId}/messages`

> 일반 REST 엔드포인트(인증, 에러 포맷, 세션 생성/조회/종료 등)는 [API_SPEC.md](./API_SPEC.md)를 참고하세요. 이 문서는 메시지 전송 한 엔드포인트(SSE)만 다룹니다.
> 코드가 변경되면 이 문서도 함께 갱신해야 합니다 (자동 동기화 아님). 기준 소스: `SessionController`, `SessionService`, `ConversationOrchestrator`, `CrisisFlowService`, `PolicyEngine`, `UserMessageSignalAnalyzer`, `SseEventDto`.

## 목차

1. [엔드포인트 개요](#1-엔드포인트-개요)
2. [메시지 전송 흐름](#2-메시지-전송-흐름)
3. [SSE 와이어 포맷](#3-sse-와이어-포맷)
4. [메시지 ID 체계](#4-메시지-id-체계-중요)
5. [이벤트 카탈로그](#5-이벤트-카탈로그)
6. [시나리오별 이벤트 시퀀스](#6-시나리오별-이벤트-시퀀스)
7. [알아둬야 할 동작 (gotcha)](#7-️-알아둬야-할-동작-gotcha)
8. [`crisis` 이벤트 상세](#8-crisis-이벤트-상세-crisisflowservice)
9. [요청 예시](#9-요청-예시-fetch-기반-의사코드)

---

## 1. 엔드포인트 개요

| Method | Path                                | 인증 | Content-Type (응답) | 비고                        |
| ------ | ----------------------------------- | ---- | ------------------- | --------------------------- |
| POST   | `/v1/sessions/{sessionId}/messages` | 필요 | `text/event-stream` | `Idempotency-Key` 헤더 옵션 |

**요청 바디**:

```ts
interface SendMessageRequest {
  content: string;
} // 1~4000자 필수
```

> ⚠️ **브라우저 네이티브 `EventSource`는 GET 요청만 지원하므로 이 엔드포인트에 사용할 수 없다.**
> `fetch()` + `ReadableStream`을 직접 파싱하거나, POST를 지원하는 SSE 클라이언트 라이브러리(예: `@microsoft/fetch-event-source`, `eventsource-parser`)를 사용해야 한다.

---

## 2. 메시지 전송 흐름

처리 순서 (`SessionController` → `SessionService` → `ConversationOrchestrator`):

1. **동기 검증** (`SessionService.validateMessageRequest`) — 이 단계는 SSE 스트림을 열기 *전*에 수행되며, 실패하면 평소처럼 `ErrorResponse` JSON이 즉시 반환된다 (스트림 아님, `Content-Type: application/json`):

   | 조건                                                          | 응답                                 |
   | ------------------------------------------------------------- | ------------------------------------ |
   | 사용자당 60건/60초 초과 (Redis 카운터)                        | `429 RATE_LIMITED`                   |
   | `Idempotency-Key` 헤더가 1시간(3600s) 내 동일 값으로 재사용됨 | `409 DUPLICATE_REQUEST`              |
   | 세션이 존재하지 않음                                          | `404 SESSION_NOT_FOUND`              |
   | 세션이 본인 소유가 아님                                       | `403 FORBIDDEN`                      |
   | 세션이 이미 종료됨                                            | `410 GONE` (`SESSION_ALREADY_ENDED`) |
   | `content`가 비어있거나 4000자 초과                            | `400 VALIDATION_ERROR`               |

2. 검증을 통과하면 `Content-Type: text/event-stream`인 `SseEmitter`(타임아웃 60,000ms = **60초**)가 생성되고, 실제 AI 처리(`ConversationOrchestrator.handle`)는 가상 스레드(virtual thread)에서 비동기로 실행된다.
3. **타임아웃 또는 클라이언트 연결 끊김**: 별도의 에러 이벤트 없이 스트림이 그냥 종료된다 (`emitter.complete()`만 호출). `done` 이벤트를 못 받았는데 스트림이 끝나면 타임아웃/네트워크 문제로 간주해야 한다.
4. **처리 중 예외 발생**: `emitter.completeWithError(e)`로 스트림이 비정상 종료된다. 이때도 에러를 알리는 SSE 이벤트는 전송되지 않는다 — 프론트엔드는 "정상적인 `done` 없이 스트림이 끝남"을 범용 에러 케이스로 다뤄야 한다.

---

## 3. SSE 와이어 포맷

표준 SSE 포맷 그대로다 (`id:` 필드는 사용하지 않음 → 재연결/Last-Event-ID 메커니즘 없음):

```
event: <eventName>
data: <JSON 한 줄>

```

(이벤트 사이는 빈 줄로 구분)

---

## 4. 메시지 ID 체계 (중요)

한 번의 전송 요청마다 서버가 ID 두 개를 발급한다 (`ConversationOrchestrator.handle`, 형식: `msg_in_` / `msg_out_` + 8자리 hex):

| ID              | 사용되는 이벤트                                       | 의미                 |
| --------------- | ----------------------------------------------------- | -------------------- |
| `inboundMsgId`  | `session_meta.message_id`                             | 사용자가 보낸 메시지 |
| `outboundMsgId` | `delta.msg_id`, `delta.replace.msg_id`, `done.msg_id` | AI 응답 메시지       |

`crisis` 이벤트에는 `msg_id`가 없다 — 바로 뒤에 오는 `done` 이벤트(`finished_reason: "crisis_flow"`)로만 연관관계를 알 수 있다.

---

## 5. 이벤트 카탈로그

`event:` 필드값별로 `data:`(JSON) 스키마가 다르다. 한 요청당 **반드시 `session_meta`로 시작**하고, 시나리오에 따라 다른 이벤트 조합 후 보통 `done`으로 끝난다 (단, 2장의 3/4번처럼 `done` 없이 끝나는 비정상 케이스도 있음).

```ts
type SseEvent =
  | { event: 'session_meta'; data: SessionMetaData }
  | { event: 'delta'; data: DeltaData }
  | { event: 'delta.replace'; data: DeltaReplaceData }
  | { event: 'crisis'; data: CrisisData }
  | { event: 'done'; data: DoneData };

// 매 요청 최초 1회, 가장 먼저 전송됨
interface SessionMetaData {
  message_id: string; // inboundMsgId (사용자 메시지)
  received_at: string; // ISO datetime (UTC)
}

// 증분 텍스트 — 누적(append)해서 표시. 한 요청당 0~N회 전송됨
interface DeltaData {
  chunk: string;
  msg_id: string; // outboundMsgId
}

// 지금까지 누적한 delta.chunk를 모두 버리고 safe_response로 "통째로 교체"해야 함 (append 금지!)
interface DeltaReplaceData {
  safe_response: string;
  msg_id: string; // outboundMsgId
}

// 위기 대응 — severity >= 2일 때만 resources(hotline)가 채워짐. 모든 시나리오에서 전송되는 건 아님 (7장 참고)
interface CrisisData {
  severity: 1 | 2 | 3;
  fixed_response: string; // 고정 안내 문구 (LLM 생성 아님)
  resources: { hotlines: { name: string; number: string; hours: string }[] } | null;
}

// 한 요청의 마지막 이벤트 (정상 종료 시 항상 전송)
interface DoneData {
  msg_id: string; // outboundMsgId
  emotion_score?: number; // 0~100 척도 (체크인의 1~5 condition_score와 다른 척도! 7장 참고)
  is_crisis_flagged: boolean;
  is_socratic: boolean; // AI 응답에 물음표 포함 여부로만 판정 — CBT 소크라테스식 개입 여부와는 다름, 오탐 가능
  finished_reason: 'stop' | 'security_refusal' | 'crisis_flow' | 'replaced_by_guard' | 'error';
}
```

---

## 6. 시나리오별 이벤트 시퀀스

메시지마다 서버 내부 안전/정책 엔진(`PolicyEngine`)이 5가지 경로 중 하나로 분기한다. **분기 기준은 서버 내부 로직이라 클라이언트가 미리 알 수 없으므로, 아래 모든 시퀀스를 다 처리할 수 있는 범용 상태 머신으로 구현해야 한다.**

| 시나리오                                                     | 이벤트 시퀀스                                                                                                                                         | 설명                                                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **보안 거부** (악의적 입력 등)                               | `session_meta` → `delta`(전체 고정 문구 1회) → `done`(`finished_reason="security_refusal"`)                                                           | 스트리밍 없이 고정 거부 문구를 한 번에 전달                                                                                                                 |
| **위기 감지 (입력 단계)**                                    | `session_meta` → `crisis` → `done`(`finished_reason="crisis_flow"`, `is_crisis_flagged=true`)                                                         | 사용자 입력 자체에서 위기 신호 감지. LLM 호출 자체를 생략함                                                                                                 |
| **일반 생성 - SPECULATIVE** (저위험)                         | `session_meta` → `delta` × N (실시간 스트리밍) → `done`(`finished_reason="stop"`)                                                                     | 출력 검증(OutputGuard) 없이 그대로 스트리밍. 가장 단순한 happy path                                                                                         |
| **일반 생성 - BUFFER** (고위험 입력)                         | `session_meta` → `delta`(전체 내용 1회) → `done`(`finished_reason="stop"`)                                                                            | LLM 응답을 다 받은 뒤 OutputGuard 검증 통과 후 한 번에 전달 (스트리밍 체감 없음)                                                                            |
| **일반 생성 - BUFFER, 출력 검증 실패 → 위기 전환**           | `session_meta` → `crisis` → `done`(`finished_reason="crisis_flow"`, `is_crisis_flagged=true`)                                                         | 버퍼링된 응답이 OutputJudge에 의해 위기로 재분류됨                                                                                                          |
| **일반 생성 - CAUTIOUS_SPECULATIVE** (중간 위험, happy path) | `session_meta` → `delta` × N → `done`(`finished_reason="stop"`)                                                                                       | 스트리밍하면서 동시에 비동기로 검증. 문제 없으면 추가 이벤트 없이 종료                                                                                      |
| **CAUTIOUS_SPECULATIVE, 조기 차단 후 안전 판정**             | `session_meta` → `delta` × N (일부만) → (스트림 일시 중단, 내부 비동기 판정) → `delta.replace`(전체 내용) → `done`(`finished_reason="stop"`)          | 검증 중 의심 패턴 감지로 스트리밍을 멈췄지만, 최종 판정은 안전 → 멈췄던 지점부터가 아니라 **전체 내용을 `delta.replace`로 재전송**함                        |
| **CAUTIOUS_SPECULATIVE, 검증 실패 → 위기 재분류**            | `session_meta` → `delta` × N (일부 또는 전체) → `crisis` → `done`(`finished_reason="crisis_flow"`, `is_crisis_flagged=true`)                          | `OutputJudge`가 `CRISIS_FLOW`로 판정한 경우. BUFFER 모드와 동일하게 `crisisFlowService.handle()`을 호출해 `crisis` 이벤트(+필요시 핫라인)가 정상적으로 온다 |
| **CAUTIOUS_SPECULATIVE, 검증 실패 → REWRITE/REPLACE**        | `session_meta` → `delta` × N (일부 또는 전체) → `delta.replace`(대체 문구) → `done`(`finished_reason="replaced_by_guard"`, `is_crisis_flagged=false`) | 위기가 아닌 경계 위반(역할 경계, 의존성 강화 등)을 안전 문구로 교체한 경우. `replaced_by_guard`는 이제 이 비위기 케이스 전용                                |
| **알 수 없는 정책 결과 (fallback)**                          | `session_meta` → `delta`(에러 안내 문구) → `done`(`finished_reason="error"`)                                                                          | 정책 엔진이 처리 불가능한 액션을 반환한 극단적 예외 상황                                                                                                    |

---

## 7. ⚠️ 알아둬야 할 동작 (gotcha)

- **`delta.replace`는 append가 아니라 전체 교체다.** 지금까지 화면에 쌓인 텍스트를 버리고 `safe_response` 값으로 다시 그려야 한다.
- **`CAUTIOUS_SPECULATIVE` 모드에서 출력단계 위기 재분류도 이제 `crisis` 이벤트를 정상적으로 받는다.** `BUFFER` 모드와 동일하게 `crisisFlowService.handle()`을 호출해 `crisis` 이벤트(+필요시 핫라인) + `done(finished_reason="crisis_flow")`로 끝난다. `finished_reason="replaced_by_guard"`는 더 이상 위기 케이스에 쓰이지 않고, **위기가 아닌** REWRITE/REPLACE(역할 경계 위반, 의존성 강화 발언 등) 전용이다 — 이 경로는 `is_crisis_flagged=false`로 온다. **위기 UI(상담 전화 안내 등)를 노출할지 여부는 여전히 `crisis` 이벤트 수신이 아니라 `done.is_crisis_flagged`를 기준으로 판단**하는 것을 권장한다(둘이 항상 같은 시점에 오긴 하지만, 이벤트 수신 자체보다 명시적 플래그를 기준으로 분기하는 쪽이 안전).
- **`emotion_score`는 체크인의 1~5 `condition_score`와 전혀 다른 척도다.** CBT 측정용 0~100 스케일이며, 현재 구현은 키워드 매칭으로 25(강한 고통) / 45(중간 고통) / 70(평상시) 3단계 고정값만 반환한다(`UserMessageSignalAnalyzer`). 향후 더 세분화될 수 있으니 연속값으로 가정하고 UI를 만들 것.
- **`session_meta`/`delta`/`done`의 `msg_id`는 서로 다른 메시지를 가리킨다.** `session_meta.message_id`는 사용자 메시지 ID, 나머지의 `msg_id`는 AI 응답 메시지 ID다. 같은 값이 아니다.
- **타임아웃은 60초.** 그 안에 `done`을 못 받으면 스트림이 조용히 끊긴다.

---

## 8. `crisis` 이벤트 상세 (`CrisisFlowService`)

| severity | 트리거                                                                   | 응답 문구                  | `resources.hotlines`                                                 |
| -------- | ------------------------------------------------------------------------ | -------------------------- | -------------------------------------------------------------------- |
| 1        | 경미한 고통 신호 (moderation 기반, 키워드 미매칭)                        | 진정 유도 문구             | 없음 (`null`)                                                        |
| 2        | "사라지고싶다/없어지고싶다/살기싫다" 등 중간 위험 키워드                 | 전문 도움 안내 문구        | `자살예방상담전화 109(24/7)`, `정신건강위기상담전화 1577-0199(24/7)` |
| 3        | "자살/자해/죽고싶다" 등 고위험 키워드, 또는 SafetyL1의 `hardCrisis` 판정 | 즉시 전문가 연결 안내 문구 | 위와 동일                                                            |

- `fixed_response`는 **LLM이 생성한 텍스트가 아니라 고정 문구**다 (안전성 보장).
- 위기 이벤트가 발생하면 서버는 `crisis_events` 테이블에 기록을 남기고, 해당 세션의 SafetyProfile 캐시를 즉시 무효화한다 (다음 메시지부터 더 보수적으로 판단됨) — 프론트엔드 입장에서는 같은 세션 내 후속 메시지가 `BUFFER`/`CAUTIOUS_SPECULATIVE` 쪽으로 더 자주 분기될 수 있다는 정도만 참고하면 된다.

---

## 9. 요청 예시 (fetch 기반, 의사코드)

```ts
const res = await fetch(`/v1/sessions/${sessionId}/messages`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(), // 선택, 재시도 시 동일 키 재사용하면 안 됨(1시간 내 409)
  },
  body: JSON.stringify({ content: '오늘 너무 힘들었어' }),
});

// 검증 실패 시 여기서 바로 JSON 에러 (res.headers.get("content-type")가 application/json)
if (res.headers.get('content-type')?.includes('application/json')) {
  const err = await res.json(); // ErrorResponse
  // ...
} else {
  // text/event-stream — ReadableStream을 직접 파싱하거나 SSE 파서 라이브러리 사용
  const reader = res.body.getReader();
  // event: / data: 라인을 파싱해 누적 버퍼 처리
}
```
