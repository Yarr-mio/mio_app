# 05. 감정 슬라이더를 CBT 개입 완료 시점에만 띄우기 — 프론트 수정 계획

> 작성일: 2026-06-25
> 상태: 🟢 결정 완료 — 백엔드는 배포됨([04-cbt-emotion-score-redesign.md](./04-cbt-emotion-score-redesign.md) 기준), 5장 결정사항 확정(2026-06-25), 프론트 구현 대기
> 관련: [04-cbt-emotion-score-redesign.md](./04-cbt-emotion-score-redesign.md)(백엔드 변경 내용, 본 문서의 입력), [04-socratic-emotion-slider-plan.md](./04-socratic-emotion-slider-plan.md)(⚠️ 본 문서가 대체 — 1장 참고), [00-INDEX.md #4](./00-INDEX.md)
> 목적: "모든 AI 응답마다 감정 슬라이더가 뜨는" 버그를 고쳐서, 소크라테스식 CBT 개입이 실제로 끝난 시점에만 뜨도록 프론트를 새 백엔드 스펙에 맞춰 수정하는 계획. **코드를 직접 읽고 확인한 내용만 기술, 실제 수정은 별도 커밋(`trouble-impl/`)으로 진행.**

## 1. 이 문서가 04-socratic-emotion-slider-plan.md를 대체하는 이유

[04-socratic-emotion-slider-plan.md](./04-socratic-emotion-slider-plan.md)(2026-06-24 작성)는 "백엔드가 `detectSocratic()` 판정 로직만 정확하게 고쳐줄 것"이라 가정하고 그 문서의 §5에서 **시나리오 A(계약 유지, 판정 로직만 정확해짐)를 기본 가정**으로 체크리스트를 짰다. 실제로 배포된 변경은 그 문서가 "계약/필드가 바뀌는 경우"로 분류해뒀던 **시나리오 B**였다:

- `done` 이벤트에 필드 5개 신규 추가(`cbt_intervention_state`, `completion_reason`, `requires_emotion_score`, `emotion_score_target_id`, `emotion_score_phase`)
- 감정 점수 제출 엔드포인트가 `POST /v1/sessions/{sessionId}/emotion-score` → `POST /v1/cbt/reconstructions/{reconstructionId}/emotion-score`로 완전히 교체(세션 단위 → 개입 단위)
- `is_socratic` 판정이 물음표 검사 → LLM 분류기 기반 상태머신으로 교체되면서, **`is_socratic`만으로는 "슬라이더를 띄울지"를 결정할 수 없게 됨** — 그 역할은 `cbt_intervention_state`/`requires_emotion_score`/`emotion_score_target_id` 세 필드 조합으로 넘어갔다

즉 04 문서의 체크리스트(특히 §6)는 더 이상 실제 스펙과 맞지 않는다. 본 문서가 새 스펙 기준으로 다시 작성한 계획이며, 04 문서는 "왜 이런 우회였는지"에 대한 배경 기록으로만 남긴다.

## 2. 새 스펙에서 슬라이더를 띄우는 조건 (재정리)

[04-cbt-emotion-score-redesign.md §4·§6](./04-cbt-emotion-score-redesign.md)에 따르면:

```ts
data.finished_reason === 'stop' &&
  data.cbt_intervention_state === 'completed' &&
  data.requires_emotion_score === true &&
  data.emotion_score_target_id !== null;
```

네 조건을 **모두** 만족할 때만 슬라이더를 띄운다. `emotion_score_target_id`가 null이면 `requires_emotion_score` 값과 무관하게 띄우지 않는다(서버 쪽 reconstruction row 생성 실패 케이스가 실존함 — 04 문서 §4 경고 참고). `finished_reason !== 'stop'`인 턴(위기 대응, 보안 가드 교체 등)에서는 백엔드가 CBT 분류기를 호출하지 않아 `cbt_intervention_state`가 항상 `'none'`으로 고정되므로 자연히 위 조건을 만족하지 못하지만, 명시적으로 짚어 코드 가독성을 챙긴다.

## 3. 현재 프론트 구현의 문제점 (코드 확인)

| #   | 위치                                                                                                                                | 문제                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3-1 | [useChatSse.ts:172-174](../../src/features/chat/hooks/useChatSse.ts#L172-L174) `handleDone`                                         | `typeof data.emotion_score === 'number'`이기만 하면 무조건 슬라이더를 켠다. `emotion_score`는 [SSE_SPEC.md](../SSE_SPEC.md)상 사용자 입력을 키워드 매칭해 25/45/70 중 하나로 거의 매 턴 채워지는 값이라, **이게 인덱스 #4 버그("모든 응답마다 슬라이더 뜸")의 직접 원인**이다. `is_socratic`/`cbt_intervention_state`는 전혀 확인하지 않는다.                                                                                                                                                                                                                                                                                                                                                                                 |
| 3-2 | [useChatSse.ts:62-85](../../src/features/chat/hooks/useChatSse.ts#L62-L85) `sendMessage`의 `isSocraticReply` 분기                   | 직전 AI 메시지가 `type: 'socratic'`이면 사용자의 답변을 로컬 메시지로만 추가하고 **SSE 호출(`performSendMessage`) 자체를 건너뛴다**. 새 스펙에서는 `cbt_intervention_state`가 `completed`로 전이되는 판단을 백엔드 LLM 분류기가 "이번 턴 사용자 메시지"를 보고 내린다(04 문서 §5). 즉 사용자의 소크라테스 답변이 실제로 서버에 도달해야만 완료 전이·`emotion_score_target_id` 발급이 일어난다 — 이 분기는 더 이상 "아직 발동 안 하는 의도된 로직"이 아니라 **새 스펙에서 절대 발동하면 안 되는, 완료 전이를 영구히 막는 버그**가 된다. (현재는 `type: 'socratic'`이 실제 데이터로 세팅되는 경로가 없어 죽은 코드이긴 하지만, 4장 결정사항에서 `is_socratic` 기반 타입 마킹을 연동하면 바로 이 분기가 살아나 문제를 일으킨다.) |
| 3-3 | [useChatSse.ts:87-90](../../src/features/chat/hooks/useChatSse.ts#L87-L90) `confirmEmotionScore`                                    | `// TODO: 백엔드 emotion-score 제출 엔드포인트 추가되면 연동` 상태의 no-op — 패널을 닫기만 하고 어디에도 점수를 보내지 않는다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 3-4 | [chatStore.ts:36](../../src/features/chat/store/chatStore.ts#L36), [:111-112](../../src/features/chat/store/chatStore.ts#L111-L112) | `activateEmotionScoring(initialScore: number)`만 있고 `emotion_score_target_id`를 보관할 상태가 없다. 제출 시점에 어떤 reconstruction에 점수를 보내야 하는지 알 방법이 없다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3-5 | [types/chat.ts:44-52](../../src/types/chat.ts#L44-L52) `SseDoneData`                                                                | 신규 필드 5개가 타입에 없다. `is_socratic` 주석(`L49`)도 "물음표 포함 여부로 판정"이라는 옛 설명 그대로라, 지금 읽으면 이미 사실과 다르다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3-6 | [MessageBubble.tsx:57-58](../../src/features/chat/components/MessageBubble.tsx#L57-L58) `SocraticBubble`                            | `type === 'socratic'`일 때만 렌더링되는데, 실제 데이터로 이 타입이 세팅되는 경로가 코드 전체에 없다 — [ChatHeader.tsx:13-36](../../src/features/chat/components/ChatHeader.tsx#L13-L36)의 `TestSocraticFlowButton`(임시 테스트 버튼)만 트리거 가능.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## 4. 프론트 수정 계획

### 4-1. `types/chat.ts` — `SseDoneData` 갱신

```ts
export interface SseDoneData {
  msg_id: string;
  emotion_score?: number;
  is_crisis_flagged: boolean;
  is_socratic: boolean; // AI가 소크라테스식 질문을 던진 턴에서만 true. completed 전이 턴과는 별개 신호
  cbt_intervention_state: 'none' | 'socratic_asked' | 'followup_needed' | 'completed';
  completion_reason:
    | 'user_reframed_thought'
    | 'user_declined'
    | 'max_questions_reached'
    | 'stabilized'
    | 'not_applicable'
    | null;
  requires_emotion_score: boolean;
  emotion_score_target_id: string | null;
  emotion_score_phase: 'after' | null;
  finished_reason: 'stop' | 'crisis_flow' | 'security_refusal' | 'replaced_by_guard' | 'error';
}
```

`is_socratic` 주석을 새 판정 방식(LLM 분류기, `completed`와는 별개 신호)으로 갱신.

### 4-2. `chatStore.ts` — 제출 대상 ID 보관 + 메시지 타입 마킹

- `emotionScoreTargetId: string | null` 상태 추가.
- `activateEmotionScoring(initialScore, targetId)`로 시그니처 확장(또는 별도 `setEmotionScoreTargetId` 액션 — 4-3에서 호출 시점이 한 곳뿐이라 시그니처 확장이 더 단순).
- `deactivateEmotionScoring()`에서 `emotionScoreTargetId: null`로도 초기화.
- (5-1 결정에 따라 포함) 메시지의 `type`을 사후에 바꾸는 액션 `setMessageType(msgId, type: ChatMessageType)` 추가 — 스트리밍 중엔 항상 `type: 'normal'`로 추가됐다가, `done` 시점에 `is_socratic`을 알게 되므로 완료 후 타입을 바꿔줄 방법이 필요함.

```ts
setMessageType: (msgId, type) =>
  set((state) => ({
    messages: state.messages.map((msg) => (msg.id === msgId ? { ...msg, type } : msg)),
  })),
```

### 4-3. `useChatSse.ts` — 트리거/제출 로직 교체

**`handleDone`**: 기존 `typeof data.emotion_score === 'number'` 분기를 2장의 4조건 체크로 교체.

```ts
function handleDone(data: SseDoneData) {
  resetStreamingState();

  if (data.is_socratic) {
    useChatStore.getState().setMessageType(data.msg_id, 'socratic');
  }

  const shouldShowEmotionScore =
    data.finished_reason === 'stop' &&
    data.cbt_intervention_state === 'completed' &&
    data.requires_emotion_score &&
    data.emotion_score_target_id !== null;

  if (shouldShowEmotionScore) {
    useChatStore
      .getState()
      .activateEmotionScoring(data.emotion_score ?? 50, data.emotion_score_target_id);
  }
  if (data.is_crisis_flagged && data.finished_reason === 'replaced_by_guard') {
    handleCrisisFallback();
  }
}
```

(5-1 결정에 따라 `is_socratic` 마킹을 함께 포함. 5-2 결정에 따라 슬라이더 초기값은 `data.emotion_score`를 우선 사용하고 값이 없을 때만 `50`으로 폴백한다.)

**`sendMessage`**: `isSocraticReply` 분기와 그 분기가 참조하는 `lastMessage`/`isSocraticReply` 계산을 통째로 제거. 사용자의 모든 메시지(소크라테스 질문에 대한 답변 포함)는 항상 `performSendMessage`로 서버에 전송한다 — 3-2에서 짚었듯 이게 새 스펙에서 `completed` 전이가 일어나는 유일한 경로다.

**`confirmEmotionScore`**: no-op을 실제 제출로 교체. 기존 아키텍처 패턴([useChat.ts](../../src/features/chat/hooks/useChat.ts)의 `useEndChatSession`처럼 `api/endpoints/chat.ts` + react-query `useMutation` 조합)을 따르는 게 일관적이므로, `useChatSse` 안에서 직접 axios를 호출하기보다 아래 4-4·4-5로 분리할 것을 제안.

### 4-4. `api/endpoints/chat.ts` — 신규 제출 함수

```ts
export async function submitCbtEmotionScore(
  reconstructionId: string,
  score: number
): Promise<{ reconstruction_id: string; emotion_score_after: number; updated_at: string }> {
  if (USE_MOCK) {
    return {
      reconstruction_id: reconstructionId,
      emotion_score_after: score,
      updated_at: new Date().toISOString(),
    };
  }

  const { data } = await apiClient.post<
    ApiResponse<{
      reconstruction_id: string;
      emotion_score_after: number;
      updated_at: string;
    }>
  >(`/v1/cbt/reconstructions/${reconstructionId}/emotion-score`, { score });
  return data.data;
}
```

응답 타입은 별도 `types/chat.ts` 인터페이스(`CbtEmotionScoreResponse` 등)로 뽑아 다른 엔드포인트들과 일관되게 둘 것.

### 4-5. `useChat.ts` — mutation 훅 추가

```ts
export function useSubmitCbtEmotionScore() {
  return useMutation({
    mutationFn: ({ reconstructionId, score }: { reconstructionId: string; score: number }) =>
      submitCbtEmotionScore(reconstructionId, score),
    onSuccess: () => {
      useChatStore.getState().deactivateEmotionScoring();
    },
    onError: (error) => {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);
      // 409 CBT_SCORE_NOT_REQUIRED: 이미 제출 완료된 것으로 간주, 에러 토스트 없이 조용히 무시
      // (04-cbt-emotion-score-redesign.md §3 경고 참고 — 중복 탭/재시도 시 항상 발생하는 정상 케이스)
      if (status === HTTP_STATUS.CONFLICT && errorCode === 'CBT_SCORE_NOT_REQUIRED') {
        useChatStore.getState().deactivateEmotionScoring();
        return;
      }
      // 403/404는 예상치 못한 상태(타인 소유/존재하지 않는 ID) — 정상 흐름에서 발생하면 안 되므로
      // 재시도해도 다시 실패할 가능성이 높음. 패널을 닫고 일반 대화로 복귀시킨다(5-3 결정).
      useChatStore.getState().deactivateEmotionScoring();
      Alert.alert('제출 실패', '감정 점수를 저장하지 못했어요.');
    },
  });
}
```

`ChatMain.tsx`에서 이 mutation을 가져와 `EmotionScorePanel`의 `onConfirm`에 연결한다. 성공/409(무시)/403·404 모두 패널을 닫고(5-3 결정), 403/404일 때만 사용자에게 실패를 알리는 토스트를 띄운다.

### 4-6. `MessageBubble.tsx` — `SocraticBubble` 연동 마무리

5-1 결정에 따라 `is_socratic`이 4-3에서 실제로 메시지 타입에 연동되므로, [MessageBubble.tsx:58](../../src/features/chat/components/MessageBubble.tsx#L58)의 "필드는 존재하지만 판정 로직이 단순해 실연동 보류 중" 주석을 제거한다. 렌더링 분기(`type === 'socratic'`이면 `SocraticBubble`) 자체는 코드 변경 없이 그대로 동작.

### 4-7. 영향 없음 (확인만)

- [chatStore.ts:111-112](../../src/features/chat/store/chatStore.ts#L111-L112) `activateEmotionScoring`이 세션 내에서 여러 번 호출돼도(개입마다 반복 가능, 04 문서 §6-5) boolean 플래그 구조라 추가 변경 없이 그대로 동작한다.
- [ChatMain.tsx:56-60](../../src/features/chat/components/ChatMain.tsx#L56-L60)의 `emotionScoringActive`로 패널/입력창을 배타 렌더링하는 구조는 변경 불필요.

## 5. 결정 사항 (2026-06-25 확정)

1. **`is_socratic` 기반 `SocraticBubble` 라벨 연동 — 이번 작업에 포함.** 별도 작업으로 분리하지 않고 4-2(`setMessageType`)·4-3(`handleDone`)·4-6(주석 정리)에 포함해 함께 진행한다.
2. **슬라이더 초기값 — `done.emotion_score` 사용.** 서버가 추정한 이번 턴 감정 점수(25/45/70 중 하나, [SSE_SPEC.md](../SSE_SPEC.md) 참고)를 그대로 초기값으로 쓰고, 값이 없을 때만 `50`으로 폴백한다(4-3 코드 스니펫 반영).
3. **403/404 응답 시 — 패널을 닫고 일반 대화로 복귀.** 정상 흐름에서는 발생하지 않아야 하는 예외 상황이라 재시도해도 다시 실패할 가능성이 높으므로, 성공/409/403/404 모두 패널을 닫는 동일한 경로로 처리한다(4-5 코드 스니펫 반영). 403/404일 때만 사용자에게 실패를 알리는 토스트를 띄운다.
4. **`TestSocraticFlowButton`([ChatHeader.tsx:13-36](../../src/features/chat/components/ChatHeader.tsx#L13-L36)) — 이번 작업에서는 유지, 실기기 검증 후 별도 제거.** 새 흐름이 실제 서버 응답으로 정상 동작하는지 실기기에서 확인할 때까지는 수동 트리거 수단으로 남겨둔다.

## 6. 작업 체크리스트

- [ ] `types/chat.ts` `SseDoneData`에 신규 필드 5개 추가, `is_socratic` 주석 갱신
- [ ] `chatStore.ts`에 `emotionScoreTargetId` 상태 추가, `activateEmotionScoring` 시그니처 확장, `setMessageType` 액션 추가
- [ ] `useChatSse.ts` `sendMessage`의 `isSocraticReply` 분기 제거
- [ ] `useChatSse.ts` `handleDone`의 트리거 조건을 2장의 4조건 체크로 교체, `is_socratic` true 시 `setMessageType` 호출 추가
- [ ] `api/endpoints/chat.ts`에 `submitCbtEmotionScore` 추가(USE_MOCK 분기 포함)
- [ ] `useChat.ts`에 `useSubmitCbtEmotionScore` mutation 추가(성공/409/403/404 모두 패널 닫기, 409만 무시·403/404는 토스트)
- [ ] `ChatMain.tsx`의 `confirmEmotionScore` 연결을 신규 mutation 기반으로 교체
- [ ] `MessageBubble.tsx:58`의 보류 주석 제거
- [ ] 회귀 확인(실기기, `EXPO_PUBLIC_USE_MOCK=false`): 일반 대화에서 슬라이더가 뜨지 않는지 / 소크라테스 개입이 실제로 끝난 턴에서만 뜨는지 / 같은 세션에서 개입이 여러 번 반복돼도 매번 정상 동작하는지 / 소크라테스 질문 말풍선 라벨이 실제로 표시되는지
- [ ] 위 회귀 확인을 통과하면 `TestSocraticFlowButton`([ChatHeader.tsx:13-36](../../src/features/chat/components/ChatHeader.tsx#L13-L36)) 제거(별도 커밋)

## 7. 영향받는 기존 문서

- [x] [04-socratic-emotion-slider-plan.md](./04-socratic-emotion-slider-plan.md) — 상단에 대체 표시 추가 완료.
- [x] [00-INDEX.md #4](./00-INDEX.md) — 상태/링크를 본 문서 기준으로 갱신 완료.
- [ ] [SSE_SPEC.md](../SSE_SPEC.md) `DoneData`(L125-129) — `is_socratic` 주석과 `done` 필드 목록을 04 문서 §4·§5 기준으로 갱신 필요. 신규 필드 5개 자체가 명세에 아직 없음. (프론트 구현과 함께 진행)
- [ ] [CHAT_STATUS_SUMMARY.md §3](../CHAT_STATUS_SUMMARY.md) 2·3번 항목("감정 점수 제출 흐름 재설계", "`is_socratic` 실연동") — 둘 다 "결정 필요"에서 "프론트 구현 대기"로 단계가 바뀜. (프론트 구현과 함께 진행)
