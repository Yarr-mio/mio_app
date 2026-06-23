# 06. `summary_status` viewed/failed 케이스 처리

> 상태: 완료
> 로그: [logs/06-summary-status-handling.md](../../logs/06-summary-status-handling.md)
> 관련: [CHAT_FRONTEND_TASKS.md §6](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 2-2](../CHAT_SERVER_GAP_ANALYSIS.md#2-2-summary_status-enum-값-누락)
> 결정 사항: [GAP_ANALYSIS §0-1](../CHAT_SERVER_GAP_ANALYSIS.md#0-1-결정-사항-2026-06-22-점검) — failed 시 실패 안내 + 재시도 버튼

## 목표

`summary_status`의 4가지 값(`pending`/`done`/`viewed`/`failed`) 중 타입에 빠져있던 `viewed`/`failed`를 추가하고, 특히 `failed`를 화면에서 처리한다.

## 배경

현재 FE 타입엔 `'pending' | 'done'`만 있다. `failed`(요약 생성 실패)를 처리하지 않으면 `summary`가 계속 `null`이라 요약 화면이 로딩 스피너에서 영원히 멈춘다. 이 작업은 타입 추가까지만 다루고, 실제 화면 처리는 [07번 작업](./07-session-summary-redesign.md)에서 폴링 훅과 함께 구현한다.

## 변경 대상 파일

- `src/types/chat.ts`

## 구현 체크리스트

- [ ] `EndSessionResponse.summary_status` 및 관련 타입에 `'viewed' | 'failed'` 추가
- [ ] `summary_status`를 참조하는 곳에서 타입 에러가 나는지 확인 (나면 07번에서 같이 처리하도록 TODO 표시)

## 커밋 메시지

```
fix: summary_status의 viewed/failed 케이스 처리

- 타입에 viewed/failed 추가
- failed 시 화면 처리를 위한 선행 타입 정리 (실제 UI는 07번 작업에서 구현)

related to: #21
```
