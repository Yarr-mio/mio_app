# 채팅 — 백엔드 문의/요청 사항

> 작성일: 2026-06-22

## 문의 요약

1. PolicyEngine 순위5(`L0 self-harm flagged인데 L1엔 신호 없음`) 분기 — `moderationFlagged`가 L0 결과를 그대로 복사한 값이라면 이 분기는 영원히 도달 불가능한 죽은 코드인 것 같다. 확인 필요.
2. PolicyEngine 순위9(`Judge 미호출 + repetitiveNegative/emotionSpike`) 분기 — 이 두 신호는 항상 Judge를 강제 호출하게 되어 있어서 순위9도 도달 불가능한 분기인 것 같다. 확인 필요.
3. `messages.is_crisis_flagged` 컬럼이 항상 `false`로 저장되는 것 같다. 의도된 건지 확인 필요.
4. BUFFER 모드는 출력단계 위기 재분류 시 원본 메시지를 안 넘겨서 severity가 항상 1(핫라인 없음)로 고정되는 것 같다. HIGH 위험 입력인데 핫라인이 빠지는 게 맞는지 재검토 필요할 것 같다.
5. CAUTIOUS_SPECULATIVE 모드는 출력단계 위기 재분류 시 `crisisFlowService.handle()`을 안 불러서 `crisis` 이벤트(핫라인)가 전혀 안 나가는 것 같다. BUFFER처럼 호출하도록 수정되어야 할 것 같다.
6. 사용자가 보정한 감정 점수를 서버로 제출할 엔드포인트가 없는 것 같다. 신규 엔드포인트가 추가되어야 할 것 같다.
7. AI 응답이 소크라테스식 질문인지 구분할 필드가 없는 것 같다. `done` 이벤트에 필드가 추가되어야 할 것 같다.
8. 세션 요약이 자유텍스트 하나뿐이라 핵심 내용을 구조화해서 보여줄 수 없는 것 같다. `SessionSummaryResponse`에 필드가 추가되어야 할 것 같다.

---

## 한눈에 보기

| 구분                | #   | 항목                                                              |
| ------------------- | --- | ----------------------------------------------------------------- |
| 🐛 스펙 모순 의심   | 1   | PolicyEngine 순위 4/5 — 순위5가 도달 불가능한 분기로 보임         |
| 🐛 스펙 모순 의심   | 2   | PolicyEngine 순위 9 — Judge 호출 트리거 조건과 충돌               |
| 🐛 동작 확인        | 3   | `messages.is_crisis_flagged` 컬럼이 항상 `false`                  |
| ⚠️ 안전 정책 재검토 | 4   | BUFFER 출력단계 위기 재분류 시 severity 항상 1 고정               |
| 🔧 수정 요청        | 5   | CAUTIOUS_SPECULATIVE 출력단계 위기 재분류 시 `crisis` 이벤트 누락 |
| ✨ 신규 API 요청    | 6   | 감정 점수 제출 엔드포인트                                         |
| ✨ 신규 필드 요청   | 7   | socratic(소크라테스식 질문) 식별 필드                             |
| ✨ 신규 필드 요청   | 8   | 세션 요약 구조화 필드 (key thoughts 등)                           |

---

## 1. PolicyEngine 순위4/5 모순 의심

순위4 "L0 self-harm flagged **그리고** L1 moderationFlagged" → `CRISIS_FLOW`, 순위5 "L0 self-harm flagged인데 L1엔 신호 없음" → `GENERATE`(GUARDED/CAUTIOUS_SPECULATIVE).

`moderationFlagged`는 "L0 모더레이션이 self-harm 계열로 flagged"로 정의되어 있어, L0 결과의 단순 복사로 보입니다. 그렇다면 L0가 flagged인 순간 `moderationFlagged`도 항상 true이므로, 순위5("L1엔 신호 없음")는 영원히 도달 불가능한 분기가 됩니다.

**확인 요청**: `moderationFlagged`가 실제로 L0 flagged의 단순 복사 값인가요? 그렇다면 순위5는 도달 가능한 분기가 맞는지, 아니면 잘못 기술된 것인지 확인 부탁드립니다.

## 2. PolicyEngine 순위9 도달 가능성

순위9 "Judge 미호출 + (`repetitiveNegative` 또는 `emotionSpike`) 단독 신호" → `SUPPORTIVE`/`SPECULATIVE`.

`repetitiveNegative`/`emotionSpike` 중 하나라도 true면 Judge를 무조건 호출(`requiresJudge=true`)하는 것으로 알고 있습니다.

**확인 요청**:

- 순위9는 실제 코드에서 도달 가능한 분기인가요?
- "Judge 미호출"이 "호출은 했지만 실패해서 `fallback()` → `CLEAR_LOW`가 된 경우"까지 포함하는 표현인가요? 포함한다면, `CLEAR_LOW`는 `risk_level`이 HIGH/MEDIUM/LOW가 아니라서 순위6~8에 안 걸리고 순위10(기본값, NORMAL/SPECULATIVE)으로 떨어질 것 같은데 — "Judge가 필요해서 호출했지만 실패한 경우"가 "Judge가 처음부터 필요 없었던 기본 케이스"와 동일하거나 더 느슨하게 처리되는 셈인데, 의도된 동작인가요?

## 3. `messages.is_crisis_flagged` 항상 false

`Message.isCrisisFlagged` 컬럼은 메시지 저장 시 항상 `false`로 저장되는 것으로 보입니다. 실제 위기 판정은 SSE의 `done.is_crisis_flagged`와 `crisis_events` 테이블에만 남는 것 같습니다.

