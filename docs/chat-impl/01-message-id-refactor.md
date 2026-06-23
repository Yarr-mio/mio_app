# 01. 메시지 ID 체계 재설계 (inbound/outbound 분리)

> 상태: 미착수
> 로그: [logs/01-message-id-refactor.md](../../logs/01-message-id-refactor.md)
> 관련: [CHAT_FRONTEND_TASKS.md §1](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 1-1](../CHAT_SERVER_GAP_ANALYSIS.md#1-1-session_meta의-message_id-오용--delta가-영원히-붙지-않음)

## 목표

`session_meta.message_id`(사용자 메시지 id, inboundMsgId)와 `delta.msg_id`(AI 메시지 id, outboundMsgId)가 서로 다른 값이라는 전제로 메시지 추적 구조를 다시 짠다.

## 배경

현재 mock은 `session_meta`와 `delta` 양쪽에 동일한 id를 써서 우연히 동작하지만, 실서버는 두 id가 다르다. `session_meta` 수신 시점엔 아직 AI 메시지의 실제 id(`outboundMsgId`)를 모르기 때문에, 빈 AI 메시지를 임시 키로 추적하다가 최초 `delta` 수신 시 그 `msg_id`로 메시지 id를 확정해야 한다.

## 변경 대상 파일

- `src/features/chat/store/chatStore.ts`
- `src/features/chat/hooks/useChatSse.ts`

## 구현 체크리스트

- [ ] `chatStore`에 "현재 스트리밍 중인 AI 메시지"를 가리키는 임시 키(예: 기존 `streamingMessageId`를 이 용도로 재정의) 도입
- [ ] `handleSessionMeta`: 사용자 메시지 ack로만 처리 (AI 메시지 생성 트리거 아님). 빈 AI 메시지를 만들 때 `outboundMsgId`를 모르는 상태로 placeholder 처리
- [ ] `handleDelta`: 최초 `delta` 수신 시 placeholder 메시지의 id를 `data.msg_id`(실제 outboundMsgId)로 확정, 이후 delta는 해당 id로 누적
- [ ] `appendDelta`가 placeholder→확정 id 전환 이후에도 정상 동작하는지 확인
- [ ] mock(`runMock`)도 동일하게 inbound/outbound id를 다르게 발급하도록 수정해 회귀 테스트 가능하게 함

## 커밋 메시지

```
fix: SSE 메시지 ID 체계를 inbound/outbound로 분리

- session_meta(사용자 메시지 id)와 delta(AI 메시지 id)를 별도로 추적하도록 chatStore/useChatSse 구조 변경
- 실제 서버 연동 시 AI 응답이 화면에 안 붙는 문제 방지

related to: #21
```
