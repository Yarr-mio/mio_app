# 채팅 — 백엔드 수정사항 반영 후속 프론트엔드 작업 계획

> 작성일: 2026-06-24
> 배경: [CHAT_BACKEND_QUESTIONS_NOTION.md](./CHAT_BACKEND_QUESTIONS_NOTION.md)/[CHAT_BACKEND_QUESTIONS.md](./CHAT_BACKEND_QUESTIONS.md)로 문의한 8건 + [chat-trouble-shoot/02-sse-streaming-not-incremental.md](./chat-trouble-shoot/02-sse-streaming-not-incremental.md)로 보고한 SSE 버퍼링 문제에 대해, 백엔드 팀이 실제로 무엇을 고쳤는지가 [chat-trouble-shoot/03-backend-fixes-applied.md](./chat-trouble-shoot/03-backend-fixes-applied.md)에 정리되어 있다. 이 문서는 그 결과를 토대로 **프론트가 추가로 할 수 있는 작업**을 정리한 것.
> 현재 코드 기준(이슈 #21, `chat-impl/01~11` 전부 완료된 상태)으로 점검했으며, 실제 파일 경로/줄 번호를 인용했다.

---

## 한눈에 보기

| #   | 백엔드 수정 항목 (03-backend-fixes-applied.md 기준)      | 상태 | 프론트 대응                                                                                                 |
| --- | -------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| 1   | SSE nginx 버퍼링 수정                                    | ✅   | [1-1](#1-1-sse-스트리밍-재검증--진단-로그-제거) 실기기 재검증 + 진단 로그 제거                              |
| 2   | PolicyEngine 순위4/5 — 버그 아님                         | ⚪   | 대응 불필요 (백엔드 전용)                                                                                   |
| 3   | PolicyEngine 순위9 — 미해결                              | ⚪   | 대응 불필요 (백엔드 전용, 모니터링만)                                                                       |
| 4   | `messages.is_crisis_flagged` 부분 수정(ASSISTANT만)      | 🟡   | [3-3](#3-3-messagesis_crisis_flagged-user-행-미반영) 현재 미사용 — 메모만                                   |
| 5   | BUFFER severity 정상화                                   | ✅   | [1-2](#1-2-cautious_speculative-위기-안전망-재검토--buffer-회귀-테스트) 회귀 테스트만                       |
| 6   | CAUTIOUS_SPECULATIVE `crisis` 이벤트 정상화              | ✅   | [1-2](#1-2-cautious_speculative-위기-안전망-재검토--buffer-회귀-테스트) 안전망 재검토 + OPEN_ISSUES #1 갱신 |
| 7   | 감정 점수 제출 엔드포인트(세션 단위·종료 후) 신규        | 🟡   | [2-1](#2-1-감정-점수-제출-흐름-재설계-결정-필요) **결정 필요** — 현재 UI 가정과 스펙 불일치                 |
| 8   | `is_socratic` 필드 신규(물음표 포함 여부로 판정)         | 🟡   | [2-2](#2-2-is_socratic-실연동-여부-결정-필요) **결정 필요** — 오탐 위험으로 연동 보류 권장                  |
| 9   | `key_thoughts`/`socratic_count` 스키마만 추가, 항상 null | 🔴   | [3-1](#3-1-key_thoughtssocratic_count) 대응 불가 — 보류                                                     |

범례: ✅ 코드/문서만 정리하면 끝 · 🟡 결정 또는 추가 확인 필요 · 🔴 백엔드 미완성으로 보류 · ⚪ 백엔드 전용, FE 행동 없음

---

## 1. 즉시 적용 가능 (결정 불필요)

### 1-1. SSE 스트리밍 재검증 + 진단 로그 제거

- **근거**: `03-backend-fixes-applied.md` §1 — "이 정리는 코드 diff 기준이며, 실기기에서 `reader.read()` 타이밍을 다시 캡처해 재현 확인은 하지 않았다... 배포 후 실측 재확인을 한 뒤에 제거하는 것을 권장."
- **대상 파일**: [src/features/chat/hooks/useChatSse.ts](../src/features/chat/hooks/useChatSse.ts) — `★` 표시된 5곳(`sendStartedAtRef`, `handleSessionMeta`/`handleDelta`의 `console.log`, `consumeStream`의 `chunk #N` 로그, `performSendMessage`의 응답 헤더 로그).
- **작업**:
  1. `EXPO_PUBLIC_USE_MOCK=false` + `EXPO_PUBLIC_API_BASE_URL=https://mio.io.kr`로 실기기에서 메시지를 보내, [02-findings-sse-frontend-delivery.md](./chat-trouble-shoot/02-findings-sse-frontend-delivery.md)와 동일한 방식으로 `read()` 호출 횟수·타이밍·`transfer-encoding` 헤더를 재캡처.
  2. `read()`가 여러 번 분산되고 `transfer-encoding: chunked`로 바뀌었으면 수정 확정 → `★` 로그 전부 제거하는 별도 커밋(`chore`).
  3. 만약 여전히 한 번에 몰려서 도착하면(`Identity` 유지) — 백엔드에 재문의, 로그는 유지.

### 1-2. CAUTIOUS_SPECULATIVE 위기 안전망 재검토 + BUFFER 회귀 테스트

- **근거**: `03-backend-fixes-applied.md` §6 — 이제 CAUTIOUS_SPECULATIVE 위기 재분류도 `finished_reason="crisis_flow"` + `crisis` 이벤트로 온다. "`replaced_by_guard`는 위기가 아닌 REWRITE/REPLACE 케이스에만 쓰인다."
- **현재 코드**: [useChatSse.ts:142-164](../src/features/chat/hooks/useChatSse.ts) — `handleDone`이 `is_crisis_flagged && finished_reason === 'replaced_by_guard'`일 때 `handleCrisisFallback()`(핫라인 번호 없는 하드코딩 문구)을 띄우는 분기가 있음. 이 분기는 **백엔드 수정 전, `crisis` 이벤트 없이 위기 재분류되던 경로**를 막기 위한 안전망이었음.
- **수정이 아니라 검증 작업**: 코드 변경은 필요 없음(이미 옵셔널 체이닝·severity 무관 렌더링 구조). 다음을 실기기로 확인:
  1. 키워드로는 안 잡히지만 위험한 표현(예: "다들 내가 없어도 잘 지낼 것 같아")으로 CAUTIOUS_SPECULATIVE 위기 재분류를 재현 → `crisis` 이벤트 + 핫라인이 정상 수신되는지 확인.
  2. HIGH 위험 입력(BUFFER 경로)으로 출력 위기 재분류를 재현 → severity 2/3(핫라인 포함)이 실제로 나오는지 확인.
  3. 둘 다 확인되면 `handleCrisisFallback`/`is_crisis_flagged && finished_reason === 'replaced_by_guard'` 분기는 **이론상 도달 불가능한 안전망**이 된 것 — 코드는 삭제하지 말고 주석만 "현재는 백엔드 수정으로 도달하지 않아야 하는 방어 코드"로 갱신 권장(혹시 모를 백엔드 회귀 대비).
  4. [chat-impl/OPEN_ISSUES.md](./chat-impl/OPEN_ISSUES.md) #1("위기 fallback 핫라인 번호 포함 여부")을 "사실상 해소 — `crisis` 이벤트가 정상 도착하므로 fallback 자체가 안전망으로만 남음"으로 갱신.

### 1-3. 문서 동기화

`03-backend-fixes-applied.md`의 "갱신이 필요한 기존 문서" 섹션을 그대로 반영:

- [SSE_SPEC.md](./SSE_SPEC.md) §5 `DoneData`에 `is_socratic: boolean` 추가, §7 gotcha의 "CAUTIOUS_SPECULATIVE 재분류 시 `crisis` 이벤트 누락" 설명 제거/수정.
- [CHAT_SESSION_FLOW.md](./CHAT_SESSION_FLOW.md) §6-2, §9의 "BUFFER severity 항상 1" / "`is_crisis_flagged` 항상 false" 설명을 부분 수정 반영(ASSISTANT 행만 반영됨 등).
- [API_SPEC.md](./API_SPEC.md) §9에 `POST /v1/sessions/{sessionId}/emotion-score` 엔드포인트, `SessionSummaryResponse.key_thoughts`/`socratic_count` 필드 추가.

### 1-4. `is_socratic` 타입 추가 (연동은 2-2에서 별도 결정)

- [src/types/chat.ts:44-51](../src/types/chat.ts) `SseDoneData`에 `is_socratic: boolean;` 필드를 추가하고, 기존 `// TODO: 소크라테스 질문 식별 필드 백엔드 확인 필요` 주석을 제거. 타입만 추가하고 실제 분기 연동은 하지 않음(2-2 참고).

---

## 2. 결정이 필요한 사항

### 2-1. 감정 점수 제출 흐름 재설계 (결정 필요)

- **문제**: 신규 엔드포인트 `POST /v1/sessions/{sessionId}/emotion-score`는 **세션 단위**(메시지 단위 아님) + **세션이 이미 종료된 상태에서만** 호출 가능(`409 SESSION_NOT_ENDED`). 반면 현재 `EmotionScorePanel`은 **대화가 진행 중일 때**(소크라테스 질문 응답 직후, [useChatSse.ts:77-79](../src/features/chat/hooks/useChatSse.ts)) 슬라이더를 띄우고, `confirmEmotionScore`([useChatSse.ts:87-90](../src/features/chat/hooks/useChatSse.ts))는 현재 TODO로 점수를 그냥 버린다.
- **후보안**:
  - **A) 제출 시점만 미루기**: 슬라이더 UI/타이밍은 그대로 두고, `confirmEmotionScore`에서 점수를 버리지 않고 `chatStore`에 보관(예: `lastConfirmedEmotionScore`). `useEndChatSession`의 `onSuccess`([useChat.ts:69-77](../src/features/chat/hooks/useChat.ts), `endSession` REST 성공 후)에서 보관된 점수가 있으면 그제서야 `POST .../emotion-score` 호출. UI 변경 최소화.
  - **B) 요약 화면으로 이동**: 대화 중 슬라이더를 없애고, `SessionSummary.tsx`에 "AI가 측정한 감정 점수는 OO점이에요, 다르게 느꼈다면 조정해 주세요" 형태의 1회성 보정 UI를 추가해 그 화면에서 제출. 백엔드 설계 의도("메시지 id가 없으므로 세션 전체에 대한 사용자 보정 점수 1개만 저장 — 요약 화면에서 한 번 보정하는 용도로 설계된 것으로 보임", `03-backend-fixes-applied.md` §7)와 가장 부합.
- **권장**: B. 백엔드가 메시지 단위가 아닌 세션 단위로 설계한 의도와 화면 흐름이 정확히 일치하고, A처럼 "세션 종료" 타이밍에 맞춰 비동기로 점수를 늦게 제출하는 레이스 컨디션을 피할 수 있다. 다만 기존 "소크라테스 질문 직후 감정 점수 입력" UX 자체를 없애는 결정이라 기획 확인이 필요하다.
- **추가로 확인 필요(백엔드 재문의 후보)**: `EmotionScoreResponse`에 `emotion_score_ai`가 포함되지만, 이를 읽기 위한 **GET 경로가 없고 `POST`만 존재**하며 `score`가 요청 바디 필수값이다. 즉 사용자가 점수를 제출하지 않으면 `emotion_score_ai` 값을 조회할 방법이 보이지 않는다. `SessionSummaryResponse.avg_emotion_score`(기존 필드, 메시지별 키워드 점수 평균으로 추정)와 `sessions.emotion_score_ai`(신규, `ExtractorLLM` 기반)가 서로 다른 산출 방식의 별개 값으로 보이는데, 두 값을 UI에서 어떻게 같이 쓸지(또는 `avg_emotion_score`만 계속 쓰고 `emotion_score_ai`는 제출 응답 확인용으로만 쓸지) 정리가 필요하다.

### 2-2. `is_socratic` 실연동 여부 (결정 필요 — 연동 보류 권장)

- **문제**: 백엔드의 `is_socratic` 판정이 "AI 응답에 물음표가 하나라도 있는지"로 단순화되어 있다(`03-backend-fixes-applied.md` §8). "오늘 기분은 좀 어떠세요?" 같은 일반적인 안부 질문에도 `true`가 찍힐 수 있어, 의도("이 응답은 CBT 소크라테스식 질문 개입이다")보다 훨씬 넓게(오탐 포함) 잡힌다.
- **왜 위험한가**: 현재 `sendMessage`([useChatSse.ts:62-85](../src/features/chat/hooks/useChatSse.ts))는 "직전 AI 메시지가 `socratic` 타입이면, 사용자의 다음 메시지는 실제 SSE 호출 없이 곧바로 `EmotionScorePanel`을 띄운다"는 분기를 가지고 있다. `is_socratic`을 그대로 메시지 타입에 연동하면, 단순 안부 질문 뒤에 사용자가 무슨 말을 해도 AI가 실제로 응답하지 않고 감정 패널만 뜨는 회귀가 생길 수 있다 — 일반 대화 흐름이 광범위하게 깨질 위험.
- **후보안**:
  - **A) 연동 보류**: `is_socratic` 필드는 타입만 추가(1-4)하고 실제 분기에는 연결하지 않음. `ChatHeader.tsx`의 `TestSocraticFlowButton`([ChatHeader.tsx:13-36](../src/features/chat/components/ChatHeader.tsx))으로 흐름 검증을 계속 유지.
  - **B) 표시만 분리해서 일부 연동**: `is_socratic`은 `MessageBubble`의 라벨/스타일(`SocraticBubble`)에만 반영하고, "다음 입력 가로채기"(`isSocraticReply` → 감정 패널 강제 노출) 로직은 별도의 더 신뢰도 높은 신호가 추가되기 전까지 분리해서 막아둔다.
- **권장**: A. 백엔드 판정 방식이 의도와 명확히 다르다는 게 확인됐으므로, 지금 연동하면 득보다 실이 크다. `CHAT_BACKEND_QUESTIONS_NOTION.md`에 "실제 개입 타입 추적(`WorkingMemory.socratic_count`)과 연결해 달라"는 요청을 다시 전달한 뒤 연동하는 게 안전하다.

> **결정 변경 (2026-06-24)**: 백엔드가 위 판정 로직 자체를 수정해주기로 확인됨에 따라, "연동 보류" 결정을 철회하고 실연동을 진행하기로 함. 상세 계획은 [chat-trouble-shoot/04-socratic-emotion-slider-plan.md](./chat-trouble-shoot/04-socratic-emotion-slider-plan.md) 참고.

---

## 3. 보류 (백엔드 미완성/추가 확인 필요 — 지금 작업하지 않음)

### 3-1. `key_thoughts`/`socratic_count`

`SessionSummaryResponse`에 필드는 추가됐지만 채우는 로직이 없어 항상 `null`(`03-backend-fixes-applied.md` §9). 지금 UI를 만들면 항상 빈 값만 받으므로 보류. 값이 채워지면 `SessionSummary.tsx`에 핵심 생각 리스트 카드를 추가하는 후속 작업으로 분리.

### 3-2. `emotion_score_ai` 조회 경로 불명

2-1에서 언급한 대로 GET 경로 부재 — 백엔드 재확인 필요. 2-1 결정과 함께 정리.

### 3-3. `messages.is_crisis_flagged` USER 행 미반영

ASSISTANT 메시지 행에만 실제 값이 반영되고 USER 행은 항상 `false`(`03-backend-fixes-applied.md` §4). 현재 프론트는 이 컬럼을 직접 조회하는 API가 없어(메시지 히스토리 API 미존재) 당장 영향 없음 — 향후 메시지 히스토리 API가 추가되면 "USER 메시지는 절대 true가 될 수 없다"는 제약을 기억해야 함.

### 3-4. PolicyEngine 순위9 (FE 영향 없음)

`repetitiveNegative`/`emotionSpike` 단독 신호 분기가 여전히 도달 불가능할 가능성이 남아있음(`03-backend-fixes-applied.md` §3). 순수 백엔드 결정론 로직 이슈라 프론트 행동 없음 — SSE 이벤트 시퀀스 자체에는 영향 없으므로 모니터링만.

---

## 4. 기존 OPEN_ISSUES.md 현황 갱신

| #   | 이슈                                | 이전 상태 | 이번 점검 후                                                                                              |
| --- | ----------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| 1   | 위기 fallback 핫라인 번호 포함 여부 | 🟡 보류   | 실기기 재검증 후 닫기 권장 — [1-2](#1-2-cautious_speculative-위기-안전망-재검토--buffer-회귀-테스트) 참고 |
| 2   | `summary_status` viewed 전환 시점   | 🟡 보류   | 변화 없음 — 이번 백엔드 수정과 무관                                                                       |
| 3   | `bias_types_detected` 포맷          | 🟡 보류   | 변화 없음 — 이번 백엔드 수정과 무관                                                                       |
| 4   | 위기 후 지속 대화 안내 배너         | 🟡 보류   | 변화 없음 — 결정되면 별도 커밋                                                                            |
| 5   | 메시지 전송 실패 재전송 버튼        | 🟡 보류   | 변화 없음 — 결정되면 별도 커밋                                                                            |

---

## 5. 권장 작업 순서

| 순서 | 작업                                                              | 종류      |
| ---- | ----------------------------------------------------------------- | --------- |
| 1    | SSE 스트리밍 재검증 (실기기)                                      | QA        |
| 2    | CAUTIOUS_SPECULATIVE/BUFFER 위기 회귀 테스트 (실기기)             | QA        |
| 3    | 1·2 검증 결과로 `useChatSse.ts` 진단 로그 제거 + 안전망 주석 갱신 | chore     |
| 4    | 문서 동기화 (SSE_SPEC/API_SPEC/CHAT_SESSION_FLOW)                 | docs      |
| 5    | `is_socratic` 타입 추가 (연동 제외)                               | fix       |
| 6    | (기획 확인) 감정 점수 제출 흐름 A/B 결정                          | 결정 필요 |
| 7    | 6번 결정 후 구현 (엔드포인트 연동)                                | feature   |
| 8    | (기획 확인) `is_socratic` 연동 여부 결정 — A(보류) 권장           | 결정 필요 |
| 9    | OPEN_ISSUES.md 갱신 반영                                          | docs      |
