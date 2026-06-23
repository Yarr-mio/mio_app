# 01. 메시지 ID 체계 재설계 — 작업 로그

> 연결된 작업 문서: [chat-impl/01-message-id-refactor.md](../chat-impl/01-message-id-refactor.md)
> 이 파일은 실제 구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

- `chatStore`에 `confirmStreamingMessageId(outboundMsgId)` 액션 추가. `streamingMessageId`를 placeholder id → 확정 id로 전환하면서 `messages` 배열의 해당 메시지 id도 같이 갱신한다.
- `handleSessionMeta`: AI 메시지를 `pending-ai-${inboundMsgId}` placeholder id로 추가 (기존엔 `data.message_id`를 그대로 AI 메시지 id로 써서 실서버에서는 delta가 영원히 안 붙는 버그였음).
- `handleDelta`: 매 호출마다 `confirmStreamingMessageId(data.msg_id)`를 먼저 호출 — placeholder와 다르면 그 시점에 한 번만 치환되고, 이후 호출은 이미 같은 id라 스킵됨.
- `runMock`도 `msg_in_mock_*`/`msg_out_mock_*`로 inbound/outbound id를 분리 발급해 회귀 테스트 가능하게 함.
