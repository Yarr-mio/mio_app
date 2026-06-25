# 04. 백엔드 수정 사항 정리 — CBT 감정 점수 제출 흐름 재설계

> 작성일: 2026-06-25
> 목적: [03-backend-fixes-applied.md](./03-backend-fixes-applied.md) §7(감정 점수 제출 엔드포인트), §8(socratic 식별 필드)에서 "요청과 다른 스펙으로 구현됨"이라 지적했던 두 항목이 후속 커밋에서 어떻게 다시 설계되었는지 정리. **코드를 직접 읽고 확인한 내용만 기술**.
> 관련 커밋: `36ad8de`(`feat: collect CBT emotion score after intervention`), `127d610`(`fix: harden CBT emotion score flow`) — PR #176(`feat/#175-cbt-emotion-score-flow`), merge PR #177
> 원문서: [CHAT_BACKEND_QUESTIONS_NOTION.md](./CHAT_BACKEND_QUESTIONS_NOTION.md) §6·§7

## 한눈에 보기

| 구분             | 변경 전 (`f0c6744`, 03 문서 기준)             | 변경 후 (`36ad8de` + `127d610`)                                                                                           |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 측정 단위        | **세션** 전체 1개                             | **CBT 개입(소크라테스 질문→답변→재구성) 1회** 단위, 세션당 여러 개 가능                                                   |
| 호출 가능 시점   | **세션 종료 후만** (`409 SESSION_NOT_ENDED`)  | 개입이 끝나는 즉시, **세션 진행 중에도** 가능                                                                             |
| 엔드포인트       | `POST /v1/sessions/{sessionId}/emotion-score` | `POST /v1/cbt/reconstructions/{reconstructionId}/emotion-score`                                                           |
| 제출 대상 식별   | 없음 (세션 ID만)                              | `done` SSE 이벤트의 `emotion_score_target_id`                                                                             |
| socratic 판정    | 응답 텍스트에 `?` 포함 여부 (오탐 많음)       | LLM 분류기(`CbtMetadataClassifier`, gpt-4o-mini) 기반 상태머신                                                            |
| `done` 신규 필드 | `is_socratic`뿐                               | `cbt_intervention_state`, `completion_reason`, `requires_emotion_score`, `emotion_score_target_id`, `emotion_score_phase` |

**결론: 03 문서가 지적했던 두 가지 문제(세션 단위·종료 후 전용 / 물음표 기반 오탐)는 이번 커밋으로 모두 해소됨.** 이제 "소크라테스 흐름이 끝나는 시점에 즉시 감정 점수를 받는다"는 원래 의도대로 동작한다.

---

## 1. 왜 다시 바뀌었나

03 문서가 지적한 대로, 기존 구현(`f0c6744`)은 "세션 종료 후 화면에서 점수를 한 번 보정"하는 용도로만 쓸 수 있어서, 대화 중 소크라테스식 개입이 끝나는 시점마다 감정 점수를 받는다는 원래 설계를 구현할 방법이 없었다. 이번 변경은 "감정 점수 측정 대상"을 세션이 아니라 **개별 CBT 개입 1회(`CbtReconstruction` row)** 로 끌어내려 별도 테이블·엔드포인트로 분리했다.

## 2. 기존 엔드포인트 — 완전히 제거됨

```diff
- @PostMapping("/{sessionId}/emotion-score")   // SessionController.java
- public ResponseEntity<ApiResponse<EmotionScoreResponse>> submitEmotionScore(...)
```

`POST /v1/sessions/{sessionId}/emotion-score`는 `SessionController`에서 라우트 자체가 삭제됐다. 이제 호출하면 매칭되는 핸들러가 없어 스프링 기본 404가 내려간다(`ApiResponse`/`ErrorResponse` JSON 포맷이 아닐 수 있음 — 라우팅 단계 실패라 `GlobalExceptionHandler`를 안 탈 가능성이 있다. 정확한 바디는 실제로 호출해서 확인 권장).

> ⚠️ `SessionService.submitEmotionScore(...)`, `Session.updateEmotionScoreUser(...)` 메서드 자체는 코드에 그대로 남아있지만 **어떤 컨트롤러도 더 이상 호출하지 않는 죽은 코드**다. 참고하면 안 된다. 이 라우트로 연동된 기존 화면(세션 종료 후 점수 보정 등)이 있다면 전부 §3의 신규 엔드포인트로 교체해야 한다.

## 3. 신규 엔드포인트

### `POST /v1/cbt/reconstructions/{reconstructionId}/emotion-score`

| 항목          | 내용                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| 인증          | 필요 (Bearer)                                                                     |
| Path Variable | `reconstructionId` (UUID) — §4의 `done` 이벤트에서 받은 `emotion_score_target_id` |
| 제출 횟수     | **reconstruction 1건당 1회만** (이미 제출됐으면 같은 점수로도 재제출 불가)        |

