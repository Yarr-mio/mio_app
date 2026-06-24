# 03. 백엔드 수정 사항 정리 — `docs/trouble` 분석 후속

> 작성일: 2026-06-24
> 목적: [02-findings-sse-frontend-delivery.md](./02-findings-sse-frontend-delivery.md), [CHAT_BACKEND_QUESTIONS_NOTION.md](./CHAT_BACKEND_QUESTIONS_NOTION.md)에서 제기한 문제들에 대해 백엔드 팀이 실제로 무엇을, 어떻게 고쳤는지를 커밋 diff 기준으로 정리. **코드를 직접 읽고 확인한 내용만 기술**하며, 백엔드 팀의 구두/Notion 답변 내용은 포함하지 않음(별도 확인 필요한 항목은 "확인 필요"로 표시).
> 관련 PR: **#173** (`fix/#172-sse-proxy-buffering`), **#171** (`fix/#170-ai-pipeline-bugs`)

## 한눈에 보기

| #   | 원문서 항목                                    | 상태                                      | 한 줄 요약                                                                           |
| --- | ---------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | SSE 응답이 nginx에서 버퍼링됨 (02-findings)    | ✅ 수정됨                                 | `X-Accel-Buffering: no` + `Cache-Control: no-cache` 헤더 추가                        |
| 2   | PolicyEngine 순위4/5 모순 의심 (Q1)            | ⚪ 코드 변경 없음 — 버그 아닌 것으로 확인 | `l0Flagged`와 `l1.moderationFlagged()`는 다른 신호 (전체 카테고리 vs self-harm 한정) |
| 3   | PolicyEngine 순위9 도달 가능성 (Q2)            | ⚪ 실질 변경 없음                         | 관련 조건이 제거→복구를 거쳐 원상 복구, 의문 자체는 해소 안 됨                       |
| 4   | `messages.is_crisis_flagged` 항상 false (Q3)   | 🟡 부분 수정                              | ASSISTANT 메시지 행에는 반영됨, USER 메시지 행은 여전히 항상 false                   |
| 5   | BUFFER 모드 severity 항상 1 고정 (Q4)          | ✅ 수정됨                                 | 원본 메시지를 `null` 대신 실제 값으로 전달 → severity 2/3 가능해짐                   |
| 6   | CAUTIOUS_SPECULATIVE `crisis` 이벤트 누락 (Q5) | ✅ 수정됨                                 | 이제 BUFFER와 동일하게 `crisisFlowService.handle()` 호출                             |
| 7   | 감정 점수 제출 엔드포인트 (Q6)                 | 🟡 신규 구현됨 — 요청과 다른 스펙         | 메시지 단위 아닌 **세션 단위**, **세션 종료 후에만** 호출 가능                       |
| 8   | socratic 식별 필드 (Q7)                        | 🟡 신규 구현됨 — 판정 방식 단순함         | "물음표 포함 여부"로만 판정 (실제 개입 타입 추적 아님)                               |
| 9   | 세션 요약 구조화 필드 (Q8)                     | 🔴 스키마만 추가, 값 채우는 로직 없음     | `key_thoughts`/`socratic_count`는 **항상 null** 응답                                 |

범례: ✅ 완전 해결 / 🟡 부분 해결·주의 필요 / 🔴 미완성(현재는 못 씀) / ⚪ 코드 변경 없음

---

## 1. SSE 스트리밍 버퍼링 문제 ✅

> 원문서: [02-findings-sse-frontend-delivery.md](./02-findings-sse-frontend-delivery.md)

