# 04. 감정 슬라이더 트리거를 `is_socratic` 기반으로 전환 — 백엔드 수정 대응 계획

> ⚠️ **대체됨 (2026-06-25)**: 이 문서는 §5에서 "계약 유지, 판정 로직만 정확해짐(시나리오 A)"을 기본 가정으로 깔았으나, 실제 배포된 변경은 시나리오 B(필드·엔드포인트 자체가 교체됨)였다. 새 스펙 기준 분석/계획은 [05-cbt-completion-emotion-slider-plan.md](./05-cbt-completion-emotion-slider-plan.md) 참고. 본 문서는 배경 기록으로만 남김.
>
> 작성일: 2026-06-24
> 상태: 🟡 백엔드 수정 대기 — 백엔드가 `is_socratic` 판정 로직을 고쳐주기로 인지/확정함 (구체적 수정 내용은 미확정)
> 관련: [03-backend-fixes-applied.md §8](./03-backend-fixes-applied.md#8-socratic소크라테스식-질문-식별-필드--신규-구현-단순화된-판정-방식-), [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요)(결정 변경 — 본 문서로 대체), [trouble-impl/04-is-socratic-type-only.md](../trouble-impl/04-is-socratic-type-only.md)(이 작업으로 범위 확장), [CHAT_BACKEND_QUESTIONS_NOTION.md §7](../CHAT_BACKEND_QUESTIONS_NOTION.md#7-socratic소크라테스식-질문-식별-필드-추가-요청)
> 변경 사유: 사용자(기획) 확인 — "감정 슬라이더는 원래 소크라테스식 질문이 들어오고 그에 대한 답변을 마치면 뜨는 것"이 의도된 흐름이며, 이번에 보고된 "매 응답마다 슬라이더가 뜨는" 버그를 백엔드도 인지하고 `is_socratic` 판정 로직을 수정해주기로 함

## 1. 원래 의도된 흐름

1. AI가 소크라테스식 질문(CBT 개입)으로 응답한다.
2. 사용자가 그 질문에 대한 답을 입력해서 보낸다.
3. **사용자가 답변을 "마친" 직후** — AI의 추가 응답을 기다리지 않고 — 감정 강도 슬라이더(`EmotionScorePanel`)가 뜬다.
4. 사용자가 슬라이더로 현재 감정 강도를 표시하고 "완료"를 누르면 패널이 닫히고 대화가 이어진다.

이 흐름은 실제로 [useChatSse.ts:62-85](../../src/features/chat/hooks/useChatSse.ts#L62-L85)의 `sendMessage()`에 이미 코드로 남아 있다 — 즉 원래 설계자가 의도했던 그 트리거 로직이다.

```ts
const isSocraticReply = lastMessage?.role === 'ai' && lastMessage.type === 'socratic';
store.addMessage({ id: `user-${Date.now()}`, role: 'user', type: 'normal', content, ... });
if (isSocraticReply) {
  store.activateEmotionScoring(50); // 직전 AI 메시지가 socratic이면 SSE 호출 없이 바로 슬라이더
  return;
}
```

문제는 `lastMessage.type === 'socratic'`이 **실제 대화에서는 절대 true가 될 수 없다**는 점이다 (2장 참고). 그래서 이 의도된 분기는 지금까지 한 번도 실제로 발동한 적이 없는 죽은 코드였다.

## 2. 현재 상황 — 무엇이 어떻게 깨져 있는지

### 2-1. 메시지에 `socratic` 타입이 절대 부여되지 않음

- 실제 SSE 흐름([useChatSse.ts:101-107](../../src/features/chat/hooks/useChatSse.ts#L101-L107) `handleSessionMeta`)은 AI 메시지를 항상 `type: 'normal'`로 추가한다.
- `type: 'socratic'`을 주입하는 곳은 코드 전체에서 [ChatHeader.tsx:13-22](../../src/features/chat/components/ChatHeader.tsx#L13-L22)의 임시 테스트 버튼(`TestSocraticFlowButton`) 하나뿐이다.
- 따라서 1장의 `isSocraticReply` 분기는 테스트 버튼을 누르지 않는 한 항상 `false`다.

### 2-2. 그런데도 슬라이더는 매번 뜬다 — 전혀 다른 경로

[useChatSse.ts:154-159](../../src/features/chat/hooks/useChatSse.ts#L154-L159) `handleDone()`이 별도로 슬라이더를 켜는 코드를 갖고 있다:

```ts
if (typeof data.emotion_score === 'number') {
  useChatStore.getState().activateEmotionScoring(data.emotion_score);
}
```

이건 `is_socratic`/socratic 여부와 **무관하게**, `done` 이벤트에 숫자형 `emotion_score`만 있으면 무조건 슬라이더를 켠다. [SSE_SPEC.md:157](../SSE_SPEC.md#L157)에 따르면 `emotion_score`는 `UserMessageSignalAnalyzer`가 **사용자 입력**을 키워드 매칭해 25/45/70 중 하나로 산출하는 값으로, 소크라테스 여부와 무관하게 거의 매 턴 채워진다. 그 결과 실제로는 이 경로가 매번 발동해서 "모든 응답 뒤에 슬라이더가 뜬다"는 증상이 나온 것.

### 2-3. 백엔드의 `is_socratic` 자체도 아직 못 믿을 신호였음

백엔드는 이미 `done.is_socratic: boolean`을 구현해 보내고 있지만 ([03-backend-fixes-applied.md §8](./03-backend-fixes-applied.md#8-socratic소크라테스식-질문-식별-필드--신규-구현-단순화된-판정-방식-)), 판정 로직이 "AI 응답 텍스트에 물음표가 하나라도 있는지"였다:

```java
private boolean detectSocratic(String content) {
    return content.contains("?") || content.contains("？");
}
```

일반적인 안부 질문("오늘 기분은 좀 어떠세요?")에도 `true`가 찍히는 수준이라, 이 필드를 그대로 트리거에 연결하면 일반 대화에서도 사용자의 다음 입력이 무시되고 슬라이더만 뜨는 또 다른 회귀가 생길 위험이 있었다 — 이 위험 때문에 [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요)에서 "연동 보류(A안)"를 권장해뒀던 상태였다.

**지금 상황**: 백엔드가 이 판정 로직 자체를 고쳐주기로 했다 (사용자/기획 확인, 2026-06-24). 즉 §2-2에서 보류했던 이유(오탐 위험)가 해소될 예정이므로, 연동을 진행하는 쪽으로 결정이 바뀐다.

## 3. 프론트 현재 구현 상세 (변경 전 기준)

| 파일                                                                                                                                                                | 역할                                                                        | 비고                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [types/chat.ts:4](../../src/types/chat.ts#L4)                                                                                                                       | `ChatMessageType = 'normal' \| 'socratic' \| 'crisis'`                      | 타입은 이미 존재                                                                                                                                        |
| [types/chat.ts:44-52](../../src/types/chat.ts#L44-L52)                                                                                                              | `SseDoneData`                                                               | `is_socratic: boolean` 필드는 이미 추가됨([trouble-impl/04](../trouble-impl/04-is-socratic-type-only.md) 완료, 커밋 `c18bda3`) — 단, 어디서도 읽지 않음 |
| [chatStore.ts:62-75](../../src/features/chat/store/chatStore.ts#L62-L75)                                                                                            | `addMessage`/`appendDelta`/`replaceMessageContent`                          | 메시지의 `type`을 사후에 바꾸는 액션 없음                                                                                                               |
| [chatStore.ts:95-100](../../src/features/chat/store/chatStore.ts#L95-L100)                                                                                          | `activateEmotionScoring`/`deactivateEmotionScoring`                         | 트리거 조건은 호출하는 쪽(`useChatSse`)에 있음                                                                                                          |
| [useChatSse.ts:62-85](../../src/features/chat/hooks/useChatSse.ts#L62-L85)                                                                                          | `sendMessage` — `isSocraticReply` 분기                                      | 의도된 트리거. 현재 죽은 코드. 발동 시 SSE 호출(`performSendMessage`) 자체를 건너뜀                                                                     |
| [useChatSse.ts:154-164](../../src/features/chat/hooks/useChatSse.ts#L154-L164)                                                                                      | `handleDone` — `emotion_score` 존재 시 무조건 슬라이더 활성화               | 실제로 매번 발동하는 경로. socratic 여부 미확인                                                                                                         |
| [MessageBubble.tsx:57-73](../../src/features/chat/components/MessageBubble.tsx#L57-L73), [:118-131](../../src/features/chat/components/MessageBubble.tsx#L118-L131) | `type === 'socratic'`일 때만 `SocraticBubble`(라벨 "OOO의 질문") 렌더링     | 실제로는 절대 안 그려짐                                                                                                                                 |
| [ChatHeader.tsx:13-36](../../src/features/chat/components/ChatHeader.tsx#L13-L36)                                                                                   | `TestSocraticFlowButton`                                                    | socratic 흐름을 검증할 유일한 수단 (실연동 전까지 유지하기로 했던 임시 버튼)                                                                            |
| [ChatMain.tsx:53-57](../../src/features/chat/components/ChatMain.tsx#L53-L57)                                                                                       | `emotionScoringActive`로 `EmotionScorePanel` ↔ `ChatInputBar` 배타적 렌더링 | 변경 불필요 (이미 store 플래그만 봄)                                                                                                                    |

## 4. 백엔드 수정 계획 (현재 알려진 것)

- 백엔드가 `detectSocratic()`의 "물음표 포함 여부" 판정을 더 신뢰할 수 있는 방식으로 교체해주기로 함. 구체적 구현(예: 실제 CBT 개입 타입 추적용 `WorkingMemory.socratic_count`와 연결하는 방식인지, 별도 분류기를 두는지)은 아직 전달받지 않음.
- **계약(wire format)은 유지된다고 가정**: `done` 이벤트의 `is_socratic: boolean` 필드 자체는 그대로 두고, 값을 만드는 로직만 정확해짐. (필드명/위치가 바뀌는 경우는 5장의 시나리오 B 참고.)

## 5. 백엔드 수정 시나리오별 프론트 대응

### 시나리오 A — 계약 유지, 판정 로직만 정확해짐 (기본 가정)

`done.is_socratic`을 그대로 신뢰하고 6장의 체크리스트대로 연동한다. 추가 확인 사항:

- 일반 안부 질문에 더 이상 `true`가 안 찍히는지 백엔드 변경 후 실기기에서 재검증.
- SECURITY_REFUSAL/CRISIS_FLOW/FALLBACK(error) 경로는 여전히 `is_socratic=false`로 하드코딩되는지 유지 확인 (현재 문서상 그렇게 합리적으로 처리되고 있음).

### 시나리오 B — 필드/계약이 바뀜 (예: `intervention_type` enum으로 교체, 또는 `delta`/별도 이벤트로 이동)

- `types/chat.ts`의 `SseDoneData`(또는 새 이벤트 타입)를 새 계약에 맞게 갱신.
- 6장 체크리스트의 "`is_socratic` 읽는 지점"만 새 필드 읽는 코드로 교체 — 트리거/스토어 구조 변경은 동일하게 유지 가능.
- 이 경우 본 문서를 갱신해 실제 계약을 다시 기록할 것.

## 6. 프론트 구현 체크리스트 (시나리오 A 기준, 백엔드 배포 후 진행)

- [x] `types/chat.ts` `SseDoneData`에 `is_socratic: boolean;` 추가 — [trouble-impl/04-is-socratic-type-only.md](../trouble-impl/04-is-socratic-type-only.md)에서 이미 완료(커밋 `c18bda3`)
- [ ] `chatStore.ts`에 메시지 타입을 사후 변경하는 액션 추가 (예: `setMessageType(msgId, type)`) — 스트리밍 중엔 `type: 'normal'`로 추가됐다가 `done` 시점에 `is_socratic`을 알게 되므로, 완료 후 타입을 바꿔줄 방법이 필요함
- [ ] `useChatSse.ts` `handleDone`:
  - [ ] `data.is_socratic`이 true면 `setMessageType(data.msg_id, 'socratic')` 호출
  - [ ] `emotion_score` 존재만으로 슬라이더를 켜던 기존 분기(`if (typeof data.emotion_score === 'number') activateEmotionScoring(...)`) 제거
- [ ] `useChatSse.ts` `sendMessage`의 `isSocraticReply` 분기는 로직 그대로 유지 (이제 실제로 발동 가능해짐) — 단, 7장의 "초기 슬라이더 값" 결정에 따라 `activateEmotionScoring(50)`의 하드코딩 값 처리 방식만 조정될 수 있음
- [ ] `MessageBubble.tsx`의 `SocraticBubble`(:58) TODO 주석 제거 — 이제 실제 백엔드 신호로 결정됨
- [ ] `ChatHeader.tsx`의 `TestSocraticFlowButton`(:13-36) 제거 — 실연동 검증이 끝나면 더 이상 필요 없는 임시 버튼
- [ ] 회귀 확인: 일반 대화(소크라테스 아닌 질문 포함)에서 슬라이더가 뜨지 않는지, 실제 소크라테스 질문 뒤에만 뜨는지 실기기 테스트

## 7. 결정/확인 필요 사항

1. **소크라테스 답변을 서버로 전송할지 여부** — 현재 `isSocraticReply` 분기는 사용자의 답변을 로컬 UI에만 추가하고 `performSendMessage`(실제 SSE 호출)를 완전히 건너뛴다. 즉 AI는 사용자가 그 질문에 뭐라고 답했는지 전혀 모르게 된다. 원래 의도된 흐름이 맞는지, 아니면 답변도 서버로 보내되 응답 스트리밍만 생략(또는 무시)하는 방식으로 바꿔야 하는지 확인 필요 — 대화 컨텍스트 손실 가능성이 있어 짚어두는 부분.
2. **슬라이더 초기값 출처** — 현재 `activateEmotionScoring(50)`은 고정값 50을 쓴다. 소크라테스 응답의 `done.emotion_score`(서버 추정치)를 초기값으로 쓰는 게 더 자연스러워 보이는데, 그러려면 `ChatMessage`에 `emotion_score`를 들고 있어야 함 (현재 타입에 없음). 그대로 50을 쓸지, 메시지별 emotion_score를 보관해 초기값으로 쓸지 결정 필요.
3. **슬라이더로 받은 점수의 최종 제출처** — [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-1](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-1-감정-점수-제출-흐름-재설계-결정-필요)에서 다루는 별개 결정 사항(신규 제출 엔드포인트가 세션 단위·세션 종료 후에만 호출 가능)과 맞물린다. 이 문서는 "언제 슬라이더를 띄울지"만 다루고, "띄운 뒤 받은 값을 어디로 제출할지"는 §2-1 결정을 따른다 — 두 결정이 서로 다른 작업으로 진행되더라도 최종 동작이 충돌하지 않는지 합칠 때 한 번 더 확인 필요.

## 8. 영향 받는 기존 문서 (백엔드 배포 후 갱신)

- [CHAT_FRONTEND_FOLLOWUP_PLAN.md §2-2](../CHAT_FRONTEND_FOLLOWUP_PLAN.md#2-2-is_socratic-실연동-여부-결정-필요) — "연동 보류(A안) 권장" → 본 문서로 결정 변경됨, 포인터 추가됨
- [trouble-impl/04-is-socratic-type-only.md](../trouble-impl/04-is-socratic-type-only.md) — "타입만 추가, 실연동 제외"였던 범위가 본 문서로 확장됨
- [trouble-impl/00-INDEX.md](../trouble-impl/00-INDEX.md) — 4번 작업 상태/범위 갱신 필요
- [SSE_SPEC.md §5](../SSE_SPEC.md) `DoneData` — `is_socratic` 필드는 이미 추가됨(`is_socratic: boolean; // AI 응답에 물음표 포함 여부로만 판정...`). 백엔드 판정 로직이 실제로 수정되면 이 주석도 "오탐 가능" 설명을 제거하도록 갱신 필요
