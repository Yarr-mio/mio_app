# 10. 세션 시작 실패 에러 코드별 분기 처리

> 상태: 완료
> 로그: [logs/10-session-start-error-handling.md](../../logs/10-session-start-error-handling.md)
> 관련: [CHAT_FRONTEND_TASKS.md §10](../CHAT_FRONTEND_TASKS.md), [API_SPEC.md 주요 에러 코드](../API_SPEC.md#주요-에러-코드-선택-발췌)
> 결정 사항 (2026-06-23): 화면 이동 전 짧은 토스트 안내를 먼저 보여줌 (안내 없이 즉시 이동하지 않음)

## 목표

`POST /v1/sessions` 실패 시 에러 코드별로 사용자에게 의미 있는 안내를 보여준다. 현재는 전혀 처리가 없다.

## 배경

`ONBOARDING_REQUIRED`(403)와 `SESSION_ALREADY_ACTIVE`(409)는 단순 에러 토스트로 뭉뚱그리면 사용자가 무엇을 해야 할지 알 수 없다. 각각 의미있는 다음 행동(온보딩 이동 / 기존 세션으로 재진입)이 있다.

## 변경 대상 파일

- `src/features/chat/hooks/useChat.ts` (`useStartChatSession`)
- `src/app/(main)/chat/index.tsx`

## 구현 체크리스트

- [ ] `useStartChatSession`의 에러 핸들러에서 `ErrorResponse.error.code` 분기 추가
- [ ] `ONBOARDING_REQUIRED` → 짧은 토스트 안내 표시 후 온보딩 플로우로 라우팅 (안내 없이 즉시 이동하지 않음)
- [ ] `SESSION_ALREADY_ACTIVE` → 짧은 토스트 안내 표시 후 `useActiveSession` 재조회 → `ChatMain`(active)으로 재진입
- [ ] 그 외 에러 코드 → 공통 에러 토스트
- [ ] 세 가지 케이스를 모두 mock으로 강제 발생시켜 확인

## 커밋 메시지

```
feature: 세션 시작 실패 에러 코드별 분기 처리 추가

- ONBOARDING_REQUIRED, SESSION_ALREADY_ACTIVE 에러 코드별 안내/리다이렉트 처리
- 기타 에러는 공통 토스트로 처리

related to: #21
```
