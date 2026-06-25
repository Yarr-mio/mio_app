# 08. 결과 화면("홈으로 돌아가기") 이후 채팅 탭이 고착되는 문제 — 원인 분석

> 작성일: 2026-06-25
> 상태: 🟡 코드 수정 완료. 실기기 검증 결과 "mio 고정" 증상은 해소됐으나, 화면이 그대로 남아있는 핵심 증상은 **별개의 원인**(`usePreventRemove`가 이번 수정의 `dismissAll()`까지 차단)으로 계속 재현됨 — 이어지는 분석: [09-dismissall-blocked-by-prevent-remove.md](./09-dismissall-blocked-by-prevent-remove.md)
> 관련: [06-session-end-flow-back-navigation.md](./06-session-end-flow-back-navigation.md) (같은 `SessionEnd`/`SessionSummary`/`chat` `Stack` 구조를 다룸. 06번에서 고친 "뒤로가기 차단"은 그대로 유효하고, 이번 버그는 06번이 다루지 않은 **"홈으로 돌아가기" 버튼 경로**에서 새로 발견됨)

## 1. 문제 증상 (사용자 보고)

1. 요약 화면에서 "기록 저장하기" → 결과 화면(`/(main)/chat/end`) 진입.
2. 결과 화면에서 "홈으로 돌아가기"를 누르면 홈으로 가야 하는데, **채팅 시작 화면("대화 시작하기")이 뜬다.** (1차 문제)
3. 이 채팅 시작 화면에서 **뒤로가기 스와이프가 가능**하고, 스와이프하면 **mio로 고정된 결과 완료 화면**(스크린샷: "오늘도 잘 하셨어요" + 펭귄 캐릭터)이 다시 나타난다.
4. 그 화면에서 "홈으로 돌아가기"를 누르면 이번엔 홈으로 잘 이동한다.
5. 하지만 그 뒤로 채팅 탭에 재진입하면, **매번 mio로 고정된 그 결과 완료 화면이 다시 뜨고**, 대화를 새로 시작할 방법이 없다.

## 2. 관련 화면 / 네비게이션 구조

[06번 문서](./06-session-end-flow-back-navigation.md) §2의 구조가 그대로 적용된다 — `(main)` `Tabs`는 탭 전환 시 언마운트하지 않고, `chat` 탭 내부의 `Stack`(`index`/`summary`/`end`)도 그대로 보존된다.

이번 버그에 직접 관련된 코드:

| 파일                                                                        | 핵심 코드                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | L14 `characterId = useChatStore((s) => s.characterId)` (★ `SessionStart`처럼 `useSelectedCharacterId()`가 아님), L29-42 `useFocusEffect`(블러마다 `reset()`), L44-47 `handleGoHome` = `router.replace('/(main)/home')`만 호출 |
| [chatStore.ts](../../src/features/chat/store/chatStore.ts)                  | L52 `characterId: 'mio'`(초기값), L135 `reset: () => set(initialState)`                                                                                                                                                       |
| [chat/index.tsx](<../../src/app/(main)/chat/index.tsx>)                     | L18-50 재진입 리다이렉트 effect, L54-66 `sessionPhase`별 분기(`active`→`ChatMain`, 그 외→`SessionStart`)                                                                                                                      |
| [SessionSummary.tsx](../../src/features/chat/components/SessionSummary.tsx) | L27-30 `sessionId = routeSessionId ?? storeSessionId`, L45 `usePreventRemove(!!sessionId, ...)`, L49-53 자가복구 effect(`!sessionId` → `router.replace('/(main)/chat')`) — **07번 작업에서 추가된 코드**                      |
| [useChat.ts](../../src/features/chat/hooks/useChat.ts)                      | L70-80 `useEndChatSession`(activeSession 캐시 무효화 없음), L25-68 `useStartChatSession`(에러 핸들러에만 `invalidateQueries` 있음, L59)                                                                                       |
| [chat/\_layout.tsx](<../../src/app/(main)/chat/_layout.tsx>)                | `summary`/`end`만 `gestureEnabled: false`, `index`는 기본값(제스처 백 허용)                                                                                                                                                   |
| [queryClient.ts](../../src/api/queryClient.ts)                              | L6 `staleTime: 1000 * 60 * 5`                                                                                                                                                                                                 |

