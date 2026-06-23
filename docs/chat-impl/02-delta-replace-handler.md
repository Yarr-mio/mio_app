# 02. `delta.replace` 이벤트 핸들러 추가

> 상태: 미착수
> 로그: [logs/02-delta-replace-handler.md](../../logs/02-delta-replace-handler.md)
> 관련: [CHAT_FRONTEND_TASKS.md §2](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 1-4](../CHAT_SERVER_GAP_ANALYSIS.md#1-4-deltareplace-이벤트-자체가-구현되어-있지-않음), [1-5](../CHAT_SERVER_GAP_ANALYSIS.md#1-5-donefinished_reason-타입-불일치)
> 선행 작업: [01-message-id-refactor](./01-message-id-refactor.md) (같은 id 추적 구조를 사용)

## 목표

`CAUTIOUS_SPECULATIVE` 경로에서 검증 실패 시 오는 `delta.replace` 이벤트(누적이 아니라 전체 교체)를 처리할 수 있게 한다.

## 배경

`types/chat.ts`엔 `SseDeltaData`만 있고 `DeltaReplaceData`/핸들러가 없다. `chatStore`에도 "통째로 교체"하는 액션이 없어 `appendDelta`만으로는 처리 불가능하다.

## 변경 대상 파일

- `src/types/chat.ts`
- `src/features/chat/store/chatStore.ts`
- `src/features/chat/hooks/useChatSse.ts`

## 구현 체크리스트

- [ ] `types/chat.ts`: `SseDeltaReplaceData { safe_response: string; msg_id: string }` 타입 추가
- [ ] `types/chat.ts`: `finished_reason` 유니온에 `'replaced_by_guard'` 추가
- [ ] `chatStore.ts`: `replaceMessageContent(msgId, content)` 액션 추가 (append 아니라 `content: content`로 덮어쓰기)
- [ ] `useChatSse.ts`: `event: delta.replace` 분기 추가, `handleDeltaReplace` 핸들러 작성
- [ ] mock에도 `delta.replace` 시나리오 1개 추가해 수동 테스트 가능하게 함 (테스트 버튼 또는 특정 입력 트리거)

## 커밋 메시지

```
feature: delta.replace 이벤트 처리 추가

- DeltaReplaceData 타입 및 finished_reason에 replaced_by_guard 추가
- chatStore에 메시지 내용을 통째로 교체하는 replaceMessageContent 액션 추가
- useChatSse에 delta.replace 이벤트 핸들러 연결

related to: #21
```
