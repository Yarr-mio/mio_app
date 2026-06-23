# 채팅 — 백엔드 협의 없이 진행 가능한 프론트 작업

> 배경: [CHAT_SERVER_GAP_ANALYSIS.md](./CHAT_SERVER_GAP_ANALYSIS.md)에서 백엔드 응답을 기다릴 필요 없는 항목만 추려 작업 순서로 정리. 백엔드 응답이 필요한 항목은 [CHAT_BACKEND_QUESTIONS.md](./CHAT_BACKEND_QUESTIONS.md) 참고, 이미 합의된 방향은 GAP_ANALYSIS.md §0-1 참고.
> 작성일: 2026-06-23

## 작업 목록 (권장 순서)

### 1. 메시지 ID 체계 재설계 — [GAP 1-1](./CHAT_SERVER_GAP_ANALYSIS.md#1-1-session_meta의-message_id-오용--delta가-영원히-붙지-않음)

- 대상: `chatStore.ts`, `useChatSse.ts`
- `session_meta.message_id`(사용자 메시지 id)와 `delta.msg_id`(AI 메시지 id)를 분리 추적. `session_meta` 수신 시 빈 AI 메시지를 임시 placeholder로 만들고, 최초 `delta` 수신 시 그 `msg_id`로 메시지 id를 확정하도록 구조 변경.

### 2. `delta.replace` 핸들러 추가 — [GAP 1-4](./CHAT_SERVER_GAP_ANALYSIS.md#1-4-deltareplace-이벤트-자체가-구현되어-있지-않음), [1-5](./CHAT_SERVER_GAP_ANALYSIS.md#1-5-donefinished_reason-타입-불일치)

- `types/chat.ts`: `DeltaReplaceData` 타입 추가, `finished_reason`에 `'replaced_by_guard'` 추가
- `chatStore.ts`: append가 아닌 통째로 덮어쓰는 `replaceMessageContent(msgId, content)` 액션 추가
- `useChatSse.ts`: `event: delta.replace` 분기 처리

### 3. 위기(crisis) 처리 정리 — [GAP 1-3](./CHAT_SERVER_GAP_ANALYSIS.md#1-3-crisis-이벤트의-resources-null-크래시), [1-6](./CHAT_SERVER_GAP_ANALYSIS.md#1-6-donefinished_reason-만-보고-위기-ui를-결정함), [5-1](./CHAT_SERVER_GAP_ANALYSIS.md#5-1-crisis_flow-시-프론트가-바로-세션을-종료시킴)

- `crisis.resources?.hotlines` 옵셔널 체이닝으로 null 크래시 방지
- `handleDone`에서 `is_crisis_flagged && finished_reason === 'replaced_by_guard'`(= `crisis` 이벤트 없이 온 위기)인 경우, 하드코딩된 fallback 안내(109 / 1577-0199, severity 1 수준 톤)를 직접 메시지로 추가
- `finished_reason === 'crisis_flow'`일 때 호출하던 `store.endSession()` 제거 — 서버는 세션을 종료하지 않으므로 대화 계속 가능하게 둠

### 4. `emotion_score` optional 처리 — [GAP 1-2](./CHAT_SERVER_GAP_ANALYSIS.md#1-2-emotion_score-undefined-체크-누락)

- 타입을 `emotion_score?: number`로, 체크를 `typeof data.emotion_score === 'number'`로 변경

### 5. `GET /sessions/active` 응답 모델 교체 — [GAP 2-1](./CHAT_SERVER_GAP_ANALYSIS.md#2-1-getsessionsactive-응답-모델-전체가-다름)

- `ActiveSessionResponse`를 실제 서버 구조(필드 전부 nullable + `last_summary_status`/`last_ended_session_id` 추가)로 교체
- `fetchActiveSession()`이 항상 객체를 반환하도록 수정, 호출부(`chat/index.tsx`)는 `session_id` 존재 여부로 분기

### 6. `summary_status` 전체 케이스 처리 — [GAP 2-2](./CHAT_SERVER_GAP_ANALYSIS.md#2-2-summary_status-enum-값-누락)

- 타입에 `'viewed' | 'failed'` 추가
- `failed`: 무한 로딩 스피너 대신 실패 안내 + 재조회(재시도) 버튼 표시
- `viewed`: `done`과 동일하게 요약 표시 (재방문 케이스)

### 7. 세션 요약 화면 단순화 — [GAP 3-1](./CHAT_SERVER_GAP_ANALYSIS.md#3-1-세션-요약-구조-전체가-다름-가장-큰-차이)