**확인 요청**: 의도된 설계(컬럼 자체가 사실상 미사용)인가요, 아니면 채워야 하는데 누락된 버그인가요? 향후 메시지 히스토리 조회 API가 추가되면 이 컬럼을 신뢰할 수 있는지 미리 확인이 필요합니다.

## 4. BUFFER 모드 출력단계 위기 재분류 시 severity가 항상 1로 고정

BUFFER 경로는 InputJudge가 이미 `risk_level=HIGH`(소극적 자살사고/고립/반복 무망감)로 분류한 입력에서만 옵니다. 그런데 출력 생성 후 `OutputJudge`가 위기로 재분류해도 원본 메시지를 `null`로 넘겨, severity가 무조건 1(핫라인 없는 진정 유도 문구)로 귀결되는 것으로 보입니다.

**검토 요청**: 입력 단계에서 이미 HIGH로 분류된, 비교적 위험도가 높다고 판단된 사용자가 출력 단계 위기 확정 시 오히려 핫라인 정보를 못 받는 게 의도된 안전 정책인가요? 원본 메시지를 그대로 넘겨 severity를 정상 산정하도록 수정하는 게 맞지 않을지 검토 부탁드립니다.

📷 화면 캡처:

## 5. CAUTIOUS_SPECULATIVE 경로 — 출력단계 위기 재분류 시 `crisis` 이벤트 누락 (수정 요청)

**사용자 시나리오**: 사용자가 "다들 내가 없어도 잘 지낼 것 같아"처럼 키워드로는 안 잡히지만 위험한 메시지를 보냄 → `risk_level=MEDIUM`으로 분류되어 `CAUTIOUS_SPECULATIVE` 모드로 AI 응답이 실시간 스트리밍됨 → 스트리밍 중 내용 검증(`OutputJudge`)에서 "사실 이건 위기 상황"으로 재판정됨 → **화면에 쌓이던 응답 텍스트가 사라지고 "지금 많이 힘드시겠어요…" 같은 두루뭉술한 문구로 바뀐 채 대화가 끝남.** 핫라인 번호(109, 1577-0199) 같은 실질적 안내는 전혀 뜨지 않음.

같은 위기 상황도 **메시지를 보낸 즉시 키워드로 잡혔다면**(예: "죽고싶다") 핫라인 안내 카드가 바로 갔을 텐데, **응답을 만들다가 도중에 재판정되는 이 경로만 핫라인 안내 절차를 안 탑니다.** 오히려 키워드로 안 잡히는 애매한 위기 표현일수록 이 경로로 늦게 잡힐 가능성이 높은데, 그런 사용자가 핫라인을 못 받는 쪽에 걸리는 셈이라 더 문제입니다.

**원인**: `OutputJudge`가 `CRISIS_FLOW`로 재분류해도 `crisisFlowService.handle()`을 호출하지 않고, 고정 대체 문구(`delta.replace`) + `done(is_crisis_flagged=true, finished_reason="replaced_by_guard")`만 보냅니다. `crisis` 이벤트 자체가 안 가기 때문에 핫라인 정보가 클라이언트에 전달될 방법이 없습니다.

**수정 요청**: 이 경로도 BUFFER 모드와 동일하게 `crisisFlowService.handle()`을 호출해 `crisis` 이벤트(+핫라인 정보)를 함께 전송하도록 수정 요청합니다.
(프론트는 임시로 `done.is_crisis_flagged` 기반 fallback 안내 문구를 하드코딩해 대응하기로 했으나, 근본 수정은 백엔드 쪽이 맞다고 판단했습니다 — 위 4번 항목과 함께 검토해주시면 좋을 것 같습니다.)

📷 화면 캡처:

## 6. 감정 점수 제출 엔드포인트 신규 요청

현재 `emotion_score`는 서버→클라이언트 단방향 신호이고, 사용자가 감정 점수 슬라이더로 보정한 점수를 서버에 되돌려보낼 엔드포인트가 없습니다.

**요청**: 예) `PATCH /v1/sessions/{sessionId}/messages/{msgId}/emotion-score` 같은 엔드포인트 추가 요청. (용도: 사용자가 직접 조정한 감정 점수를 세션/메시지 데이터 및 이후 분석에 반영)

📷 화면 캡처:

## 7. socratic(소크라테스식 질문) 식별 필드 추가 요청

소크라테스식 질문 여부는 현재 서버 내부 상태일 뿐이고, SSE 스펙 어디에도 "이 AI 응답이 소크라테스식 질문인지"를 알려주는 필드가 없습니다.

**요청**: `done` 이벤트(또는 `delta`)에 `intervention_type` 같은 메타 필드를 추가해, 해당 응답이 소크라테스식 질문인지 클라이언트가 식별할 수 있게 해주세요.

📷 화면 캡처:

## 8. 세션 요약 구조화 필드 추가 요청

현재 세션 요약 응답은 자유텍스트 `summary` 1개 + `avg_emotion_score`/`bias_types_detected`/`cbt_intervened`만 제공합니다. 프론트 UI는 핵심 내용을 리스트로 보여주고 싶어합니다.

**요청**: 세션 종료 시 이미 thought/distortion/emotion/trigger를 추출하는 것으로 보이는데, 이 중 일부를 세션 요약 응답에 구조화된 필드(예: `key_thoughts: string[]`)로 추가 노출할 수 있는지 확인 요청.

추가로, "주요 감정 변화율" UI를 위해 프론트가 직전 세션의 `avg_emotion_score`를 가져와 클라이언트에서 자체 비교하기로 했습니다 — 직전 세션 id로 요약 조회가 가능한지 확인 부탁드립니다 (별도 API가 필요하다면 알려주세요).

📷 화면 캡처:
