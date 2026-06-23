# 02. delta.replace 이벤트 핸들러 추가 — 작업 로그

> 연결된 작업 문서: [chat-impl/02-delta-replace-handler.md](../chat-impl/02-delta-replace-handler.md)
> 이 파일은 실제 구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

- `SseDeltaReplaceData` 타입 추가, `finished_reason`에 `'replaced_by_guard'` 추가.
- `chatStore.replaceMessageContent(msgId, content)` 액션 추가 — `appendDelta`와 달리 content를 누적이 아니라 덮어쓴다.
- `useChatSse.handleDeltaReplace`: `confirmStreamingMessageId`를 먼저 호출해 placeholder id 전환을 보장한 뒤 `replaceMessageContent` 호출 (01번에서 만든 id 확정 로직과 동일하게 동작해야 해서 재사용).
- 수동 테스트용으로 입력창에 "교체테스트"를 입력하면 mock이 `delta` 일부 → `delta.replace` → `done(finished_reason: 'stop')` 시나리오를 재생하도록 `runMockDeltaReplaceScenario` 추가. `ChatHeader`의 기존 `TestSocraticFlowButton`과 같은 임시 테스트 스캐폴딩 성격이며, 11번 작업(mock 제거)에서 같이 삭제될 코드.
