# 05. `GET /sessions/active` 응답 모델 교체

> 상태: 완료
> 로그: [logs/05-active-session-response.md](../../logs/05-active-session-response.md)
> 관련: [CHAT_FRONTEND_TASKS.md §5](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 2-1](../CHAT_SERVER_GAP_ANALYSIS.md#2-1-getsessionsactive-응답-모델-전체가-다름)
> 결정 사항 (2026-06-23): 앱 재진입 시 못 본 요약이 있으면 자동으로 요약 화면으로 리다이렉트
> 미결 이슈: [OPEN_ISSUES.md #2](./OPEN_ISSUES.md#2-summary_status-doneviewed-전환-시점-불명) — `viewed` 전환 시점 불명. 무한 리다이렉트 방지용 로컬 가드는 이슈 해결과 무관하게 이번 작업에서 같이 추가

## 목표

활성 세션이 없을 때도 서버는 객체(필드 전부 `null`)를 반환한다는 실제 스펙에 맞게 타입/호출부를 고친다.

## 배경

현재 `ActiveSession` 타입은 모든 필드가 non-null이고 `fetchActiveSession()`은 "활성 세션 없으면 `null` 자체 반환"이라고 가정한다. 실제로는 응답이 항상 객체이므로, mock을 떼는 순간 `if (activeSession)` 분기가 항상 truthy가 되어 세션이 없는데도 `startSession()`이 호출되는 버그가 생긴다.

## 변경 대상 파일

- `src/types/chat.ts`
- `src/api/endpoints/chat.ts`
- `src/app/(main)/chat/index.tsx`

## 구현 체크리스트

- [ ] `ActiveSessionResponse` 타입을 실제 서버 구조로 교체: `session_id`/`character_id`/`status`/`started_at`/`last_message_at`/`message_count`/`last_summary_status`/`last_ended_session_id` 전부 `| null`
- [ ] `fetchActiveSession()`이 항상 객체를 반환하도록 수정 (mock도 동일 구조로)
- [ ] `chat/index.tsx`: `if (activeSession)` 대신 `if (activeSession.session_id)`로 분기 변경
- [ ] `chat/index.tsx`: `last_summary_status`가 `pending`/`done`/`failed`이고 `last_ended_session_id`가 있으면 `SessionStart` 대신 세션 요약 화면으로 리다이렉트 (`viewed`면 이미 본 것이므로 평소 분기 유지)
- [ ] 무한 리다이렉트 방지용 로컬 가드 추가: 리다이렉트로 한 번 보여준 `last_ended_session_id`를 로컬(예: `AsyncStorage`)에 기록해, 서버 상태가 `viewed`로 안 바뀌어도 같은 세션으로 반복 리다이렉트하지 않게 함 ([OPEN_ISSUES.md #2](./OPEN_ISSUES.md#2-summary_status-doneviewed-전환-시점-불명) 임시 처리)
- [ ] 요약 화면이 `chatStore.sessionId`가 아니라 외부에서 전달된 `last_ended_session_id`로도 동작해야 함 — [07번 작업](./07-session-summary-redesign.md)의 `useSessionSummary(sessionId)` 훅이 라우트 파라미터로 받은 sessionId를 그대로 쓰는지 확인

## 커밋 메시지

```
fix: 활성 세션 조회 응답 모델을 서버 스펙에 맞게 수정

- ActiveSessionResponse 타입을 전부 nullable 필드 구조로 교체, last_summary_status/last_ended_session_id 추가
- fetchActiveSession이 항상 객체를 반환하도록 수정, 호출부 분기 로직 수정
- last_summary_status가 미확인 상태면 요약 화면으로 자동 리다이렉트하는 재진입 로직 추가, 무한 리다이렉트 방지 로컬 가드 포함

related to: #21
```
