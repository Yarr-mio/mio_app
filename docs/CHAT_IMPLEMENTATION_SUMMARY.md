# 채팅 UI 구현 요약

> 이 문서는 [CHAT_DESIGN.md](./CHAT_DESIGN.md), [CHAT_STATE_DESIGN.md](./CHAT_STATE_DESIGN.md),
> [chat-impl/](./chat-impl/) 의 Phase 01~09 문서와 **실제 소스 코드**를 대조해 작성한
> "현재 구현 상태" 스냅샷이다. 설계 문서와 실제 코드가 다른 부분은 [6. 설계와 실제 구현의 차이](#6-설계와-실제-구현의-차이)에 정리했다.

관련 이슈: `#20` (Phase 01~09 전체)

---

## 1. 개요

채팅 기능은 4개 화면이 단일 세션 플로우로 이어지는 구조다.

```
채팅 탭 진입 (chat/index.tsx)
  → useActiveSession() 조회
      ├─ 활성 세션 있음 → ChatMain (sessionPhase: active)
      └─ 없음           → SessionStart (sessionPhase: idle)
                              ↓ "대화 시작하기"
                            ChatMain (active)
                              ↓ 메시지 송수신 (SSE, 현재 mock)
                              ↓ "종료" 버튼
                            SessionSummary (chat/summary.tsx)
                              ↓ "기록 저장하기"
                            SessionEnd (chat/end.tsx)
                              ↓ "홈으로 돌아가기"
                            홈 (chatStore 초기화)
```

현재 백엔드 API가 명세되지 않아 **세션 시작/종료/SSE 스트리밍 전부 mock으로 동작**한다.
화면 전환, 상태 관리, 메시지 렌더링 로직은 실제 구현이 완료되어 있고, 서버 연동 시 mock 함수만 교체하면 되는 구조로 짜여 있다.

---

## 2. 라우팅 구조

| 파일                              | 역할                                                   |
| --------------------------------- | ------------------------------------------------------ |
| `src/app/(main)/chat/_layout.tsx` | Stack 네비게이터                                       |
| `src/app/(main)/chat/index.tsx`   | `sessionPhase`에 따라 `SessionStart` / `ChatMain` 분기 |
| `src/app/(main)/chat/summary.tsx` | `SessionSummary` 마운트                                |
| `src/app/(main)/chat/end.tsx`     | `SessionEnd` 마운트                                    |

`chat/index.tsx`는 `useActiveSession()`으로 활성 세션을 조회하고, 있으면 `chatStore.startSession()`을 호출해 곧바로 `active` 상태로 전환한다.

---

## 3. 상태 관리 전략 (Zustand vs TanStack Query)

[CHAT_STATE_DESIGN.md](./CHAT_STATE_DESIGN.md)에 정리된 기준: **TanStack의 `queryFn`(Promise 1회 resolve) 모델로 표현 가능한가**.

| 데이터                                                      | 저장소                     | 이유                                                                                                                                  |
| ----------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `messages`, `streamingMessageId`, `isAiTyping`              | Zustand                    | SSE 스트리밍은 하나의 요청에 이벤트가 연속으로 흐르므로 Promise 모델로 표현 불가. 세션 종료 후 폐기되는 에피메럴 데이터라 캐싱 불필요 |
| `sessionId`, `sessionPhase`                                 | Zustand                    | 로컬 참조값 / 순수 UI 상태. 서버가 모르는 값                                                                                          |
| `emotionScoringActive`, `pendingEmotionScore`               | Zustand                    | 순수 UI 상태                                                                                                                          |
| 세션 시작/종료 (`useStartChatSession`, `useEndChatSession`) | TanStack `useMutation`     | REST 요청-응답 패턴, 로딩/에러 상태가 내장됨                                                                                          |
| 캐릭터 정보                                                 | TanStack `useQuery` (예정) | GET + 여러 화면 공유 + 캐시 유효. 현재는 `useCharacter()`가 구현되지 않고 `chatStore.characterId` 기본값 `'mio'`로 하드코딩되어 있음  |

### `chatStore` (`src/features/chat/store/chatStore.ts`)

```typescript
type SessionPhase = 'idle' | 'active' | 'ended';

interface ChatState {
  sessionPhase: SessionPhase;
  sessionId: string | null;
  characterId: OnboardingCharacterId; // 기본값 'mio'
  messages: ChatMessage[];
  streamingMessageId: string | null;
  isAiTyping: boolean;
  emotionScoringActive: boolean;
  pendingEmotionScore: number; // 기본값 50
  summary: ChatSummary | null;
}
```

`startSession()`은 `initialState`를 통째로 덮어쓰며 `sessionPhase: 'active'`로 전환한다 — 새 세션 시작 시 이전 세션의 메시지·요약이 남지 않도록 하는 설계.

---

## 4. 메시지 송수신 흐름 (`useChatSse`)

`src/features/chat/hooks/useChatSse.ts`가 SSE 이벤트 처리 로직을 담당하지만, **현재는 실제 네트워크 호출 없이 `setTimeout`/`setInterval`로 스트리밍을 시뮬레이션하는 mock**이다.

```
sendMessage(content)
  → 사용자 메시지 즉시 store에 추가 (낙관적)
  → 직전 메시지가 socratic 타입이면: 일반 응답 대신 EmotionScorePanel을 바로 노출 (activateEmotionScoring)
  → 아니면: setAiTyping(true) 후 runMock() 호출
       → 600ms 후 session_meta 이벤트 시뮬레이션 (빈 AI 메시지 추가, 타이핑 인디케이터 숨김)
       → 40ms 간격으로 한 글자씩 delta 이벤트 시뮬레이션 (appendDelta)
       → 텍스트 종료 시 done 이벤트 시뮬레이션
            emotion_score가 있으면 → activateEmotionScoring()
            finished_reason === 'crisis_flow' → endSession()

confirmEmotionScore(score)
  → EmotionScorePanel "완료" 버튼에서 호출
  → deactivateEmotionScoring()
  → 소크라테스 질문에 대한 답변이었던 경우, 점수 제출 API가 아직 없어
    텍스트 답변에 대한 후속 mock 응답을 한 번 더 트리거
```

실제 서버 연동 시 교체할 부분은 코드 내 주석으로 명시되어 있다: `fetch(POST /v1/sessions/{id}/messages, { Accept: 'text/event-stream', Idempotency-Key })` 후 `ReadableStream`을 파싱해 동일한 `handleSessionMeta` / `handleDelta` / `handleCrisis` / `handleDone` 핸들러를 호출하면 된다. `parseSSELine()` 함수도 이미 준비되어 있으나 아직 미사용 상태다.

SSE 재연결 전략은 미구현 (TODO).

---

## 5. 메시지 타입별 렌더링 — `MessageBubble`

`role` + `type` 조합으로 4가지 말풍선을 분기한다 (`src/features/chat/components/MessageBubble.tsx`).

| 타입                              | 정렬 | 스타일                                                               | 비고                                                                                                              |
| --------------------------------- | ---- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| AI 일반 (`ai`/`normal`)           | 좌측 | `border-primary/20 bg-primary/10` + `CharacterAvatar size="sm"`      |                                                                                                                   |
| 사용자 (`user`/`normal`)          | 우측 | `bg-primary`                                                         | 아바타 없음                                                                                                       |
| 소크라테스 질문 (`ai`/`socratic`) | 좌측 | `border-primary/30 bg-primary/20` + 상단 `Label "{캐릭터명}의 질문"` | SSE에서 socratic 식별 필드 미정 — `ChatHeader`의 "테스트" 버튼으로 더미 socratic 메시지를 수동 추가해 흐름을 검증 |
| 위기 감지 (`ai`/`crisis`)         | 좌측 | 고정 응답 텍스트 + 핫라인 카드 (`Linking.openURL('tel:...')`)        | `message.crisisResources`가 있을 때만 카드 표시                                                                   |

`ChatMain`의 `FlatList`는 `inverted` + `data={[...messages].reverse()}`로 최신 메시지가 하단에 오도록 구성되어 있고, 타이핑 인디케이터는 `inverted` 특성상 `ListHeaderComponent`로 연결된다 (설계 문서의 `ListFooterComponent`와 다름, 6번 항목 참고).

---

## 6. CBT 감정 점수 패널 (`EmotionScorePanel`)

소크라테스 질문에 답한 직후, 또는 SSE `done` 이벤트의 `emotion_score`가 채워졌을 때 `ChatInputBar` 자리를 대체해 표시된다.

- `@miblanchard/react-native-slider`로 0~100 스케일 슬라이더를 직접 구현 (온보딩용 1~5 스케일 `EmotionIntensitySlider`는 스케일이 달라 재사용하지 않음)
- 현재 값을 숫자로 강조 표시, 좌/우에 "최저 (0)" / "최고 (100)" 레이블
- "완료" 버튼 → `onConfirm(score)` → `useChatSse`의 `confirmEmotionScore()` 호출
- 사용자가 조정한 점수를 서버로 제출하는 엔드포인트가 아직 없어 (TODO), 현재는 점수를 버리고 후속 mock 응답만 트리거함

---

## 7. 화면별 구현

| 화면      | 컴포넌트             | 핵심 동작                                                                                                                                                                                                                  |
| --------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 세션 시작 | `SessionStart.tsx`   | `ChatBackground` + `CharacterAvatar size="lg"` + "대화 시작하기" 버튼 → `useStartChatSession().mutate(characterId)`                                                                                                        |
| 메인 채팅 | `ChatMain.tsx`       | `ChatHeader` + `FlatList`(inverted, `MessageBubble`) + `emotionScoringActive`에 따라 `EmotionScorePanel`/`ChatInputBar` 전환. `KeyboardAvoidingView`로 입력바가 키보드 위에 붙도록 처리 (iOS `padding` / Android `height`) |
| 세션 요약 | `SessionSummary.tsx` | `chatStore.summary`가 `null`이면 로딩 스피너 표시 (Memory 도메인 폴링 전략 미결). 채워지면 주요 감정 / 핵심 내용 / 새로운 생각 / 오늘의 작은 행동 4개 카드 + "기록 저장하기" 버튼                                          |
| 세션 종료 | `SessionEnd.tsx`     | `CharacterAvatar variant="planet"` + 격려 문구 + "홈으로 돌아가기". `useFocusEffect`로 비정상 진입(스토어가 `ended`가 아닐 때) 시 `router.dismissAll()`, 화면을 벗어날 때 `chatStore.reset()`                              |

`ChatHeader`에는 설계 문서에 없던 두 가지가 추가됐다: 세션 종료를 트리거하는 "종료" 버튼(`onEnd` prop), 그리고 socratic 플로우를 수동으로 테스트하기 위한 임시 "테스트" 버튼(주석으로 제거 예정 명시됨).

---

## 8. 공통 컴포넌트 — `CharacterAvatar`

`src/components/character/CharacterAvatar.tsx`

```typescript
interface CharacterAvatarProps {
  characterId: OnboardingCharacterId;
  size: 'xs' | 'sm' | 'md' | 'lg'; // 설계 문서엔 xs 없음 — 실제 구현에서 추가
  variant?: 'default' | 'planet'; // planet 전용 에셋은 아직 없어 default와 동일 이미지 사용
  background?: boolean; // 원형 배경(primary 60% 투명도) 표시 여부 — 설계 문서엔 없던 prop
}
```

`getOnboardingCharacterById(characterId).image`로 이미지를 가져와 `expo-image`로 렌더링한다. AI 말풍선·타이핑 인디케이터에서는 `background` prop으로 캐릭터 뒤에 원형 배경을 깔아 시각적으로 구분한다.

---

## 9. 설계와 실제 구현의 차이

Phase 문서(계획)와 실제 코드를 대조하며 확인된 차이점.

| 항목                             | 설계 문서                   | 실제 구현                                                                       |
| -------------------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| 화면 배경                        | `bg-midnight` 단색          | `ChatBackground` 컴포넌트 (전용 배경 컴포넌트로 분리)                           |
| 메인 채팅 타이핑 인디케이터 위치 | `ListFooterComponent`       | `ListHeaderComponent` (inverted FlatList라 시각적 하단 = 논리적 head)           |
| `CharacterAvatar` props          | `size`(sm/md/lg), `variant` | `size`에 `xs` 추가, `background`(원형 배경) prop 추가                           |
| `ChatHeader`                     | 캐릭터명 + 상태 문구만      | "종료" 버튼(`onEnd`), socratic 흐름 테스트용 임시 버튼 추가                     |
| `SessionEnd`                     | 단순 버튼 액션              | `useFocusEffect`로 비정상 진입 가드(`dismissAll`) + 이탈 시 `reset()` 자동 처리 |
| 세션 요약 카드명                 | "오늘의 적절 행동"          | "오늘의 작은 행동"                                                              |

---

## 10. 미해결 TODO (백엔드 연동 필요)

| 항목                      | 내용                                                                 | 위치                                      |
| ------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| 세션 API 전체             | `fetchActiveSession`/`startSession`/`endSession` 모두 mock 고정 응답 | `src/api/endpoints/chat.ts`               |
| SSE 스트리밍              | 실제 `fetch` + `ReadableStream` 대신 `setTimeout`/`setInterval` mock | `useChatSse.ts`                           |
| 소크라테스 질문 식별      | SSE 응답에서 `message_type: 'socratic'` 같은 필드 명세 필요          | `types/chat.ts`, `MessageBubble.tsx`      |
| 감정 점수 제출 엔드포인트 | 사용자가 조정한 0~100 점수를 보낼 API 미명세                         | `useChatSse.ts`의 `confirmEmotionScore`   |
| 세션 요약 폴링            | `summary_status: 'pending'` 처리 전략 (Memory 도메인 API 명세 필요)  | `SessionSummary.tsx`, `useEndChatSession` |
| `variant="planet"` 에셋   | 세션 종료 화면용 캐릭터 행성 포즈 이미지 미존재                      | `CharacterAvatar.tsx`                     |
| `useCharacter()`          | 로그인 후 서버에서 캐릭터 정보 수신 — 현재 `'mio'` 하드코딩          | `chatStore.ts` 초기값                     |
| SSE 재연결 전략           | 네트워크 끊김 대응 미구현                                            | `useChatSse.ts`                           |
| CBT 생각 재구성 연동      | `chat/restructure.tsx`와의 연결은 별도 설계 필요                     | —                                         |
