# 02. 위기 처리 수정 회귀 테스트 + 이슈 갱신

> 상태: ✅ 완료(부분 검증 — 상세는 로그 참고)
> 로그: `trouble-impl/logs/02-crisis-safety-net-review.md` (작업 시작 시 생성)
> 관련: [chat-trouble-shoot/03-backend-fixes-applied.md §5, §6](../chat-trouble-shoot/03-backend-fixes-applied.md#5-buffer-모드-출력단계-위기-재분류-시-severity-항상-1-고정--수정됨-), [chat-impl/OPEN_ISSUES.md #1](../chat-impl/OPEN_ISSUES.md#1-위기-fallback-안내에-핫라인-번호-포함-여부)
> 선행 작업: 없음 (01번과 독립적으로 진행 가능)

## 목표

백엔드가 수정한 두 가지 위기 처리 버그(BUFFER 모드 severity 고정, CAUTIOUS_SPECULATIVE `crisis` 이벤트 누락)가 실제로 동작하는지 실기기로 확인하고, 확인되면 `OPEN_ISSUES.md` #1을 갱신한다. **코드는 전혀 변경하지 않는다** — 현재 구현이 이미 두 수정 사항을 그대로 받아낼 수 있는 구조이기 때문이다(아래 "왜 코드 변경이 필요 없는지" 참고). 도달 불가능해진 안전망(`handleCrisisFallback`)에 대한 설명은 코드 주석이 아니라 이 작업 문서/로그에만 남긴다.

## 배경

- **BUFFER severity 고정 수정** (`03-backend-fixes-applied.md` §5): `resolveOutputJudgeAction`이 원본 메시지를 `null` 대신 실제 값으로 전달해, HIGH 위험 입력의 출력단계 위기 재분류 시 severity 2/3(핫라인 포함)이 나올 수 있게 됐다.
- **CAUTIOUS_SPECULATIVE `crisis` 이벤트 누락 수정** (§6): 이제 이 경로의 위기 재분류도 `crisisFlowService.handle()`을 호출해 `crisis` 이벤트 + `done(finished_reason="crisis_flow")`로 끝난다. "`replaced_by_guard`는 위기가 아닌 REWRITE/REPLACE 케이스에만 쓰인다"고 명시됨.

### 왜 코드 변경이 필요 없는지

[useChatSse.ts:130-140](../../src/features/chat/hooks/useChatSse.ts)의 `handleCrisis`는 이미 `data.resources?.hotlines`로 옵셔널 체이닝을 쓰고 있어 severity 1(resources=null)이든 2/3(resources 있음)이든 그대로 처리 가능하다. `handleDone`(`:154-164`) 안의 `is_crisis_flagged && finished_reason === 'replaced_by_guard'` 조건문(`:160-161`)이 호출하는 `handleCrisisFallback`(`:142-152`)은 **수정 전, `crisis` 이벤트 없이 위기 재분류되던 경로**를 막기 위한 안전망이었다. 백엔드 수정으로 그 경로 자체가 이제 `crisis_flow`로 끝나게 됐으므로, 이 안전망은 이론상 더 이상 트리거되지 않아야 한다 — 즉 **삭제할 필요도 없고, 코드를 고칠 필요도 없다.**

## 변경 대상 파일

- [docs/chat-impl/OPEN_ISSUES.md](../chat-impl/OPEN_ISSUES.md) — #1 항목 상태 갱신 (코드 변경 없음)

## 구현 체크리스트

### 실기기 회귀 테스트

- [x] **CAUTIOUS_SPECULATIVE 위기 재분류 재현**: 4회 시도(입력단계 hardCrisis 1회 + MEDIUM risk 문구 3회) 모두 AI가 안전하게 경계를 지키는 응답만 생성해, 출력단계 재분류(`OutputJudge`의 `CRISIS_FLOW`) 자체가 트리거되지 않음 — 강제 재현 실패. LLM 응답에 좌우되는 드문 안전망이라는 점을 감안해 코드 분석(백엔드 diff + 프론트 구조)으로 충분하다고 판단하고 마무리. 상세: [logs/02-crisis-safety-net-review.md](./logs/02-crisis-safety-net-review.md)
- [ ] **BUFFER 위기 재분류 재현**: 시도하지 않음 (보류) — 시간 대비 효용이 낮다고 판단, 필요시 백엔드 쪽 단위/통합 테스트 커버리지 확인을 권장
- [x] 시도한 시나리오에서는 `handleCrisisFallback`(번호 없는 fallback 문구)이 호출되지 않고, 입력단계 hardCrisis는 정상적인 `handleCrisis`(실제 핫라인 카드)로 처리되는 것을 확인

### 문서 갱신 (완료)

- [x] `OPEN_ISSUES.md` #1("위기 fallback 안내에 핫라인 번호 포함 여부")을 "🟡 보류" → "✅ 해소(안전망으로 격하)"로 갱신, 갱신 근거(이 작업 문서/로그 링크) 추가
- 코드(`useChatSse.ts`)는 손대지 않음 — "왜 이 분기가 남아있는지"는 코드 주석이 아니라 이 문서/로그로만 남긴다 (불필요한 설명 주석을 코드에 쌓지 않기로 결정)

## 커밋 메시지

```
chore: 위기 처리 백엔드 수정 회귀 확인 및 OPEN_ISSUES.md #1 상태 갱신

- CAUTIOUS_SPECULATIVE 위기 재분류 경로의 fallback 분기가 더 이상 호출되지 않음을 부분 검증
  (BUFFER 경로는 미검증 — 백엔드 코드 분석으로 대체 판단)
- 코드 변경 없음 — OPEN_ISSUES.md #1만 갱신

related to: #21
```
