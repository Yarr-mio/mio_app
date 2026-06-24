# 트러블슈팅 후속 — 백엔드 수정사항 반영 작업 계획 (issue #21)

> 출처: [CHAT_FRONTEND_FOLLOWUP_PLAN.md](../CHAT_FRONTEND_FOLLOWUP_PLAN.md) 1장("즉시 적용 가능, 결정 불필요")만 추려 커밋 단위 작업 문서로 나눔.
> 2장("결정이 필요한 사항" — 감정 점수 제출 흐름, `is_socratic` 실연동 여부)은 이번 범위에서 제외하고 보류함.
> 각 작업은 **커밋 1개 단위**. 작업 중 트러블슈팅/결정/특이사항은 작업 문서가 아니라 `trouble-impl/logs/0N-*.md`에 기록한다 (chat-impl 컨벤션과 동일, 작업 시작 시 생성).

## 작업 순서

| #   | 작업                                            | 커밋 타입 | 작업 문서                                                          | 상태                                                              |
| --- | ----------------------------------------------- | --------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1   | SSE 스트리밍 실측 재검증 + 진단 로그 제거       | chore     | [01-sse-realtime-reverify.md](./01-sse-realtime-reverify.md)       | 🟡 보류 (실기기 QA 필요 — 에이전트가 수행 불가, 사용자 확인 대기) |
| 2   | 위기 처리 수정 회귀 테스트 + 이슈 갱신          | chore     | [02-crisis-safety-net-review.md](./02-crisis-safety-net-review.md) | ✅ 완료, 커밋됨                                                   |
| 3   | SSE_SPEC/API_SPEC/CHAT_SESSION_FLOW 문서 동기화 | chore     | [03-spec-docs-sync.md](./03-spec-docs-sync.md)                     | ✅ 완료 (코드 변경 없어 커밋 안 함)                               |
| 4   | `is_socratic` 타입 추가 (실연동 제외)           | fix       | [04-is-socratic-type-only.md](./04-is-socratic-type-only.md)       | ✅ 완료, 커밋됨                                                   |

상태 표기: ⬜ 미착수 · 🟨 진행중 · ✅ 완료.

## 작업 순서를 이렇게 정한 이유

1·2번은 **실기기 수동 QA가 선행 조건**이라 가장 먼저 둠 (코드 변경은 QA 결과에 따라 갈림 — 통과하면 정리 커밋, 실패하면 코드는 그대로 두고 백엔드에 재문의). 3번(문서 동기화)은 1·2번의 QA 결과를 기다리지 않고 병행 가능하지만 **완전히 독립적이지는 않다** — `03-backend-fixes-applied.md`도 §1·§6 수정사항에 "재검증 권장"이라는 단서를 달아뒀으므로, 1·2번 QA가 실패로 끝나면(예: 실제로는 여전히 `crisis` 이벤트가 누락) 3번에서 이미 갱신한 `SSE_SPEC.md` §7 등의 내용을 되돌려야 한다. 즉 3번은 "먼저 진행해도 되지만 QA 실패 시 되돌릴 수 있어야 하는" 잠정 반영으로 취급한다. 4번은 타입만 추가하고 분기 연동은 하지 않으므로 가장 마지막에 독립적으로 처리.

## 이번 범위에서 제외된 것

- 감정 점수 제출 흐름 재설계 (결정 필요) — [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-1](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-1-감정-점수-제출-흐름-재설계-결정-필요)
- `is_socratic` 실연동 여부 (결정 필요) — [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요)
- `key_thoughts`/`socratic_count`, `emotion_score_ai` 조회 경로 등 백엔드 미완성/추가 확인 필요 항목 — [CHAT_FRONTEND_FOLLOWUP_PLAN.md §3](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#3-보류-백엔드-미완성추가-확인-필요--지금-작업하지-않음)

위 항목들은 결정되는 대로 별도 `chat-impl/` 작업 문서로 분리해 진행한다.

## QA 중 발견된 추가 이슈 (이번 범위 밖, 기록만)

2번 작업 QA 중 백엔드 수정과 무관한 별개의 프론트엔드 버그를 발견함 — **`delta` 이벤트 없이 `crisis`로 직행하는 시나리오(입력 단계 즉시 위기 감지, BUFFER 출력단계 위기 전환)에서 `handleSessionMeta`가 만든 빈 AI placeholder 말풍선이 안 채워진 채로 남는다.** 상세 원인/영향 범위는 [logs/02-crisis-safety-net-review.md](./logs/02-crisis-safety-net-review.md) 참고.

> **✅ 수정됨 (2026-06-24)**: `chatStore`에 `replaceMessageAsCrisis` 액션을 추가해, `crisis` 이벤트 수신 시 빈 placeholder가 남아있으면 새 메시지를 추가하는 대신 그 placeholder를 위기 말풍선으로 전환하도록 `useChatSse.ts`의 `handleCrisis`를 수정. 별도 작업 문서/로그는 만들지 않음(범위가 작아 이 INDEX에만 기록).
