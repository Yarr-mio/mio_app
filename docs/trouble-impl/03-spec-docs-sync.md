# 03. SSE_SPEC/API_SPEC/CHAT_SESSION_FLOW 문서 동기화

> 상태: ✅ 완료 (코드 변경 없음 — 별도 커밋하지 않음, 작업 트리에만 반영)
> 로그: 트러블슈팅/결정 사항 없어 생성하지 않음
> 관련: [chat-trouble-shoot/03-backend-fixes-applied.md "갱신이 필요한 기존 문서"](../chat-trouble-shoot/03-backend-fixes-applied.md#갱신이-필요한-기존-문서)
> 선행 작업: 없음 (01·02번의 QA 결과와 무관하게 진행 가능 — 백엔드 커밋 diff로 이미 확정된 사실만 반영)

## 목표

백엔드 수정 사항이 적용된 후에도 스펙 문서(`SSE_SPEC.md`, `API_SPEC.md`, `CHAT_SESSION_FLOW.md`)가 예전 동작을 기준으로 작성돼 있어, 다음에 이 문서를 보는 사람이 잘못된 전제로 작업하지 않도록 갱신한다. 이 작업은 QA 결과를 기다릴 필요 없이 **이미 커밋 diff로 확인된 사실**만 반영하는 순수 문서 작업이다.

## 변경 대상 파일

- [docs/SSE_SPEC.md](../SSE_SPEC.md)
- [docs/API_SPEC.md](../API_SPEC.md)
- [docs/CHAT_SESSION_FLOW.md](../CHAT_SESSION_FLOW.md)

## 구현 체크리스트

### `SSE_SPEC.md`

- [x] §5 `DoneData` 인터페이스에 `is_socratic: boolean;` 필드 추가 (주석: "물음표 포함 여부로만 판정 — CBT 소크라테스식 개입 여부와는 다름, 오탐 가능")
- [x] §7 gotcha의 "`CAUTIOUS_SPECULATIVE` 모드 스트리밍 중 비동기 검증에서 위기로 재분류되는 경우... `crisis` 이벤트는 오지 않는다" 설명을 수정 — 이제 이 경로도 `crisis` 이벤트 + `finished_reason="crisis_flow"`로 온다는 내용으로 교체. `replaced_by_guard`는 위기가 아닌 REWRITE/REPLACE 케이스 전용이라는 점 명시.
- [x] §6 시나리오 표의 "CAUTIOUS_SPECULATIVE, 검증 실패 → 교체/위기" 행을 위기/비위기 두 행으로 분리 검토 (위기면 `crisis`+`done(crisis_flow)`, 비위기 REWRITE/REPLACE면 `delta.replace`+`done(replaced_by_guard)`)

### `API_SPEC.md`

- [x] §9 Session/채팅 섹션에 `POST /v1/sessions/{sessionId}/emotion-score` 엔드포인트 추가 (요청/응답 타입, `409 SESSION_NOT_ENDED` 에러 코드, "세션 종료 후에만 호출 가능" 제약 명시)
- [x] `EmotionScoreRequest`(`score: number`)/`EmotionScoreResponse`(`session_id`, `emotion_score_ai: number | null`, `emotion_score_user: number | null`, `updated_at`) 타입 추가 — `emotion_score_ai`는 세션 종료 후 컨솔리데이션(비동기)이 끝나기 전까지 `null`일 수 있다는 타이밍 주석 포함(`03-backend-fixes-applied.md` §7 "같이 발견되어 고쳐진 버그" 참고)
- [x] `SessionSummaryResponse`에 `key_thoughts: string[] | null`, `socratic_count: number | null` 필드 추가 (주석: "스키마만 존재, 채우는 로직이 아직 없어 항상 null — `03-backend-fixes-applied.md` §9 참고")
- [x] 주요 에러 코드 표에 `SESSION_NOT_ENDED` (409) 추가

### `CHAT_SESSION_FLOW.md`

- [x] §6-2 "BUFFER 모드: ... 항상 severity 1로 귀결된다" 설명을 "원본 메시지가 실제로 전달되어 severity 2/3 가능"으로 수정
- [x] §9 "`Message.isCrisisFlagged` 컬럼은 메시지 저장 시 항상 `false`로 저장된다" 설명을 "ASSISTANT 메시지 행에는 위기 판정이 반영되지만, USER 메시지 행은 여전히 항상 `false`"로 수정
- [x] §6-2 CAUTIOUS_SPECULATIVE 항목의 "crisis 이벤트와 핫라인 정보가 클라이언트에 전달되지 않는다" 설명 제거/수정 (위 SSE_SPEC.md 수정과 동일한 내용)

## 커밋 메시지

```
chore: 백엔드 수정사항 반영해 SSE_SPEC/API_SPEC/CHAT_SESSION_FLOW 문서 갱신

- is_socratic 필드, emotion-score 엔드포인트, key_thoughts/socratic_count 필드 추가
- BUFFER severity 고정, CAUTIOUS_SPECULATIVE crisis 이벤트 누락 등 수정된 동작 설명 갱신

related to: #21
```

(코드 수정이 없는 순수 문서 작업은 별도 커밋으로 남기지 않기로 함 — 위 메시지는 참고용으로만 보존, 실제 커밋은 생성하지 않았다.)
