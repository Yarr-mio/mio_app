# 03. 위기(crisis) 처리 보강 + 세션 자동종료 제거

> 상태: 미착수
> 로그: [logs/03-crisis-handling-fixes.md](../../logs/03-crisis-handling-fixes.md)
> 관련: [CHAT_FRONTEND_TASKS.md §3](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 1-3](../CHAT_SERVER_GAP_ANALYSIS.md#1-3-crisis-이벤트의-resources-null-크래시), [1-6](../CHAT_SERVER_GAP_ANALYSIS.md#1-6-donefinished_reason-만-보고-위기-ui를-결정함), [5-1](../CHAT_SERVER_GAP_ANALYSIS.md#5-1-crisis_flow-시-프론트가-바로-세션을-종료시킴)
> 결정 사항: [GAP_ANALYSIS §0-1](../CHAT_SERVER_GAP_ANALYSIS.md#0-1-결정-사항-2026-06-22-점검)
> 선행 작업: [02-delta-replace-handler](./02-delta-replace-handler.md)
> 미결 이슈: [OPEN_ISSUES.md #1](./OPEN_ISSUES.md#1-위기-fallback-안내에-핫라인-번호-포함-여부) (fallback 핫라인 번호), [#4](./OPEN_ISSUES.md#4-위기-이후-지속-대화-시-안내-배너-표시-여부) (지속 대화 안내 배너 — 이번 커밋에서는 추가 안 함)

## 목표

위기 관련 처리에서 발견된 크래시·UI 누락·잘못된 세션 종료를 한 커밋에서 같이 정리한다.

## 배경

1. `crisis.resources`가 severity 1에서는 `null`인데 `.hotlines`에 바로 접근해서 크래시 발생
2. `CAUTIOUS_SPECULATIVE` 경로에서 출력단계 위기 재분류 시 `crisis` 이벤트 없이 `is_crisis_flagged=true`만 오는 비대칭이 있음 ([CHAT_BACKEND_QUESTIONS §5](../CHAT_BACKEND_QUESTIONS.md#5-cautious_speculative-경로--출력단계-위기-재분류-시-crisis-이벤트-누락-수정-요청)에 백엔드 수정 요청해뒀으나, 응답 전까지 프론트도 fallback 필요)
3. `crisis_flow` 수신 시 프론트가 즉시 `endSession()`을 호출하는데, 서버는 세션을 종료시키지 않음 — 서버-클라 상태 불일치

## 변경 대상 파일

- `src/features/chat/hooks/useChatSse.ts`
- `src/features/chat/components/MessageBubble.tsx` (필요 시 확인만, 이미 `crisisResources` 없을 때 카드 숨김 처리됨)

## 구현 체크리스트

- [ ] `handleCrisis`: `data.resources?.hotlines`로 옵셔널 체이닝 적용
- [ ] `handleDone`: `is_crisis_flagged && finished_reason === 'replaced_by_guard'`(= `crisis` 이벤트 없이 온 위기) 감지 시, fallback 안내를 메시지로 직접 추가 — 핫라인 번호 없는 진정 유도 문구로 구현 ([OPEN_ISSUES.md #1](./OPEN_ISSUES.md#1-위기-fallback-안내에-핫라인-번호-포함-여부) 임시 처리, 결정 나면 후속 커밋으로 번호 추가 여부 반영)
- [ ] `handleDone`에서 `finished_reason === 'crisis_flow'`일 때 호출하던 `store.endSession()` 제거
- [ ] 위기 메시지 수신 후에도 입력창이 비활성화되지 않고 계속 대화 가능한지 확인 (현재 `endSession()` 제거에 따른 부작용 점검). 지속 대화 안내 배너는 이번 커밋에서 추가하지 않음 ([OPEN_ISSUES.md #4](./OPEN_ISSUES.md#4-위기-이후-지속-대화-시-안내-배너-표시-여부))

## 커밋 메시지

```
fix: 위기 감지 처리 보강 및 세션 자동 종료 제거

- crisis.resources null 가드 추가
- is_crisis_flagged 기반 fallback 안내 추가 (crisis 이벤트 누락 케이스 대응, 핫라인 번호 포함 여부는 별도 결정 예정)
- crisis_flow 수신 시 세션을 자동 종료하던 로직 제거 (서버는 세션을 종료하지 않음)

related to: #21
```