**Request Body**

```ts
interface EmotionScoreRequest {
  score: number; // 0~100, 필수
}
```

**Success Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "reconstruction_id": "9f1e2a3b-....-....-............",
    "emotion_score_after": 62,
    "updated_at": "2026-06-25T09:12:33Z"
  }
}
```

**Error Responses**

| HTTP | 에러코드                       | 상황                                                |
| ---- | ------------------------------ | --------------------------------------------------- |
| 400  | `VALIDATION_ERROR`             | `score` 누락 또는 0~100 범위 밖                     |
| 401  | `UNAUTHORIZED`                 | 인증 정보 없음/유효하지 않은 사용자 식별자          |
| 403  | `FORBIDDEN`                    | 본인 소유가 아닌 `reconstructionId`                 |
| 404  | `CBT_RECONSTRUCTION_NOT_FOUND` | 존재하지 않는 `reconstructionId`                    |
| 409  | `CBT_SCORE_NOT_REQUIRED`       | **이미 점수가 제출된 reconstruction에 재제출 시도** |

> `CBT_SCORE_NOT_REQUIRED`(409)는 "이 개입은 원래 점수 대상이 아님"이 아니라 **현재 구현상 "이미 제출 완료됨"과 같은 코드로 합쳐져 있다.** FE에서 중복 탭/재시도로 같은 요청이 두 번 가면 두 번째는 항상 409가 뜨는데, 이는 실패가 아니라 "이미 처리됨"으로 취급해 조용히 무시하면 된다(에러 토스트 띄우지 말 것).

### 멱등성/동시성 처리 (참고)

`127d610` 커밋에서 점수 제출을 단일 `UPDATE ... WHERE emotion_score_after IS NULL` 원자적 쿼리로 바꿔서, 같은 reconstruction에 동시에 두 요청이 들어와도 정확히 1번만 성공하도록 굳혔다(`CbtReconstructionRepository.submitEmotionScoreAfterIfPending`). FE 입장에서 추가로 할 일은 없지만, "느린 네트워크에서 중복 클릭 시 두 번째 요청은 항상 409"라는 동작이 의도된 것임을 알아두면 된다.

---

## 4. 제출 시점을 알려주는 `done` SSE 이벤트 — 신규 필드

채팅 스트리밍 응답(`POST /v1/sessions/{sessionId}/messages`)의 `done` 이벤트에 필드가 추가됐다. **이 필드들을 보고 "지금 감정 점수 입력 UI를 띄울지"를 결정해야 한다.**

```ts
interface DoneData {
  msg_id: string;
  emotion_score?: number; // 기존 필드, 변경 없음 (AI가 추정한 이번 턴 감정 점수, 0~100)
  is_crisis_flagged: boolean; // 기존 필드, 변경 없음
  is_socratic: boolean; // 판정 로직 변경 (§5)
  cbt_intervention_state: 'none' | 'socratic_asked' | 'followup_needed' | 'completed'; // 신규
  completion_reason:
    | 'user_reframed_thought'
    | 'user_declined'
    | 'max_questions_reached'
    | 'stabilized'
    | 'not_applicable'
    | null; // 신규
  requires_emotion_score: boolean; // 신규
  emotion_score_target_id: string | null; // 신규, UUID — §3 엔드포인트의 path variable
  emotion_score_phase: 'after' | null; // 신규, 현재는 'after' 또는 null만 옴 (§7 참고)
  finished_reason: 'stop' | 'security_refusal' | 'crisis_flow' | 'replaced_by_guard' | 'error';
}
```

**FE가 실제로 봐야 하는 조건**: `cbt_intervention_state === 'completed' && requires_emotion_score === true && emotion_score_target_id != null` 일 때만 "감정 점수 다시 입력해주세요" UI를 띄우고, 제출 시 `emotion_score_target_id`를 그대로 path variable로 써서 §3 엔드포인트를 호출한다.

> ⚠️ **`requires_emotion_score`가 `true`인데 `emotion_score_target_id`가 `null`인 케이스가 실제로 존재한다.** `127d610`에서 reconstruction row 생성 중 예외가 나면(`createEmotionScoreTarget` 실패) 로그만 남기고 조용히 넘어가도록 방어 코드가 들어갔다(`ConversationOrchestrator.sendDoneEvent`). 이 경우 `requires_emotion_score=true`이지만 제출할 대상 ID가 없으므로, **`emotion_score_target_id`가 null이면 `requires_emotion_score` 값과 무관하게 입력 UI를 띄우지 않아야 한다.**

---

## 5. `is_socratic` / CBT 상태머신 — 판정 방식 고도화

03 문서가 지적한 "물음표 포함 여부로만 판정"하던 `detectSocratic()` 함수는 완전히 삭제됐다. 대신 매 응답마다 별도 LLM 분류기(`CbtMetadataClassifier`, `gpt-4o-mini`)가 직전 상태 + 최근 대화 + 이번 턴 사용자/AI 메시지를 보고 아래 4개 상태 중 하나로 분류한다.

```
none            → 이 턴은 CBT 개입과 무관
socratic_asked  → AI가 소크라테스식 질문을 던지고 사용자 답을 기다리는 중
followup_needed → 사용자가 답했지만 재구성하기엔 부족해서 추가 질문 필요
completed       → 사용자가 재구성에 충분히 답했음 / 거부함 / 안정됨 / 질문 한도(2회) 도달 — 어느 경우든 "이 개입은 끝남"
```

`is_socratic`은 `metadata.socratic() || state == SOCRATIC_ASKED`로 계산되며, **`completed`가 곧 `is_socratic=true`를 의미하지는 않는다** (질문을 던진 턴에서만 true, 답을 받고 완료 처리되는 턴은 보통 false).

`requires_emotion_score`는 `state == COMPLETED`이고 `bias_type`이 허용된 6종(`overgeneralization`, `catastrophizing`, `mind_reading`, `all_or_nothing`, `self_blame`, `emotional_reasoning`) 중 하나일 때만 true가 된다 — 즉 **모든 `completed`가 감정 점수 대상은 아니다.**

### 동작하지 않는 경로가 있다 — `finished_reason` 분기 주의

CBT 분류기는 다음 경로에서는 **호출되지 않고 항상 `none`/`is_socratic=false`/타깃 없음**으로 고정된다:

| `finished_reason`   | CBT 분류 수행 여부                                                         |
| ------------------- | -------------------------------------------------------------------------- |
| `stop`              | ✅ 수행됨                                                                  |
| `security_refusal`  | ❌ 항상 none                                                               |
| `replaced_by_guard` | ❌ 항상 none (03 문서 시점엔 물음표 검사라도 했었지만, 지금은 완전히 꺼짐) |
| `crisis_flow`       | ❌ 항상 none (분류기 호출 전에 분기됨)                                     |
| `error`             | ❌ 항상 none                                                               |

즉 "안전 가드에 의해 응답이 교체된 턴"이나 "위기 대응 턴"에서는 그 턴이 실제로 소크라테스 질문처럼 보이는 텍스트였어도 `is_socratic`이 절대 true가 되지 않는다. 의도된 동작으로 보인다(가드 교체 문구는 CBT 개입이 아니므로).

---

## 6. 권장 프론트엔드 처리 흐름

1. 매 `done` 이벤트 수신 시 `finished_reason`이 `stop`인 경우에만 `cbt_intervention_state`를 의미 있게 본다.
2. `cbt_intervention_state === 'completed'`, `requires_emotion_score === true`, `emotion_score_target_id !== null` 세 조건을 모두 만족할 때만 감정 점수 입력 UI(슬라이더 등) 노출.
3. 사용자가 점수를 제출하면 `POST /v1/cbt/reconstructions/{emotion_score_target_id}/emotion-score`에 `{ "score": <0-100> }` 전송.
4. 응답 처리:
   - `200` → 제출 완료 UI로 전환, `emotion_score_after` 표시 가능.
   - `409 CBT_SCORE_NOT_REQUIRED` → 이미 제출된 것으로 간주, 에러 노출 없이 완료 UI로 전환(중복 클릭/재시도 대비).
   - `403`/`404` → 예상치 못한 상태, 일반 에러 처리 + 로깅(다른 사용자 토큰 섞임, 혹은 서버 측 생성 실패 가능성).
5. 같은 세션 내에서 위 사이클이 여러 번(개입마다) 반복될 수 있음 — 세션 종료를 기다리지 않는다.

---

## 7. 확인이 더 필요한 부분

- `emotion_score_phase`는 현재 코드상 `'after'` 또는 `null`만 나온다(`emotionScoreTargetId != null ? "after" : null`). `'before'` 값을 만드는 경로는 보이지 않는다 — 필드 이름상 향후 "개입 전 점수도 받는" 플로우를 위해 미리 만들어둔 것으로 추정되나, 현재는 `'after'`/`null` 두 값만 처리하면 된다. 백엔드 팀에 향후 계획 확인 권장.
- 구 엔드포인트(`POST /v1/sessions/{sessionId}/emotion-score`) 호출 시 정확한 404 응답 바디 포맷은 코드 추론(스프링 기본 핸들러)이며 실제 호출 검증은 하지 않았음.
