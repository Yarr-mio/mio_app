# 04. `is_socratic` 타입 추가 (실연동 제외)

> 상태: ✅ 완료 — ⚠️ 후속 범위 확장됨, [chat-trouble-shoot/04-socratic-emotion-slider-plan.md](../chat-trouble-shoot/04-socratic-emotion-slider-plan.md) 참고 (백엔드가 판정 로직을 고쳐주기로 해 "실연동 제외"였던 결정이 실연동 진행으로 변경됨)
> 로그: 트러블슈팅/결정 사항 없어 생성하지 않음
> 관련: [chat-trouble-shoot/03-backend-fixes-applied.md §8](../chat-trouble-shoot/03-backend-fixes-applied.md#8-socratic소크라테스식-질문-식별-필드--신규-구현-단순화된-판정-방식-), [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요)
> 선행 작업: 없음 (다른 작업과 독립적)

## 목표

`done` 이벤트에 새로 추가된 `is_socratic` 필드를 타입에는 반영하되, **실제 메시지 타입 분기나 흐름 제어에는 연결하지 않는다.** 타입과 스펙 문서만 현실에 맞추는 작업이고, 실연동 여부는 별도 결정 대기 중이다.

## 배경

백엔드가 `done` 이벤트에 `is_socratic: boolean`을 추가했지만, 판정 로직이 "AI 응답에 물음표가 하나라도 포함됐는지"로 단순화돼 있어(`03-backend-fixes-applied.md` §8) 일반적인 안부 질문에도 `true`가 찍힐 수 있다. 현재 [useChatSse.ts:62-85](../../src/features/chat/hooks/useChatSse.ts)의 `sendMessage`는 "직전 AI 메시지가 `socratic` 타입이면 다음 사용자 메시지는 실제 SSE 호출 없이 곧바로 `EmotionScorePanel`을 띄운다"는 분기를 갖고 있어서, `is_socratic`을 그대로 연동하면 일반 대화에서도 사용자의 다음 입력이 무시되고 감정 패널만 뜨는 회귀가 생길 위험이 크다. 이 위험 때문에 실연동은 [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요)에서 별도 결정 사항으로 보류해뒀다. 이 작업은 그중 "타입 추가"만 떼어내 먼저 처리한다.

## 변경 대상 파일

- [src/types/chat.ts](../../src/types/chat.ts) — `SseDoneData` 인터페이스
- [src/features/chat/components/MessageBubble.tsx](../../src/features/chat/components/MessageBubble.tsx) — `SocraticBubble`의 TODO 주석만 (동작 변경 없음)

## 구현 체크리스트

- [x] `SseDoneData`(`:44-51`)에 `is_socratic: boolean;` 필드 추가
- [x] 기존 주석 `// TODO: 소크라테스 질문 식별 필드 백엔드 확인 필요 (message_type?: 'socratic')` 제거 — 필드는 이제 존재하므로 "확인 필요" 자체는 해소됐지만, 대신 "판정 로직이 단순(물음표 포함 여부)하므로 실연동 보류 중 — `CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2` 참고"로 교체
- [x] `handleDone`(`useChatSse.ts`)에서 `data.is_socratic`을 **참조하지 않는지** 확인 — 실수로 분기에 연결하지 않도록 하는 게 이 작업의 핵심 제약
- [x] `MessageBubble.tsx`의 `SocraticBubble`(`:57-73`) 주석 `// TODO: SSE 응답에서 socratic 타입 식별 필드 백엔드 확인 필요`도 동일하게 "필드는 존재하지만 실연동 보류 중"으로 갱신 (이 컴포넌트의 동작 자체는 변경 없음 — 여전히 `ChatHeader`의 테스트 버튼으로만 트리거됨)

## 명시적으로 하지 않는 것

- `sendMessage`의 `isSocraticReply` 분기를 `is_socratic` 기반으로 바꾸지 않는다.
- `ChatHeader.tsx`의 `TestSocraticFlowButton`을 제거하지 않는다 (실연동 전까지 유일한 흐름 검증 수단).
- `MessageBubble`이 실제 SSE 응답을 보고 `socratic` 타입을 부여하도록 바꾸지 않는다.

## 커밋 메시지

```
fix: SseDoneData에 is_socratic 필드 추가 (실연동 제외)

- 백엔드 done 이벤트에 추가된 is_socratic 필드를 타입에 반영
- 판정 로직이 단순(물음표 포함 여부)해 오탐 위험이 커 실제 분기 연동은 보류

related to: #21
```