- `fetchSessionSummary(sessionId)` API 함수 + `useSessionSummary` 폴링 훅 추가 (`pending`이면 `refetchInterval`, `done`/`failed`/`viewed`면 멈춤)
- `SessionSummary.tsx`: `keyPoints`/`newThoughts` 카드 제거, 자유텍스트 `summary` 카드로 교체
- "주요 감정" 카드: `avg_emotion_score`(0~100)를 표시하고, 변화율은 `last_ended_session_id`로 직전 세션 요약을 조회해 클라이언트에서 자체 계산
- ⚠️ **확인 필요**: `bias_types_detected`(인지왜곡 감지 여부)와 `cbt_intervened`(CBT 개입 여부)를 이번에 화면에 새로 노출할지, 일단 숨길지 미정이야 — 어떻게 할까?

### 8. "기록 저장하기" 버튼 단순화 — [GAP 3-4](./CHAT_SERVER_GAP_ANALYSIS.md#3-4-기록-저장하기-버튼에-대응하는-api가-없다)

- 대응하는 백엔드 API가 없으므로 `useSaveChatSession` mutation 제거, 버튼 핸들러를 `router.push('/(main)/chat/end')` 단순 네비게이션으로 교체

### 9. EmotionScorePanel 임시 동작 변경 (결정: 점수 버리고 패널만 닫음)

- `confirmEmotionScore()`에서 후속 mock 트리거 제거, `deactivateEmotionScoring()`만 호출
- 실제 제출 API는 백엔드 응답 대기 중이므로 `// TODO: 백엔드 emotion-score 제출 엔드포인트 추가되면 연동` 주석으로 남김

### 10. 세션 시작 실패 에러 분기 처리 (결정: 에러별 분기)

- `POST /v1/sessions` 실패 시: `ONBOARDING_REQUIRED` → 온보딩 플로우로 안내, `SESSION_ALREADY_ACTIVE` → 활성 세션 재조회 후 `ChatMain`으로 재진입, 그 외 → 공통 에러 토스트

### 11. 실제 fetch + SSE 파싱 / 인증 / 에러·타임아웃 처리 — [GAP 4](./CHAT_SERVER_GAP_ANALYSIS.md#4-누락된-구현-현재-전부-mock)

- `useChatSse.ts`의 `setTimeout`/`setInterval` mock 제거 → 실제 `fetch(POST .../messages, { Accept: 'text/event-stream', Idempotency-Key })` + `ReadableStream` 파싱 (이미 작성된 `parseSSELine()` 활용)
- `Authorization: Bearer` 헤더 직접 주입 (axios 인터셉터 재사용 불가, 토큰 저장소에서 직접 읽기)
- `Idempotency-Key`: 메시지 전송마다 `crypto.randomUUID()`로 새로 발급
- 동기 검증 실패 시 JSON 에러 처리 (`429`/`409`/`404`/`403`/`410`/`400`) — `content-type` 헤더로 JSON/스트림 분기
- 60초 타임아웃 또는 `done` 없이 스트림 종료 시 일반 에러로 처리
- `AbortController` 연결 (화면 이탈/언마운트 시 진행 중인 스트림 정리)
- 세션 시작/종료 REST 실제 호출로 교체 (`src/api/endpoints/chat.ts`)

---

## 보류 / 이번 범위 제외

| 항목                                                                                                                            | 이유                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| "오늘의 적절 행동" Todo 연동 ([GAP 3-5](./CHAT_SERVER_GAP_ANALYSIS.md#3-5-오늘의-적절행동은-summary-응답이-아니라-todo-도메인)) | 세션 종료 직후 Todo 생성이 비동기라 summary와 동시 준비를 보장 못 함 — 별도 작업으로 분리 |
| `ChatHeader`의 socratic 테스트용 임시 "테스트" 버튼                                                                             | 백엔드 식별 필드 추가 전까지 흐름 테스트용으로 그대로 유지                                |

## 백엔드 응답 대기 중 (이 작업에서 손대지 않음)

- 감정 점수 실제 제출(PATCH) 연동 — [BACKEND_QUESTIONS §6](./CHAT_BACKEND_QUESTIONS.md#6-감정-점수-제출-엔드포인트-신규-요청)
- socratic 식별 실제 반영 — [BACKEND_QUESTIONS §7](./CHAT_BACKEND_QUESTIONS.md#7-socratic소크라테스식-질문-식별-필드-추가-요청)
- 세션 요약 구조화 필드 반영 — [BACKEND_QUESTIONS §8](./CHAT_BACKEND_QUESTIONS.md#8-세션-요약-구조화-필드-추가-요청)
- CAUTIOUS_SPECULATIVE `crisis` 이벤트 백엔드 수정 — [BACKEND_QUESTIONS §5](./CHAT_BACKEND_QUESTIONS.md#5-cautious_speculative-경로--출력단계-위기-재분류-시-crisis-이벤트-누락-수정-요청) (수정되면 3번 항목의 fallback 로직은 보조 안전망으로만 남김)
