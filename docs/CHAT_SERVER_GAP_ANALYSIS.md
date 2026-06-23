# 채팅 — 프론트엔드 구현 vs 서버 스펙 갭 분석

> 비교 대상: [API_SPEC.md](./API_SPEC.md) §9, [SSE_SPEC.md](./SSE_SPEC.md), [CHAT_SESSION_FLOW.md](./CHAT_SESSION_FLOW.md) (서버) ↔ [CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md) + 실제 소스 (프론트엔드, mock 기반).
> 목적: mock을 떼고 실서버에 연동할 때 **무엇이 그대로 깨지는지**, **어떤 화면/타입을 다시 설계해야 하는지**를 정리한다.

---

## 0. 한눈에 보기

| 심각도          | 항목                                                                     | 한 줄 요약                                                                                                       |
| --------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| 🔴 치명적       | [1-1](#1-1-session_meta의-message_id-오용--delta가-영원히-붙지-않음)     | `session_meta.message_id`(사용자 메시지 id)를 AI 메시지 id로 잘못 사용 → 실서버 연동 시 AI 답변이 화면에 안 붙음 |
| 🔴 치명적       | [1-2](#1-2-emotion_score-undefined-체크-누락)                            | `emotion_score !== null` 체크가 필드 누락(`undefined`)을 못 걸러냄                                               |
| 🔴 치명적       | [1-3](#1-3-crisis-이벤트의-resources-null-크래시)                        | `crisis.resources`가 `null`일 수 있는데 `.hotlines` 바로 접근 → 런타임 크래시                                    |
| 🔴 치명적       | [1-4](#1-4-deltareplace-이벤트-자체가-구현되어-있지-않음)                | `delta.replace` 이벤트(전체 교체) 타입·핸들러 자체가 없음                                                        |
| 🟠 높음         | [1-5](#1-5-donefinished_reason-타입-불일치)                              | `finished_reason` 타입에 실제 서버 값 `"replaced_by_guard"` 누락                                                 |
| 🟠 높음         | [1-6](#1-6-donefinished_reason-만-보고-위기-ui를-결정함)                 | 위기 UI 노출 조건이 `crisis` 이벤트 수신 여부라서, 핫라인 없이 위기로 재분류되는 경로를 놓침                     |
| 🟠 높음         | [2-1](#2-1-getsessionsactive-응답-모델-전체가-다름)                      | `GET /sessions/active` 응답을 "세션 없으면 `null`"로 가정 — 실제는 항상 객체, 필드가 `null`                      |
| 🔴 치명적(설계) | [3-1](#3-1-세션-요약-구조-전체가-다름-가장-큰-차이)                      | 세션 요약 화면이 가정하는 구조(`keyPoints`/`newThoughts`/`intensity`/`percentChange`)는 서버에 **존재하지 않음** |
| 🟠 높음         | [3-2](#3-2-감정-점수-제출-엔드포인트는-존재하지-않는다)                  | `EmotionScorePanel`이 가정하는 "점수 제출 API"는 스펙에 없음 — `emotion_score`는 서버→클라 단방향 신호           |
| 🟠 높음         | [3-3](#3-3-소크라테스-질문-식별-필드는-서버에-존재하지-않고-계획도-없음) | "소크라테스 질문" 말풍선 타입을 식별할 필드가 서버에 없고, 서버 설계상 추가될 계획도 보이지 않음                 |
| 🟡 중간         | [3-4](#3-4-기록-저장하기-버튼에-대응하는-api가-없다)                     | "기록 저장하기"는 대응하는 백엔드 API가 없음 (종료 시 자동 처리됨)                                               |
| 🟡 중간         | [3-5](#3-5-오늘의-적절행동은-summary-응답이-아니라-todo-도메인)          | 추천 행동(Chip)은 요약 API가 아니라 별도 Todo API의 책임                                                         |
| 🟡 중간         | [4](#4-누락된-구현-현재-전부-mock)                                       | 실제 fetch+SSE 파싱, 에러 응답 처리, 타임아웃, Idempotency-Key, 인증 헤더 전부 미구현                            |
| 🟢 검토 필요    | [5-1](#5-1-crisis_flow-시-프론트가-바로-세션을-종료시킴)                 | `crisis_flow` 수신 시 프론트가 즉시 `endSession()` 처리 — 서버는 세션을 자동 종료하지 않음                       |

---

## 0-1. 결정 사항 (2026-06-22 점검)

"기획 확인 필요" 항목들과 추가로 발견된 이슈에 대해 방향을 결정함. **백엔드 팀 확인/요청이 필요한 항목은 전부 [CHAT_BACKEND_QUESTIONS.md](./CHAT_BACKEND_QUESTIONS.md) 한 곳으로 분리**했고 (감정 점수 제출 API, socratic 식별 필드, 세션 요약 구조화 필드, PolicyEngine 모순 의심 등 8건), 아래 표는 **프론트에서 바로 적용할 결정**만 남김.

| 항목                                                                                      | 결정                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [5-1](#5-1-crisis_flow-시-프론트가-바로-세션을-종료시킴) `crisis_flow` 시 세션 처리       | 서버 설계대로 유지(세션 active 유지, 대화 계속 가능). 프론트의 `endSession()` 호출 제거 필요                                                        |
| [1-6](#1-6-donefinished_reason-만-보고-위기-ui를-결정함) CAUTIOUS_SPECULATIVE 핫라인 누락 | 근본 수정은 백엔드에 요청(`CHAT_BACKEND_QUESTIONS.md` §5)했고, 답변 오기 전까지 프론트에도 `is_crisis_flagged` 기반 fallback 안내문구를 임시로 추가 |
| [3-1](#3-1-세션-요약-구조-전체가-다름-가장-큰-차이) 세션 요약 구조                        | 구조화 필드는 백엔드에 요청(`CHAT_BACKEND_QUESTIONS.md` §8)했고, 응답 오기 전까지는 자유텍스트 `summary` 카드로 단순화                              |
| 주요 감정 카드 `percentChange`                                                            | 서버에 변화율 데이터 없음 → 프론트에서 직전 세션 `avg_emotion_score`를 별도 조회해 자체 계산 (`last_ended_session_id` → `GET .../summary`)          |
| `summary_status === "failed"` 처리                                                        | 로딩 스피너 무한 대기 대신 실패 안내 메시지 + 재조회(재시도) 버튼 표시                                                                              |

---

## 1. SSE 이벤트 처리 — 치명적 버그

### 1-1. `session_meta`의 `message_id` 오용 → delta가 영원히 붙지 않음

**서버 스펙** (SSE_SPEC.md §4): 한 번의 메시지 전송마다 ID가 **두 개** 발급된다.

| ID              | 실리는 이벤트                                         | 의미                     |
| --------------- | ----------------------------------------------------- | ------------------------ |
| `inboundMsgId`  | `session_meta.message_id`                             | **사용자**가 보낸 메시지 |
| `outboundMsgId` | `delta.msg_id`, `delta.replace.msg_id`, `done.msg_id` | **AI 응답** 메시지       |

즉 `session_meta.message_id`와 `delta.msg_id`는 **서로 다른 값**이다.

**현재 구현** (`src/features/chat/hooks/useChatSse.ts:94-107`):

```typescript
function handleSessionMeta(data: SseSessionMetaData) {
  const aiMsgId = data.message_id;        // ← 사실은 사용자 메시지 id (inboundMsgId)
  store.addMessage({ id: aiMsgId, role: 'ai', type: 'normal', content: '', ... });
  useChatStore.setState({ streamingMessageId: aiMsgId });
}

function handleDelta(data: SseDeltaData) {
  useChatStore.getState().appendDelta(data.msg_id, data.chunk); // ← outboundMsgId로 매칭 시도
}
```

`appendDelta`는 `messages` 배열에서 `msg.id === msgId`인 항목을 찾아 텍스트를 누적한다 (`chatStore.ts:57-62`). 하지만 빈 AI 자리표시 메시지는 `inboundMsgId`로 생성되고, `delta`는 `outboundMsgId`로 들어오기 때문에 **두 id가 절대 일치하지 않는다.** 결과적으로:

- `appendDelta`는 매칭되는 메시지를 못 찾아 아무 일도 하지 않는다.
- 화면에는 내용이 채워지지 않는 빈 AI 말풍선만 영원히 남는다.
- 현재 mock에서는 이 버그가 드러나지 않는데, mock(`runMock`)이 `session_meta`와 `delta` 양쪽에 **동일한 `metaId`**를 일관되게 써서 우연히 맞아떨어지기 때문이다.

**수정 방향**: `session_meta` 수신 시점에는 아직 AI 메시지의 id(`outboundMsgId`)를 모른다. 빈 AI 메시지를 만들 때 임시 id(예: `streamingMessageId`라는 별도 키)로 추적하고, 최초 `delta` 이벤트가 도착했을 때 그 `msg_id`로 메시지의 실제 id를 확정하거나, 처음부터 `streamingMessageId` 자체를 매칭 키로 사용하도록 store 구조를 바꿔야 한다. (`session_meta`는 "사용자 메시지가 접수됐다"는 ack 용도이지 AI 메시지 생성 트리거가 아니라는 점을 명확히 분리할 것.)

---

### 1-2. `emotion_score` undefined 체크 누락

**서버 스펙**: `DoneData.emotion_score?: number` — **선택 필드**다. 가지지 않으면 JSON 키 자체가 생략된다.

**현재 타입** (`src/types/chat.ts:38-44`): `emotion_score: number | null` — 항상 존재하고 nullable이라고 가정.

**현재 핸들러** (`useChatSse.ts:132`):

```typescript
if (data.emotion_score !== null) {
  store.activateEmotionScoring(data.emotion_score);
}
```

JSON에서 키가 생략되면 `data.emotion_score`는 `undefined`다. `undefined !== null`은 **true**이므로, 이 조건은 의도와 반대로 통과해 버리고 `activateEmotionScoring(undefined)`가 호출된다 — 슬라이더 초기값이 `NaN`/`undefined`가 되는 버그.

**수정 방향**: 타입을 `emotion_score?: number`로 바꾸고, 체크도 `typeof data.emotion_score === 'number'`로 변경.

---

### 1-3. `crisis` 이벤트의 `resources` null → 크래시

**서버 스펙** (SSE_SPEC.md §5, §8): `resources: { hotlines: [...] } | null` — severity 1(경미)에서는 `resources`가 통째로 `null`이다.

**현재 구현** (`useChatSse.ts:115-124`):

```typescript
function handleCrisis(data: SseCrisisData) {
  store.addMessage({ ..., crisisResources: data.resources.hotlines }); // resources가 null이면 TypeError
}
```

severity 1 위기 메시지를 받는 순간 `Cannot read properties of null (reading 'hotlines')`로 죽는다.

**수정 방향**: `data.resources?.hotlines` 로 옵셔널 체이닝. `MessageBubble`의 `CrisisBubble`은 이미 `crisisResources`가 없을 때 핫라인 카드를 숨기도록 되어 있어 (`MessageBubble.tsx:88`) 그 부분은 그대로 재사용 가능.

---

### 1-4. `delta.replace` 이벤트 자체가 구현되어 있지 않음

**서버 스펙** (SSE_SPEC.md §5, §6, §7): `CAUTIOUS_SPECULATIVE` 경로에서 스트리밍 중 위반이 감지되면, 지금까지 쌓인 `delta`를 **전부 버리고** `delta.replace.safe_response`로 **통째로 교체**해야 한다. 이 시나리오는 happy path 다음으로 자주 등장하는 정상 분기 중 하나다 (표 6장 참고).

**현재 구현**: `types/chat.ts`에 `SseDeltaData`만 있고 `DeltaReplaceData`/`delta.replace` 핸들러가 전혀 없다. `chatStore`에도 "누적 대신 통째로 교체"하는 액션이 없다 (`appendDelta`만 존재).

**영향**: 실서버 연동 시 출력 검증에 걸리는 모든 응답(보수적 경로)에서 화면에 이상한 텍스트(검증 전 일부 스트리밍 + 교체 누락)가 남는다.

**수정 방향**:

- `types/chat.ts`에 `SseDeltaReplaceData { safe_response: string; msg_id: string }` 추가.
- `chatStore`에 `replaceMessageContent(msgId, content)` 액션 추가 (append 아니라 `content: content`로 덮어쓰기).
- `useChatSse`에 `delta.replace` 핸들러 추가, real SSE 파싱 시 `event: delta.replace` 라인을 분기.

---

### 1-5. `done.finished_reason` 타입 불일치

**서버 스펙**: `"stop" | "security_refusal" | "crisis_flow" | "replaced_by_guard" | "error"` (5종).

**현재 타입** (`types/chat.ts:43`): `'stop' | 'crisis_flow' | 'security_refusal' | 'error'` — **`'replaced_by_guard'` 누락**.

`replaced_by_guard`는 1-4번(`delta.replace`)과 항상 같이 오는 값이라, 두 항목을 같이 고쳐야 한다.

---

### 1-6. `done.finished_reason`만 보고 위기 UI를 결정함

**서버 스펙의 경고** (SSE_SPEC.md §7 gotcha, CHAT_SESSION_FLOW.md §6-2): `is_crisis_flagged=true`인데 `crisis` 이벤트가 안 오는 경로가 실제로 존재한다 (`CAUTIOUS_SPECULATIVE` 모드에서 출력 검증 중 위기로 재분류되는 경우 — `delta.replace` + `done(is_crisis_flagged=true, finished_reason="replaced_by_guard")`만 온다). 스펙은 "위기 UI 노출 여부는 **`crisis` 이벤트 수신이 아니라 `done.is_crisis_flagged`를 기준으로 판단**하라"고 명시하고, `crisis` 이벤트가 없을 때를 대비한 기본 안내 문구/번호를 프론트에 하드코딩해두라고 권장한다.

**현재 구현** (`useChatSse.ts:126-138`): `handleDone`은 `finished_reason === 'crisis_flow'`만 보고 `endSession()`을 호출할 뿐, `is_crisis_flagged`를 아예 참조하지 않는다. 즉 `replaced_by_guard` 경로에서는 위기 상황인데도 **핫라인 안내가 전혀 뜨지 않는다.**

**수정 방향**: `handleDone`에서 `data.is_crisis_flagged && finished_reason === 'replaced_by_guard'`(즉 `crisis` 이벤트가 안 온 위기 케이스)를 감지하면, 프론트에 하드코딩된 기본 핫라인 안내(예: 109/1577-0199, severity 1 수준의 진정 유도 톤)를 직접 메시지로 추가하는 fallback 로직이 필요하다.

---

## 2. REST 응답 타입 불일치

### 2-1. `GET /sessions/active` 응답 모델 전체가 다름

**서버 스펙** (API_SPEC.md §9): 활성 세션이 없어도 HTTP 200 + 객체가 내려오고, 필드가 `null`로 채워진다.

```ts
interface ActiveSessionResponse {
  session_id: string | null;
  character_id: string | null;
  status: SessionStatus | null;
  started_at: string | null;
  last_message_at: string | null;
  message_count: number | null;
  last_summary_status: SummaryStatus | null; // ← FE 타입에 없음
  last_ended_session_id: string | null; // ← FE 타입에 없음
}
```

**현재 구현**:

- `src/types/chat.ts:46-53`의 `ActiveSession`은 `session_id: string`처럼 전부 non-null이고, `last_summary_status`/`last_ended_session_id`가 없다.
- `src/api/endpoints/chat.ts:6-9`의 `fetchActiveSession()`은 "활성 세션 없으면 `null` 자체를 반환"한다고 가정 (`Promise<ActiveSession | null>`).

실제로는 응답이 항상 객체이므로, mock을 떼고 실제 axios 호출로 바꾸는 순간 `data.session_id`가 `null`인 "비활성" 케이스를 `null` 전체 응답으로 오인하던 현재 호출부(`chat/index.tsx:14-18`)의 `if (activeSession)` 분기가 항상 truthy가 되어 **세션이 없는데도 `startSession()`이 호출되는 버그**가 생긴다.

**수정 방향**: `fetchActiveSession()`에서 `data.session_id == null ? null : {...}`로 변환하는 매핑 레이어를 두거나, 타입을 서버 응답 그대로 받고 호출부에서 `session_id` 존재 여부로 분기.

추가로 `last_summary_status`/`last_ended_session_id`는 "사용자가 세션을 종료했지만 요약을 못 보고 앱을 나간 경우" 재진입 시 요약 화면으로 돌려보내기 위한 필드로 보인다 — 현재 `chat/index.tsx`는 이 케이스를 전혀 처리하지 않는다 (활성 세션 없음 → 항상 `SessionStart`로 보냄). 아래 [3-1](#3-1-세션-요약-구조-전체가-다름-가장-큰-차이)과 함께 재진입 플로우를 다시 설계해야 한다.

### 2-2. `summary_status` enum 값 누락

**서버**: `"pending" | "done" | "viewed" | "failed"` (4종).
**FE 타입** (`types/chat.ts:62-68`의 `EndSessionResponse.summary_status`): `'pending' | 'done'`만 존재. `viewed`(이미 본 요약), `failed`(요약 생성 실패) 케이스가 타입/UI 어디에도 없다. 특히 `failed`를 처리하지 않으면 요약 화면이 로딩 스피너에서 영원히 멈춘다.

---

## 3. 백엔드에 대응 기능이 없거나 다른 도메인에 속한 UI

### 3-1. 세션 요약 구조 전체가 다름 (가장 큰 차이)

**서버 스펙** (API_SPEC.md §9 `SessionSummaryResponse`, CHAT_SESSION_FLOW.md §8-2):

```ts
interface SessionSummaryResponse {
  session_id: string;
  summary_status: SummaryStatus;
  ended_at: string;
  duration_seconds: number;
  message_count: number;
  summary: string | null; // LLM이 생성한 300~500자 자유 텍스트 1개
  avg_emotion_score: number | null; // 0~100
  bias_types_detected: string | null; // 감지된 인지왜곡 (문자열)
  cbt_intervened: boolean | null;
}
```

엔드포인트는 `GET /v1/sessions/{sessionId}/summary`이며, 아직 생성 중이면 `202`(`summary_status: "pending"`)를 반환한다 — **폴링 대상**이다.

**현재 FE가 가정하는 구조** (`types/chat.ts:69-82` `ChatSummary`, `SessionSummary.tsx` UI):

```typescript
interface ChatSummary {
  primaryEmotion: { emotionType: EmotionType; intensity: number; percentChange: number };
  keyPoints: string[];
  newThoughts: string[];
  recommendedActions: string[];
}
```

- `keyPoints`(핵심 내용), `newThoughts`(새로운 생각), `primaryEmotion.intensity`/`percentChange` 같은 **구조화된 필드는 서버 응답에 전혀 없다.** 서버는 자유 텍스트 `summary` 문자열 하나와 `avg_emotion_score`(숫자), `bias_types_detected`(문자열 1개), `cbt_intervened`(불린)만 준다.
- `src/features/chat/hooks/useChat.ts:30-39`의 `useEndChatSession`은 이 차이를 mock으로 가리고 있다 — `endSession()` 성공 즉시 위 구조의 **가짜 데이터를 직접 만들어** `chatStore.setSummary()`에 박아 넣는다. 실제 `GET .../summary` 호출 자체가 `src/api/endpoints/chat.ts`에 구현되어 있지 않다.
- `src/api/endpoints/chat.ts`에 `fetchSessionSummary` 함수 자체가 없음 — 새로 추가 필요.

**수정 방향 (UI 재설계 필요)**:

1. `fetchSessionSummary(sessionId)` API 함수 + `useSessionSummary(sessionId)` 쿼리(폴링: `summary_status === 'pending'`이면 `refetchInterval`로 재조회, `done`/`failed`/`viewed`면 멈춤) 추가.
2. `SessionSummary.tsx`의 "핵심 내용"/"새로운 생각" 카드(불릿 리스트)는 데이터 자체가 없으므로 — 자유 텍스트 `summary`를 보여주는 단일 카드로 교체하거나, 기획 측에 "이 구조화된 분석을 더 만들어줄 수 있는지" 확인이 필요하다.
3. "주요 감정" 카드의 `intensity`(10점 만점)·`percentChange`는 `avg_emotion_score`(0~100, 단일 값, 변화율 없음)로는 동일하게 재현 불가 — 척도 변환(0~100→표시용) 및 "변화율" UI 자체를 빼는 결정이 필요하다.
4. `bias_types_detected`(인지왜곡 감지 여부/유형), `cbt_intervened`(CBT 개입 여부)는 현재 UI에 대응하는 자리가 없다 — 새로 추가하거나 의도적으로 숨길지 결정.

### 3-2. 감정 점수 "제출" 엔드포인트는 존재하지 않는다

CHAT_SESSION_FLOW.md §3-1, SSE_SPEC.md §7에 따르면 `emotion_score`는 **서버가 사용자의 직전 메시지를 키워드 매칭으로 분석해 `done` 이벤트에 실어 보내는, 서버 → 클라이언트 단방향 신호**다 (25/45/70 중 하나, 향후 연속값 가능성 언급). API_SPEC.md/SSE_SPEC.md 전체에 "사용자가 조정한 점수를 서버로 되돌려 보내는" 엔드포인트는 **없다.**

**현재 구현**: `EmotionScorePanel`은 사용자가 슬라이더로 점수를 직접 조정하고 "완료"를 누르면 그 값을 제출하는 흐름으로 설계되어 있다 (`docs/CHAT_DESIGN.md` §4, `EmotionScorePanel.tsx`). 실제로 `confirmEmotionScore()`(`useChatSse.ts:64-79`)는 사용자가 조정한 `score`를 그냥 버리고(`void score`) 후속 mock 응답을 한 번 더 트리거하는 것으로 때워져 있다.

**수정 방향**: 이건 mock 코드를 실제 호출로 바꾼다고 해결되는 문제가 아니라, **제출할 서버 엔드포인트 자체가 없다는 전제에서 다시 설계**해야 한다. 가능한 방향:

- (A) `EmotionScorePanel`을 "입력 받는 패널"이 아니라 `done.emotion_score`를 받아서 잠깐 보여주는 **읽기 전용 인디케이터**로 바꾼다 (사용자 액션 없이 자동으로 사라지거나, 다음 메시지 입력으로 자연스럽게 넘어감).
- (B) 정말 사용자가 점수를 보정해서 보내야 하는 기획이라면, 백엔드에 별도 엔드포인트(예: `PATCH /v1/sessions/{id}/messages/{msgId}/emotion-score`) 추가를 요청해야 한다.
  어느 쪽이든 현재처럼 "제출처럼 보이는 UI인데 실제로는 버려지는" 상태로 두면 안 된다.

### 3-3. 소크라테스 질문 식별 필드는 서버에 존재하지 않고, 계획도 보이지 않음

CHAT_SESSION_FLOW.md §3-8, §4를 보면 "소크라테스식 질문"은 `WorkingMemory.socraticCount`로 **세션 내부에서만 카운트되는 서버 내부 상태**이고, 이를 토대로 `InterventionHints`가 시스템 프롬프트에 주입될 뿐, **그 결과가 어떤 SSE 이벤트 필드로도 클라이언트에 노출되지 않는다.** API_SPEC.md/SSE_SPEC.md 어디에도 `message_type`/`is_socratic` 같은 필드가 없고, 추가 예정이라는 언급도 없다.

**현재 구현**: `ChatMessageType`에 `'socratic'`이 있고, `MessageBubble`은 이를 위한 전용 배지/스타일을 가지고 있다 (`MessageBubble.tsx:57-73`). 실제로 이 타입이 채워질 방법이 없어서, `ChatHeader.tsx:12-36`에 **테스트용 버튼**(`TestSocraticFlowButton`)으로 더미 socratic 메시지를 수동 주입해 흐름만 검증하고 있다.

**수정 방향**: 이 기능을 유지하려면 백엔드에 "이 응답이 소크라테스식 질문인지" 알려주는 필드(예: `done`에 `intervention_type` 같은 메타 정보) 추가를 요청해야 한다. 요청이 어렵다면, 클라이언트가 AI 응답 텍스트를 보고 휴리스틱(예: 물음표로 끝나는지)으로 추정하는 임시방편을 쓸 수도 있으나 정확도가 낮다. 현재처럼 "백엔드 확인 필요" TODO와 테스트 버튼만 남겨두면 실제 서비스에서 `socratic` 타입 말풍선은 영원히 사용되지 않는다.

### 3-4. "기록 저장하기" 버튼에 대응하는 API가 없다

CHAT_SESSION_FLOW.md §8-2에 따르면, `POST /v1/sessions/{id}/end`가 성공하면 서버가 **트랜잭션 커밋 후 자동으로** `SessionConsolidator`를 실행해 요약·추출·신념 갱신·Todo 생성까지 전부 처리한다. 즉 "저장"은 이미 `end` 호출 시점에 서버에서 끝난 일이고, 별도로 "저장하기" 액션을 보낼 곳이 없다.

**현재 구현**: `useSaveChatSession()`(`useChat.ts:46-54`)은 `mutationFn: async (_sessionId) => {}` — 아무 일도 하지 않는 빈 함수를 "API 호출"인 것처럼 mutation으로 감싸 놓았다.

**수정 방향**: 실제로 보낼 요청이 없다는 게 확인됐으므로, `useSaveChatSession`을 mutation으로 유지할 이유가 없다. "기록 저장하기" 버튼은 그냥 `router.push('/(main)/chat/end')`만 호출하는 로컬 네비게이션 액션으로 단순화한다 (로딩 스피너도 필요 없어짐).

### 3-5. "오늘의 적절 행동"은 summary 응답이 아니라 Todo 도메인

API_SPEC.md §10, CHAT_SESSION_FLOW.md §8-2 6번에 따르면, 인지왜곡이 감지된 세션은 `TodoRecommendationService`가 **별도로** `POST /v1/todos/generate` 경로를 통해 할 일 3건을 생성한다 (`TodoResponse[]`, 카테고리/난이도/캐릭터 코멘트 포함). 이건 `SessionSummaryResponse`에 포함되지 않는, 완전히 별도의 API(`TodoController`)다.

**현재 구현**: `SessionSummary.tsx`의 "오늘의 작은 행동" 카드가 `summary.recommendedActions: string[]`을 그대로 Chip으로 렌더링한다 (요약 응답의 일부라고 가정).

**수정 방향**: 이 섹션을 보여주려면 `GET /v1/todos?date=...` 또는 세션 종료 후 생성된 Todo 목록을 별도로 조회하는 훅이 필요하다. 인지왜곡이 감지되지 않은 세션에는 Todo가 생성되지 않을 수 있으므로 "추천 행동이 없을 수도 있다"는 빈 상태 처리도 필요하다.

---

## 4. 누락된 구현 (현재 전부 mock)

`useChatSse.ts`는 실제 네트워크 호출이 전혀 없고 `setTimeout`/`setInterval`로 스트리밍을 흉내 낸다. 서버 스펙 기준으로 최소한 다음이 필요하다.

| 항목                                 | 서버 스펙 근거                                                                                                                              | 현재 상태                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 실제 `fetch` + `ReadableStream` 파싱 | SSE_SPEC.md §1 (브라우저 `EventSource`는 GET만 지원하므로 사용 불가, `fetch` 직접 파싱 필요)                                                | `parseSSELine()` 함수는 작성돼 있으나 미사용 (`useChatSse.ts:168`)                                                                                                              |
| `Authorization: Bearer` 헤더         | API_SPEC.md 공통 규칙                                                                                                                       | 요청 자체가 없으므로 미적용. 다른 도메인은 `apiClient`(axios, 인터셉터로 토큰 자동 주입)를 쓰는데, SSE는 axios로 스트림을 못 받으므로 별도 `fetch` 호출에 토큰을 직접 넣어야 함 |
| `Idempotency-Key` 헤더               | SSE_SPEC.md §1, §2 (1시간 내 동일 키 재사용 시 `409`)                                                                                       | 미생성. `crypto.randomUUID()`로 메시지 전송마다 새로 발급해야 함                                                                                                                |
| 동기 검증 실패 시 JSON 에러 처리     | SSE_SPEC.md §2-1 (`429 RATE_LIMITED`, `409 DUPLICATE_REQUEST`, `404`, `403`, `410 GONE`, `400`) — 스트림이 아니라 일반 JSON으로 즉시 응답됨 | 에러 처리 전혀 없음. `res.headers.get('content-type')`로 JSON/스트림 분기 필요 (SSE_SPEC.md §9 예시 참고)                                                                       |
| 60초 타임아웃 / 연결 끊김 처리       | SSE_SPEC.md §2-3,4 (에러 이벤트 없이 스트림만 조용히 종료)                                                                                  | mock은 항상 완료되므로 "done 없이 스트림 종료"를 감지하는 로직이 없음. 실제론 일반 에러로 취급해야 함                                                                           |
| 요청 취소(AbortController)           | — (화면 이탈/언마운트 시 진행 중인 스트림 정리)                                                                                             | `abortRef`는 선언만 되어 있고 실제 `fetch` 호출에 연결되지 않음 (`useChatSse.ts:19,32,169`)                                                                                     |
| 세션 시작/종료 REST 실제 호출        | API_SPEC.md §9                                                                                                                              | `src/api/endpoints/chat.ts` 전부 고정 mock 응답                                                                                                                                 |

---

## 5. 제품/플로우 관점에서 재검토가 필요한 차이

### 5-1. `crisis_flow` 시 프론트가 바로 세션을 종료시킴

**서버 동작**: `CRISIS_FLOW`는 "이번 메시지에 한해 고정 위기 응답 + 핫라인 안내"를 보낼 뿐, **세션 자체를 종료시키지 않는다.** `SafetyProfile`이 무효화돼 이후 메시지가 더 보수적으로 처리될 뿐, 세션은 여전히 `active` 상태로 남고 대화는 계속될 수 있다 (CHAT_SESSION_FLOW.md §6-1, §3-7). 세션 종료는 사용자가 명시적으로 `POST /v1/sessions/{id}/end`를 호출해야만 일어난다.

**현재 구현** (`useChatSse.ts:135-137`):

```typescript
if (data.finished_reason === 'crisis_flow') {
  store.endSession(); // 로컬 상태만 'ended'로 바꿈, 서버엔 end 요청을 보내지 않음
}
```

이건 두 가지 문제를 동시에 만든다:

1. **서버-클라이언트 상태 불일치**: 서버는 세션이 여전히 `active`라고 알고 있는데, 클라이언트는 `ended`로 전환해 버린다. 앱을 재시작하면 `GET /sessions/active`가 여전히 활성 세션을 반환할 텐데, 클라이언트는 이미 "종료됨" 화면 흐름(`SessionEnd` 등)을 거쳤기 때문에 다음 진입 시 어떤 화면을 보여줘야 하는지 애매해진다.
2. **제품 의도 확인 필요**: 위기 상황에서 대화를 강제로 끊는 게 의도된 안전장치인지(예: 사용자를 핫라인으로 유도하고 앱 내 대화는 멈추는 게 안전 정책), 아니면 서버 설계대로 대화를 계속할 수 있게 둬야 하는지 기획 확인이 필요하다. 후자라면 `endSession()` 호출을 제거하고, 위기 메시지를 보여준 뒤 평소처럼 입력바를 다시 활성화해야 한다.

---

## 6. 권장 작업 순서

| 순서 | 작업                                                                                                                                                    | 관련 항목                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1    | `chatStore`/`useChatSse`의 메시지 id 체계 재설계 (inbound/outbound 분리)                                                                                | [1-1](#1-1-session_meta의-message_id-오용--delta가-영원히-붙지-않음)                                                  |
| 2    | `delta.replace` 타입·핸들러·store 액션 추가, `finished_reason` 타입에 `replaced_by_guard` 추가                                                          | [1-4](#1-4-deltareplace-이벤트-자체가-구현되어-있지-않음), [1-5](#1-5-donefinished_reason-타입-불일치)                |
| 3    | `is_crisis_flagged` 기반 fallback 위기 UI + `resources` null 가드                                                                                       | [1-3](#1-3-crisis-이벤트의-resources-null-크래시), [1-6](#1-6-donefinished_reason-만-보고-위기-ui를-결정함)           |
| 4    | `emotion_score` optional 처리                                                                                                                           | [1-2](#1-2-emotion_score-undefined-체크-누락)                                                                         |
| 5    | `fetchActiveSession`/`ActiveSession` 타입을 실제 응답 모델로 교체                                                                                       | [2-1](#2-1-getsessionsactive-응답-모델-전체가-다름)                                                                   |
| 6    | (기획 확인 필요) 세션 요약 화면을 `summary`/`avg_emotion_score`/`bias_types_detected`/`cbt_intervened` 기준으로 재설계 + `GET .../summary` 폴링 훅 추가 | [3-1](#3-1-세션-요약-구조-전체가-다름-가장-큰-차이)                                                                   |
| 7    | (기획 확인 필요) `EmotionScorePanel`을 읽기 전용으로 바꾸거나 백엔드에 제출 API 요청                                                                    | [3-2](#3-2-감정-점수-제출-엔드포인트는-존재하지-않는다)                                                               |
| 8    | (기획 확인 필요) socratic 식별 — 백엔드 필드 요청 또는 기능 보류 결정                                                                                   | [3-3](#3-3-소크라테스-질문-식별-필드는-서버에-존재하지-않고-계획도-없음)                                              |
| 9    | `useSaveChatSession` 단순 네비게이션으로 축소, Todo 연동은 별도 작업으로 분리                                                                           | [3-4](#3-4-기록-저장하기-버튼에-대응하는-api가-없다), [3-5](#3-5-오늘의-적절행동은-summary-응답이-아니라-todo-도메인) |
| 10   | 실제 `fetch`+SSE 파싱, 인증 헤더, Idempotency-Key, 에러/타임아웃 처리 구현                                                                              | [4](#4-누락된-구현-현재-전부-mock)                                                                                    |
| 11   | (기획 확인 필요) `crisis_flow` 수신 시 세션 종료 여부 재결정                                                                                            | [5-1](#5-1-crisis_flow-시-프론트가-바로-세션을-종료시킴)                                                              |