**커밋**: `ae64c33` `fix: nginx proxy_buffering으로 인한 SSE 스트림 지연 전달 수정` (PR #173, `Closes #172`)

```java
// SessionController.java:50-51
response.setHeader("X-Accel-Buffering", "no");
response.setHeader("Cache-Control", "no-cache");
```

`POST /v1/sessions/{sessionId}/messages` 응답에 nginx의 `proxy_buffering`을 끄는 헤더와 캐시 방지 헤더를 추가했다. 02-findings 문서가 실측으로 확정한 원인(nginx가 SSE 응답 전체를 모아서 한 번에 전달)에 대한 직접적인 대응.

> ⚠️ **재검증 권장**: 이 정리는 코드 diff 기준이며, 02-findings 문서처럼 실기기에서 `reader.read()` 타이밍을 다시 캡처해 `delta` 이벤트가 실제로 점진적으로 도착하는지 재현 확인은 하지 않았다. 프론트에서 임시로 추가했던 `★` 진단 로그(`useChatSse.ts`)는 이 수정 배포 후 실측 재확인을 한 뒤에 제거하는 것을 권장.

---

## 2. PolicyEngine 순위4/5 모순 의심 — 버그 아닌 것으로 확인 ⚪

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §1

**`PolicyEngine.java`는 이번 수정 범위에서 변경되지 않았다** (`git log`상 마지막 수정은 2026-06-05 `c94fb07`, 이번 트러블슈팅 이전).

코드를 다시 읽어보면 애초에 우려했던 "moderationFlagged가 L0 flagged의 단순 복사라 순위5가 도달 불가능"이라는 전제 자체가 맞지 않는다.

```java
// CombinedSignal.java — l0Flagged는 SafetySignalCombiner.combine()에서 moderation.flagged()를 그대로 받음 (카테고리 무관, "뭐든 하나라도 flagged"인지)
boolean l0Flagged

// SafetyL1Result.java — moderationFlagged는 self-harm 카테고리 한정
boolean moderationFlagged = moderation.flagged() && moderation.isSelfHarmFlagged();
```

```java
// PolicyEngine.java:55-69
// 4. L0 self-harm + L1 모두 flagged → CRISIS_FLOW
if (combined.l0Flagged() && combined.l1Result().moderationFlagged()) { ... }

// 5. L0 self-harm flagged (L1 미감지) → GUARDED + OutputGuard
if (combined.l0Flagged() && !combined.hardCrisis() && !combined.l1Result().moderationFlagged()) { ... }
```

`l0Flagged()`는 OpenAI Moderation의 **전체 카테고리** 기준 flagged 여부이고, `l1Result.moderationFlagged()`는 그중 **self-harm 카테고리로 flagged된 경우만** true다. 즉:

- 순위4 = "모더레이션이 뭔가를 flagged했고, 그게 self-harm이었다" → 위기 대응
- 순위5 = "모더레이션이 뭔가를 flagged했지만, self-harm은 아니었다(예: violence/harassment 등 다른 카테고리)" → 일반 생성 + 출력 가드

둘은 서로 배타적인 별개 신호이므로 순위5는 실제로 도달 가능한 분기다. **죽은 코드 아님 — 의도된 설계로 보임.**

---

## 3. PolicyEngine 순위9 도달 가능성 — 실질적인 변화 없음 ⚪

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §2

`PolicyEngine.java`의 순위9 코드 자체는 변경되지 않았다:

```java
// PolicyEngine.java:105-111 (변경 없음)
// 9. L1 약신호 단독 (Judge 생략)
if (combined.repetitiveNegative() || combined.emotionSpike()) { ... }
```

다만 이 분기의 전제(=`repetitiveNegative`/`emotionSpike`가 있으면 Judge가 항상 강제 호출되는가)를 결정하는 `SafetyL1`/`SafetySignalCombiner`가 같은 작업 중 **세 번 연속으로 수정되었다가 거의 원상 복구**되는 일이 있었다 (`f0c6744` → `69a9ef7` → `ac8fa9b`). 최종 net diff는 다음 한 곳뿐이다:

```diff
// SafetySignalCombiner.java:80-84 (조건 4)
- if (moderation.flagged() && moderation.isSelfHarmFlagged() && !l1.hasAnySignal()) {
+ if (moderation.flagged() && moderation.isSelfHarmFlagged()) {
```

`repetitiveNegative`/`emotionSpike` 단독 시 Judge를 강제 호출하는 조건(2.5, 2.7)은 한 커밋(`f0c6744`)에서 제거됐다가 바로 다음 커밋(`ac8fa9b`)에서 "실수로 같이 지워졌다"는 이유로 그대로 복구되어, **원래 질문이 지적한 상황(이 두 신호가 있으면 거의 항상 Judge가 강제 호출되어 순위9가 사실상 도달 불가능)은 그대로 남아있다.** 코드상 명시적인 답변이나 추가 수정은 확인되지 않음 — **백엔드 팀에 재확인 필요**.

(참고: 조건4의 변경은 self-harm flagged 시 L1 신호 유무와 무관하게 Judge를 호출하도록 한 것인데, `SafetyL1`에서 self-harm flagged면 `riskCandidate`도 항상 true가 되어 조건1에서 이미 Judge 호출이 결정되므로, 이 변경 자체도 체감 영향은 없어 보인다.)

---

## 4. `messages.is_crisis_flagged` 항상 false — 부분 수정 🟡

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §3

**커밋**: `f0c6744` (Bug 3)

```java
// ConversationOrchestrator.java — saveConversation 호출에 crisisFlowTriggered 전달
messagePersistenceService.saveConversation(sessionId, userId, userMessage, assistantContent, userSignal,
        crisisFlowTriggered);
```

```java
// SessionMessagePersistenceService.java
saveMessage(session, user, MessageRole.USER, userContent, userSignal.emotionScore(), userSignal.biasType(), false);
saveMessage(session, user, MessageRole.ASSISTANT, assistantContent, null, null, crisisFlowTriggered);
...
.isCrisisFlagged(isCrisisFlagged)   // 더 이상 하드코딩된 false 아님
```

⚠️ **주의**: USER 메시지 행(`saveMessage(... MessageRole.USER ...)`)은 여전히 `false`가 고정으로 전달된다. **ASSISTANT 메시지 행에만** 실제 위기 판정 결과가 반영된다. 향후 메시지 히스토리 API에서 이 컬럼을 신뢰하려면 "위기로 이어진 대화 턴의 AI 응답 메시지만 true가 될 수 있고, 사용자 메시지는 절대 true가 되지 않는다"는 점을 알고 있어야 함.

---

## 5. BUFFER 모드 출력단계 위기 재분류 시 severity 항상 1 고정 — 수정됨 ✅

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §4

**커밋**: `f0c6744` (Bug 4)

```java
// ConversationOrchestrator.java:375-396 — resolveOutputJudgeAction()
private String resolveOutputJudgeAction(
        OutputJudgeResult result,
        String originalContent,
        String originalUserMessage,   // ← 새 파라미터
        ...) {
    return switch (result.action()) {
        ...
        case CRISIS_FLOW -> {
            CrisisFlowService.CrisisHandleResult cr =
                    crisisFlowService.handle(l1Result, originalUserMessage, user, session, emitter, outboundMsgId,
                            emotionScore);   // 이전: null 고정 → 이제 실제 사용자 메시지 전달
            yield cr != null ? cr.fixedResponse() : "지금 많이 힘드시겠어요. 잠시 함께 이야기 나눠볼게요.";
        }
    };
}
```

`CrisisFlowService.determineSeverity(l1Result, originalMessage)`는 `originalMessage == null`이면 무조건 severity 1을 반환하던 코드라(`CrisisFlowService.java:84-86`), 이제 BUFFER 경로(PolicyEngine 순위6, HIGH risk)에서도 실제 사용자 메시지가 전달되어 `SEVERITY_2/3_KEYWORDS` 매칭을 통해 severity 2/3(핫라인 포함)이 산정될 수 있다.

---

## 6. CAUTIOUS_SPECULATIVE 경로 — 출력단계 위기 재분류 시 `crisis` 이벤트 누락 — 수정됨 ✅

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §5, [SSE_SPEC.md](../SSE_SPEC.md) §7의 gotcha

**커밋**: `f0c6744` (Bug 5)

```java
// ConversationOrchestrator.java:284-293 (CAUTIOUS_SPECULATIVE 분기)
boolean isCrisis = judgeActionResult.action() == OutputJudgeAction.CRISIS_FLOW;
if (isCrisis) crisisFlowTriggered = true;

if (isCrisis) {
    // crisis + done SSE를 crisisFlowService.handle() 내부에서 직접 전송
    CrisisFlowService.CrisisHandleResult crisisResult =
            crisisFlowService.handle(l1Result, userMessage, user, session, emitter,
                    outboundMsgId, userSignal.emotionScore());
    assistantContent = crisisResult != null ? crisisResult.fixedResponse()
            : "지금 많이 힘드시겠어요. 잠시 함께 이야기 나눠볼게요.";
} else {
    // 기존 REWRITE/REPLACE/SEND 처리 (delta.replace + done)
    ...
}
```

기존에는 `OutputJudge`가 `CRISIS_FLOW`로 재분류해도 고정 문구를 `delta.replace`로만 보내고 `crisisFlowService.handle()`을 호출하지 않아 `crisis` 이벤트(+핫라인)가 전혀 나가지 않았다. 이제 BUFFER 모드와 동일하게 `crisisFlowService.handle()`을 호출해 `crisis` 이벤트와 `done(finished_reason="crisis_flow")`가 함께 전송된다.

**프론트 영향**: `SSE_SPEC.md` §7에 적어둔 "CAUTIOUS_SPECULATIVE 재분류 시 `crisis` 이벤트가 안 온다"는 gotcha 설명은 더 이상 사실이 아니다. 이제 이 경로도 `finished_reason="crisis_flow"`로 끝나며 `replaced_by_guard`는 **위기가 아닌** REWRITE/REPLACE 케이스에만 쓰인다(`done.is_crisis_flagged` 기준 분기는 여전히 유효하지만, `crisis` 이벤트 수신 여부로만 판단해도 이제 안전).

### 부수적으로 같이 고친 별도 버그 (원래 8개 항목엔 없었음)

**커밋**: `6f0e010` `fix: SEND 경로 capturedSnapshot 사용...`

CAUTIOUS_SPECULATIVE 조기 차단(early-stop) 후 Judge가 "안전하다"고 판정해 스트림을 복원할 때, 기존엔 `assistantContent`(조기 차단 이후에도 계속 누적된 전체 텍스트, 즉 **검증되지 않은 trailing 토큰까지 포함**)를 `delta.replace`로 보내고 있었다. 이제 검증 시점의 스냅샷(`capturedSnapshotRef`)만 복원하도록 수정됨:

```java
// ConversationOrchestrator.java:308-316
} else if (stopSendingDeltas.get()) {
    // Stopped mid-stream but content is safe — restore only the reviewed snapshot,
    // not trailing tokens that arrived after the early stop
    String reviewedContent = capturedSnapshotRef.get() != null
            ? capturedSnapshotRef.get() : assistantContent;
    ...
}
```

---

## 7. 감정 점수 제출 엔드포인트 — 신규 구현, 요청과 다른 스펙 🟡

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §6

**커밋**: `f0c6744` (Feature 6) + `6f0e010`(보강) + `4000fb9`(연관 버그 수정)

요청했던 형태(`PATCH /v1/sessions/{sessionId}/messages/{msgId}/emotion-score`, 메시지 단위)와는 **다르게**, 세션 단위 엔드포인트로 구현되었다.

```
POST /v1/sessions/{sessionId}/emotion-score
```

```ts
// Request
interface EmotionScoreRequest {
  score: number; // 0~100 필수
}
// Response
interface EmotionScoreResponse {
  session_id: string;
  emotion_score_ai: number | null;
  emotion_score_user: number | null;
  updated_at: string; // 점수 갱신 시각 (세션 종료 시각 아님)
}
```

**중요한 제약** (`SessionService.java:186-196`):

```java
public EmotionScoreResponse submitEmotionScore(UUID userId, UUID sessionId, EmotionScoreRequest request) {
    Session session = findSession(sessionId);
    if (!session.belongsTo(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
    if (!session.isEnded()) throw new BusinessException(ErrorCode.SESSION_NOT_ENDED);  // ← 진행 중 세션은 호출 불가
    session.updateEmotionScoreUser(request.score());
    return EmotionScoreResponse.from(sessionRepository.save(session));
}
```

- **세션이 이미 종료된 상태에서만** 호출 가능 — `409 SESSION_NOT_ENDED` (신규 에러 코드) 발생 시 진행 중 세션이라는 뜻.
- 메시지 ID가 없으므로 "어느 메시지의 감정 점수를 보정했는지"는 서버에 남지 않고, **세션 전체에 대한 사용자 보정 점수 1개**만 저장된다(요약 화면에서 한 번 보정하는 용도로 설계된 것으로 보임).
- DB: `sessions.emotion_score_user`, `sessions.emotion_score_ai` 컬럼 추가, 둘 다 0~100 CHECK 제약 (V30, V31).

### 같이 발견되어 고쳐진 버그: `emotion_score_ai`가 항상 null

**커밋**: `4000fb9`

이 엔드포인트를 구현하며 `emotion_score_ai`(AI가 추정한 세션 감정 점수)가 항상 null이라는 별개의 버그가 발견되어 같이 고쳐졌다. `ExtractorLLM`(세션 종료 후 컨솔리데이션 단계, [CHAT_SESSION_FLOW.md](../CHAT_SESSION_FLOW.md) §8-2) 프롬프트에 `emotionScore`(0~100) 산출 항목을 추가하고, `SessionConsolidator`가 그 결과를 `sessions.emotion_score_ai`에 UPDATE 하도록 수정. 즉 `emotion_score_ai`는 세션이 끝나고 컨솔리데이션(비동기)이 완료된 *후*에야 채워진다 — 세션 종료 직후 바로 조회하면 아직 null일 수 있음.

---

## 8. socratic(소크라테스식 질문) 식별 필드 — 신규 구현, 단순화된 판정 방식 🟡

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §7

**커밋**: `f0c6744` (Feature 7)

`done` 이벤트에 `is_socratic: boolean` 필드가 추가되었다 (`SseEventDto.java:49-57`). [SSE_SPEC.md](../SSE_SPEC.md)의 `DoneData` 타입을 아래처럼 갱신해야 함:

```ts
interface DoneData {
  msg_id: string;
  emotion_score?: number;
  is_crisis_flagged: boolean;
  is_socratic: boolean; // ← 신규
  finished_reason: 'stop' | 'security_refusal' | 'crisis_flow' | 'replaced_by_guard' | 'error';
}
```

⚠️ **판정 로직이 기대와 다를 수 있음**:

```java
// ConversationOrchestrator.java
private boolean detectSocratic(String content) {
    if (content == null || content.isBlank()) return false;
    return content.contains("?") || content.contains("？");
}
```

"이 응답이 CBT 소크라테스식 질문 개입인지"가 아니라 **"AI 응답 텍스트에 물음표가 하나라도 있는지"**로 판정한다. 세션 내 소크라테스식 질문 사용 횟수를 추적하는 `WorkingMemory`의 `socratic_count`([CHAT_SESSION_FLOW.md](../CHAT_SESSION_FLOW.md) §3-8, §4)와는 연결되어 있지 않다. 단순한 안부 질문("오늘 기분은 좀 어떠세요?")에도 `is_socratic=true`가 찍힐 수 있으므로, 의도("이 응답은 소크라테스식 질문 개입이다")보다 넓게(오탐 포함) 잡힌다는 점을 감안하고 UI를 설계할 것.

SECURITY_REFUSAL / CRISIS_FLOW / FALLBACK(error) 경로는 `is_socratic`이 항상 `false`로 하드코딩되어 있다 (해당 없음이라는 의미로는 합리적).

---

## 9. 세션 요약 구조화 필드 — 스키마만 추가, 값을 채우는 로직 없음 🔴

> 원문서: CHAT_BACKEND_QUESTIONS_NOTION.md §8

**커밋**: `f0c6744` (Feature 8), `69a9ef7`(직렬화 보강)

`SessionSummaryResponse`에 필드는 추가되었다:

```ts
interface SessionSummaryResponse {
  ...
  key_thoughts: string[] | null; // JSONB 원본 그대로 (@JsonRawValue)
  socratic_count: number | null;
}
```

```java
// SessionSummaryResponse.java
@JsonRawValue @JsonProperty("key_thoughts") String keyThoughts,
@JsonProperty("socratic_count") Integer socraticCount
```

`session_summaries` 테이블에도 `key_thoughts JSONB`, `socratic_count INT` 컬럼이 추가되었다 (V30, V31 — `socratic_count >= 0` CHECK 포함).

🔴 **그러나 현재 이 두 필드를 실제로 채우는 코드가 없다.** `SessionConsolidator.upsertSessionSummary()`(세션 종료 시 요약을 만드는 유일한 경로)를 확인한 결과 `key_thoughts`/`socratic_count`를 SET하는 구문이 전혀 없다:

```java
// SessionConsolidator.java:289-300, 314-317 — UPDATE/INSERT 모두 key_thoughts, socratic_count 미포함
jdbcTemplate.update("""
    UPDATE session_summaries
    SET summary_text = ?, summary_ciphertext = ?, summary_dek_id = ?,
        dominant_emotion = ?, trigger_tags = ?, episode_type = ?,
        embedding_status = 'pending'
    WHERE session_id = ?
    """, ...);
```

`WorkingMemory`는 세션 진행 중 소크라테스식 질문 사용 횟수를 Redis에 이미 들고 있지만(`WorkingMemory.java` `FIELD_SOCRATIC_COUNT`), 컨솔리데이션 단계에서 이 값을 읽어 `session_summaries.socratic_count`에 옮기는 코드가 없다. `ExtractorLLM`이 추출하는 `thoughts`도 `key_thoughts` 컬럼에는 저장되지 않는다(다른 용도로만 쓰임, [CHAT_SESSION_FLOW.md](../CHAT_SESSION_FLOW.md) §8-2 참고).

**결론: `GET /v1/sessions/{sessionId}/summary`의 `key_thoughts`, `socratic_count`는 현재 항상 `null`로 응답된다.** 이 두 필드를 쓰는 UI를 지금 만들면 항상 빈 값만 받게 되므로, **백엔드 쪽에 "DTO/스키마는 추가됐지만 채우는 로직이 비어있다"는 점을 별도로 다시 전달해야 한다.**

---

## 갱신이 필요한 기존 문서

- [SSE_SPEC.md](../SSE_SPEC.md) §5 `DoneData` — `is_socratic` 필드 추가 필요 (§8 항목)
- [SSE_SPEC.md](../SSE_SPEC.md) §7 gotcha — "CAUTIOUS_SPECULATIVE 위기 재분류 시 `crisis` 이벤트 누락"은 더 이상 사실 아님 (§6 항목)
- [CHAT_SESSION_FLOW.md](../CHAT_SESSION_FLOW.md) §9, §6-2 — `is_crisis_flagged` 항상 false / BUFFER severity 항상 1 고정 설명은 부분적으로(§4, §5 항목) 더 이상 사실 아님
- [API_SPEC.md](../API_SPEC.md) §9 — `POST /v1/sessions/{sessionId}/emotion-score` 엔드포인트, `SessionSummaryResponse`의 `key_thoughts`/`socratic_count` 필드 추가 필요

---

## 참고: 관련 커밋 목록

| 커밋      | 메시지                                                                       |
| --------- | ---------------------------------------------------------------------------- |
| `f0c6744` | feat: AI 파이프라인 버그 수정 및 Feature 6/7/8 구현                          |
| `69a9ef7` | fix: CI 컴파일 오류 및 SafetySignalCombiner dead-code 보안 버그 수정         |
| `4000fb9` | fix: emotionScoreAi 항상 null 버그 수정                                      |
| `6f0e010` | fix: SEND 경로 capturedSnapshot 사용, updated_at 추가, DB CHECK 제약         |
| `ac8fa9b` | fix: SafetyL1 self-harm riskCandidate 및 단독 신호 InputJudge 발동 조건 복구 |
| `ae64c33` | fix: nginx proxy_buffering으로 인한 SSE 스트림 지연 전달 수정 (#172)         |