## 3. 원인 분석

### 원인 A(근본 원인) — "홈으로 돌아가기"가 `chat` `Stack`을 절대 비우지 않음

[SessionEnd.tsx:44-47](../../src/features/chat/components/SessionEnd.tsx#L44-L47):

```tsx
function handleGoHome() {
  // reset은 useFocusEffect cleanup에서 처리되므로 navigation만 호출
  router.replace('/(main)/home');
}
```

06번 문서 §3-3에서 이미 코드로 확인했듯, `chat`↔`home`은 `Tabs`에서 갈라지므로 이 `replace`는 `JUMP_TO`로 변환된다(`node_modules/expo-router/build/global-state/routing.js:256-265`). `JUMP_TO`는 **탭의 포커스 인덱스만 바꾸는 액션**이라 `chat` `Stack`의 `routes`/`index`는 전혀 건드리지 않는다. 즉 "홈으로 돌아가기"를 눌러도 `chat` `Stack`은 `[index, summary, end]`(포커스 `end`)인 채로 그대로 보존된다 — `SessionEnd`에는 06번에서 만든 `useFocusEffect`의 "포커스 시 `sessionPhase !== 'ended'`면 `dismissAll()`" 로직이 있지만, 이건 **재진입(포커스)** 시에만 실행되고 **이탈(블러)** 시에는 실행되지 않는다. 그래서 "홈으로 돌아가기"로 나가는 순간엔 스택을 정리할 기회가 전혀 없다.

### 원인 B — 블러마다 `reset()`이 실행되지만, 화면은 언마운트되지 않아 "되살아난다"

[SessionEnd.tsx:37-40](../../src/features/chat/components/SessionEnd.tsx#L37-L40)의 `useFocusEffect` cleanup은 **블러될 때마다** 실행된다(언마운트와 무관 — React Navigation `useFocusEffect`의 정의). 원인 A 때문에 `end` 화면은 탭을 벗어나도 언마운트되지 않으므로, "홈으로 돌아가기"를 누른 순간 `end`가 블러되며 `reset()`이 실행되고, **그 후에도 `end` 컴포넌트 인스턴스 자체는 스택에 그대로 남아있다.** 즉 상태만 초기화된 "껍데기"가 스택에 계속 박혀있는 상태가 된다.

### 원인 C — `SessionEnd`가 캐릭터를 `chatStore.characterId`에서 직접 읽음 (확정: "mio 하드코딩" 증상의 직접 원인)

[SessionEnd.tsx:14](../../src/features/chat/components/SessionEnd.tsx#L14):

```tsx
const characterId = useChatStore((s) => s.characterId);
```

`SessionStart.tsx`는 같은 문제를 피하려고 `useSelectedCharacterId()`를 쓰는데(`chatStore.characterId`의 초기값에 대한 주석, [chatStore.ts:50-51](../../src/features/chat/store/chatStore.ts#L50-L51): "세션 시작 전엔 아무도 이 기본값을 읽지 않음(`SessionStart`는 `useSelectedCharacterId()` 사용)"), `SessionEnd`는 이 패턴을 따르지 않고 store 값을 직접 읽는다. 원인 B의 `reset()`이 실행되면 `characterId`는 [chatStore.ts:52](../../src/features/chat/store/chatStore.ts#L52) 기본값인 `'mio'`로 돌아가고, 원인 A 때문에 `end` 화면 인스턴스는 사라지지 않으므로, **다음에 이 화면이 다시 보일 때(어떤 경로든) 항상 "mio"로 표시된다.** 사용자가 보고한 "mio로 하드코딩된 결과 완료 페이지"는 정확히 이 경로다 — 실제로 하드코딩된 게 아니라, **리셋된 스토어 값을 계속 보고 있는 살아있는 화면**이다.

### 원인 D — `SessionSummary`의 자가복구 effect가 포커스와 무관하게 실행됨

[SessionSummary.tsx:49-53](../../src/features/chat/components/SessionSummary.tsx#L49-L53)(07번 작업에서 검은 화면 버그 수정으로 추가됨):

```tsx
useEffect(() => {
  if (!sessionId) {
    router.replace('/(main)/chat');
  }
}, [sessionId]);
```

이 effect는 `useIsFocused()` 같은 가드가 없다. `summary`도 원인 A와 같은 이유로 언마운트되지 않은 채 스택에 남아있으므로, 원인 B의 `reset()`이 `storeSessionId`를 `null`로 만들면 — **사용자가 지금 `summary` 화면을 보고 있지 않더라도** — 이 effect가 실행되어 `router.replace('/(main)/chat')`를 호출한다. 07번 문서는 이 effect를 "리로드 후 `sessionId` 없이 마운트되는 특수 상황"용 자가복구로 설계했는데, 이번 버그를 통해 **그 가정(이 화면을 보고 있을 때만 `sessionId`가 사라진다)이 깨지는 사례**가 드러났다 — 화면을 보고 있지 않아도(다른 화면 뒤에 숨어 있어도) `sessionId`가 사라질 수 있다(원인 A+B).

`router.replace('/(main)/chat')`가 디스패치되는 시점엔 (원인 A의 `JUMP_TO`로 인해) 현재 포커스된 탭이 이미 `home`으로 바뀌어 있을 수 있다. expo-router의 분기 타겟 결정은 호출한 컴포넌트가 아니라 **현재 전역 내비게이션 상태**를 기준으로 한다(`getNavigateAction`, `node_modules/expo-router/build/global-state/routing.js:225-251`: `navigationRef.getRootState()` 기준으로 "현재 상태"와 "목표"가 갈라지는 지점을 찾음) — 즉 이 시점의 "현재"가 `home`이면 `/(main)/chat`과는 `Tabs`에서 갈라지므로 이 호출도 `JUMP_TO`로 변환되어 **`chat` 탭으로 다시 강제 전환**될 수 있다.

### 원인 E — `useEndChatSession`이 `activeSession` 캐시를 무효화하지 않음

[useChat.ts:70-80](../../src/features/chat/hooks/useChat.ts#L70-L80):

```tsx
export function useEndChatSession() {
  return useMutation({
    mutationFn: (sessionId: string) => endSession(sessionId),
    onSuccess: () => {
      useChatStore.getState().endSession();
      router.push('/(main)/chat/summary');
    },
  });
}
```

세션을 종료해도 `queryKeys.chat.activeSession()` 캐시는 그대로 남는다 — 같은 파일의 `useStartChatSession`은 `SESSION_ALREADY_ACTIVE` 에러 처리에서 명시적으로 `queryClient.invalidateQueries(...)`를 호출하는데([useChat.ts:59](../../src/features/chat/hooks/useChat.ts#L59)), `useEndChatSession`엔 이 패턴이 없다. `queryClient.ts:6`의 `staleTime: 1000 * 60 * 5`(5분) 때문에, 세션을 끝낸 직후 5분 안에 `chat/index.tsx`가 **새로 마운트**되면([chat/index.tsx:18-24](<../../src/app/(main)/chat/index.tsx#L18-L24>)) 캐시에 남아있는 "활성 세션" 데이터를 그대로 믿고 `startSession(...)`을 다시 호출해, **서버가 이미 종료한 세션을 프론트에서 부활시킬 위험**이 있다. 이번 재현에서 정확히 이 경로가 실행됐는지는 확정하지 못했지만(§4 참고), 독립적으로 존재하는 확정된 버그다.

### 원인 F — `index`만 제스처 백 차단이 없음 (원인 D의 결과가 "뒤로가기 가능한 화면"으로 보이는 이유)

[chat/\_layout.tsx](<../../src/app/(main)/chat/_layout.tsx>)는 `summary`/`end`에만 `gestureEnabled: false`를 건다. 원인 D로 `chat` `Stack`에 `index`가 다시 포커스되면(또는 새로 쌓이면), 이 화면엔 제스처 차단이 없으므로 **뒤로 스와이프가 그대로 동작한다** — 사용자가 보고한 "채팅 시작 화면에서 뒤로가기가 가능하다"는 정확히 이 화면이 `index`(`SessionStart`)라는 강력한 증거다. 그 뒤로가기가 도달하는 화면이 "mio 결과 완료 화면"이라는 보고는, 그 시점에 스택에서 `index` **바로 아래**에 원인 A로 인해 한 번도 제거되지 않은 `end`가 그대로 남아있다는 것과 일치한다.

## 4. 증상 ↔ 원인 매핑, 그리고 확정하지 못한 부분

| 증상                                                                   | 원인(확정)                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ③ 결과 화면 재진입 시 mio로 고정된 화면이 계속 보임, 새 대화 시작 불가 | 원인 A(스택이 절대 안 비워짐) + 원인 B(블러마다 리셋) + 원인 C(캐릭터를 store에서 직접 읽음) — **이 셋만으로 100% 설명됨**                                                                                                                                                                                                                                                  |
| ② 채팅 시작 화면에서 뒤로가기 가능 / 뒤로가기 시 mio 화면 도달         | 원인 F(`index`에 제스처 차단 없음) + 원인 A(`end`가 그 아래 그대로 남아있음)                                                                                                                                                                                                                                                                                                |
| ① "홈으로 돌아가기" 누르면 홈이 아니라 채팅 시작 화면이 뜸             | 원인 D(자가복구 effect가 포커스 무관하게 발동) + 원인 A의 `JUMP_TO` 메커니즘 — **가장 유력한 설명이지만, `Tabs`의 `JUMP_TO`가 이미 마운트된 자식 `Stack`의 포커스를 실제로 어떻게 갱신하는지는 React Navigation 내부(`TabRouter`의 파라미터 처리, `node_modules/@react-navigation/routers/src/TabRouter.tsx:354-425`)까지 추적했음에도 정적 분석만으로 100% 확정하지 못함** |

§3-3(원인 D)에서 짚었듯, "홈으로 돌아가기" 직후 `SessionSummary`의 자가복구 effect가 한 번 더 내비게이션을 일으킨다는 것은 코드로 확정된다. 다만 이 effect가 발동하는 **정확한 시점**(React effect 플러시 타이밍과 `routingQueue`가 비동기로 처리되는 순서)에 따라 사용자가 실제로 보게 되는 화면이 "①번처럼 채팅 시작 화면"인지, 다른 중간 상태인지는 기기 로그 없이는 끝까지 단정할 수 없었다 — 07번 문서에서도 같은 종류의 잔여 불확실성을 인정한 바 있다. **다만 이 불확실성은 수정 방향에 영향을 주지 않는다**: 원인 A(스택을 절대 안 비움)를 고치면 원인 D가 어떤 타이밍으로 발동하든 더는 보여줄 "엉뚱한 화면"이 스택에 남아있지 않게 되므로, ①·②·③ 전부 한 번에 해소된다.

## 5. 수정 계획 (적용 완료)

| 파일                                                                        | 변경(안)                                                                                                                                        | 목적                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | `handleGoHome`에서 `router.replace('/(main)/home')` 전에 `router.dismissAll()`(또는 `dismissTo('/(main)/chat')`) 호출 추가                      | 탭을 벗어나기 **전에**, 아직 `chat` `Stack`이 포커스된 상태에서 스택을 `index`로 비움 → 원인 A 제거. 이 시점엔 아직 `JUMP_TO`로 전환되기 전이라 `dismissAll()`이 06번에서 복원한 "스택 루트=`index`" 불변식을 그대로 활용해 안전하게 동작함 |
| [SessionSummary.tsx](../../src/features/chat/components/SessionSummary.tsx) | 자가복구 effect(L49-53)에 `useIsFocused()` 가드 추가 — 포커스 상태일 때만 자가복구 실행                                                         | 화면을 보고 있지 않을 때 백그라운드에서 추가 내비게이션을 일으키는 것(원인 D) 자체를 차단                                                                                                                                                   |
| [useChat.ts](../../src/features/chat/hooks/useChat.ts) `useEndChatSession`  | `onSuccess`에 `queryClient.invalidateQueries({ queryKey: queryKeys.chat.activeSession() })` 추가(`useStartChatSession` 에러 핸들러와 동일 패턴) | 원인 E 제거 — 종료된 세션이 캐시에 남아 부활하는 경로 차단                                                                                                                                                                                  |
| [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | `characterId`를 `useChatStore`가 아니라 `SessionStart`와 동일한 `useSelectedCharacterId()`로 읽도록 변경                                        | 원인 C에 대한 방어 — 1번 수정만으로 충분할 수 있지만, 다른 경로로 또 노출될 경우를 대비한 이중 안전망                                                                                                                                       |

`dismissAll()`을 "탭 전환 전에 먼저" 호출해야 하는 이유: 원인 A에서 확인했듯 `chat`→`home` 전환 자체는 `JUMP_TO`라 `chat` `Stack`을 건드리지 않는다. 반대로 `dismissAll()`을 **탭이 이미 `home`으로 바뀐 뒤에** 호출하면(예: 순서를 바꿔서), 그 시점엔 `chat`이 더 이상 "현재" 포커스된 탭이 아니므로 어떤 스택을 대상으로 `POP_TO_TOP`이 디스패치될지 보장할 수 없다 — 반드시 `chat`이 아직 포커스된 상태에서, 즉 `router.replace('/(main)/home')`보다 먼저 호출해야 한다.

## 6. 체크리스트

- [x] `SessionEnd.tsx` `handleGoHome`에 `dismissAll()` 선행 호출 추가
- [x] `SessionSummary.tsx` 자가복구 effect에 `useIsFocused()` 가드 추가
- [x] `useChat.ts`의 `useEndChatSession`에 `activeSession` 캐시 무효화 추가
- [x] (추가) `SessionEnd.tsx`의 `characterId`를 `useSelectedCharacterId()` 기반으로 변경 (원인 C 이중 안전망)
- [x] `tsc --noEmit` / `eslint` 통과 확인
- [x] 시나리오: 결과 화면 → "홈으로 돌아가기" → 홈 화면이 즉시, 한 번에 뜨는지 확인 — 실기기 확인됨, 정상
- [ ] 시나리오: 그 후 채팅 탭 재진입 → "대화 시작하기"(`SessionStart`)가 정상적으로 뜨는지 확인 (mio 고정 화면이 더는 안 보이는지) — **실기기 확인 결과 실패**: mio 고정은 해소됐으나 결과 화면이 그대로 남아있음 → 별개 원인, [09번 문서](./09-dismissall-blocked-by-prevent-remove.md)로 이어짐
- [ ] 시나리오: 새 대화를 실제로 시작할 수 있는지 확인 (이번 버그의 가장 치명적인 영향 — 현재는 채팅을 영구적으로 못 시작하게 됨) — **여전히 불가**, 09번 문서 수정 후 재확인 필요
- [x] [CHAT_STATUS_SUMMARY.md](../CHAT_STATUS_SUMMARY.md) 갱신
- [x] [00-INDEX.md](./00-INDEX.md) 목록 표 갱신

## 7. 범위 밖 / 잔여 불확실성

- §4에서 밝혔듯, "홈으로 돌아가기"를 누른 직후 사용자가 보게 되는 화면이 정확히 어떤 중간 상태를 거치는지는(원인 D의 `JUMP_TO` 재발동이 `chat` `Stack`의 내부 포커스까지 갱신시키는지 여부 등) 기기 로그 없이 100% 확정하지 못했다. 수정 계획(§5)은 이 불확실성과 무관하게 근본 원인(A)을 직접 제거하므로 구현/검증에는 영향이 없다.
- 원인 E(activeSession 캐시 무효화 누락)는 이번 재현에서 실제로 발동했는지 확인하지 못했지만, 독립적으로 존재하는 버그이므로 수정 계획에 포함했다.
