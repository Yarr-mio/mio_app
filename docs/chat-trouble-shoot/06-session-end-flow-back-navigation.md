# 06. 세션 종료 후 화면 전환(요약→결과→홈) 뒤로가기/리셋 타이밍 버그 — 원인 분석 및 수정 계획

> 작성일: 2026-06-25
> 상태: 🟡 코드 수정 완료, 실기기 검증 대기 — 이 환경엔 시뮬레이터가 없어 수동 테스트는 사용자가 직접 확인 필요.
> 관련: 같은 작업 트리에 미커밋 상태로 남아있는 직전 수정 2건
>
> 1. [ChatMain.tsx](../../src/features/chat/components/ChatMain.tsx) — 앱 백그라운드 전환 시 세션 종료 호출 추가
> 2. [chat/index.tsx:52-60](<../../src/app/(main)/chat/index.tsx#L52-L60>) — `sessionPhase === 'ended'`일 때 `SessionStart` 대신 빈 화면 렌더(종료 버튼 깜빡임 수정)
>
> 이번 문서에서 분석한 버그는 위 2건 중 같이 들어간 **세 번째 변경**, [useChat.ts:77](../../src/features/chat/hooks/useChat.ts#L77)의 `router.push` → `router.replace` 교체가 원인 중 하나다. 즉 직전 턴의 수정이 "대화 종료 → 요약 화면 진입" 구간의 버그는 고쳤지만, 그 부작용으로 "요약 → 결과 → 홈" 구간에 새 버그를 만들었다.

## 1. 문제 증상 (사용자 보고)

1. 요약 화면(`/(main)/chat/summary`)에서 "기록 저장하기"를 눌러 결과 화면(`/(main)/chat/end`)으로 넘어갈 때도, 직전에 고친 "종료 버튼 깜빡임/뒤로가기로 엉뚱한 화면" 류의 현상이 똑같이 발생한다.
2. 결과 화면(`/(main)/chat/end`)에서 "홈으로 돌아가기"를 누른 뒤, 채팅 탭에 다시 들어가면 화면에 **아무것도 보이지 않는다**.

## 2. 네비게이션 구조 재확인

`(main)` = `Tabs`(`home`/`chat`/`report`/`explore`, 기본적으로 탭 전환 시 언마운트 안 됨) → `chat` 탭 자체는 [chat/\_layout.tsx](<../../src/app/(main)/chat/_layout.tsx>)에서 별도 `Stack`(`index`/`summary`/`end`)을 가진다. 즉 **탭을 벗어나도 채팅 탭의 `Stack` 상태(어떤 화면이 쌓여있는지)는 그대로 보존**된다 — 이게 모든 증상의 배경이다.

각 화면의 역할과 종료 트리거:

| 화면      | 파일                                                                        | 진입 방법                                                                                                                        | 비고                                                                                                        |
| --------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `index`   | [chat/index.tsx](<../../src/app/(main)/chat/index.tsx>)                     | 탭의 시작 화면                                                                                                                   | `sessionPhase`로 `ChatMain`/`SessionStart`/빈화면 분기                                                      |
| `summary` | [SessionSummary.tsx](../../src/features/chat/components/SessionSummary.tsx) | 종료 버튼 → [useChat.ts:77](../../src/features/chat/hooks/useChat.ts#L77) `router.replace`                                       | `sessionId`가 없으면 [33-35행](../../src/features/chat/components/SessionSummary.tsx#L33-L35) `return null` |
| `end`     | [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | 요약 화면의 "기록 저장하기" → [SessionSummary.tsx:126](../../src/features/chat/components/SessionSummary.tsx#L126) `router.push` | `useFocusEffect`로 진입 시 가드 + 이탈 시 `reset()`                                                         |

## 3. 원인 분석

### 3-1. 원인 A — `push`→`replace` 교체가 `SessionEnd`가 의존하는 불변식을 깸 (증상②의 직접 원인)

[SessionEnd.tsx:16-29](../../src/features/chat/components/SessionEnd.tsx#L16-L29):

```tsx
useFocusEffect(
  useCallback(() => {
    // 이 화면에 포커스될 때 sessionPhase가 'ended'가 아니면 (reset 후 재진입)
    // chat 스택을 루트(index)로 되돌린다
    if (useChatStore.getState().sessionPhase !== 'ended') {
      router.dismissAll();
    }
    return () => {
      useChatStore.getState().reset();
    };
  }, [])
);
```

주석 그대로 이 로직은 **"`dismissAll()`을 부르면 항상 `index`로 돌아간다"는 전제** 위에 설계돼 있다. `dismissAll()`은 expo-router 내부에서 `POP_TO_TOP`을 디스패치하는데(`node_modules/expo-router/build/global-state/routing.js:131-136`), 이건 "현재 로컬 스택의 0번째 라우트로 돌아가기"이지 "`index`로 돌아가기"가 아니다 — **그 시점에 스택의 0번째가 무엇이냐**에 전적으로 의존한다.

직전 수정에서 [useChat.ts:77](../../src/features/chat/hooks/useChat.ts#L77)을 `router.push('/(main)/chat/summary')` → `router.replace(...)`로 바꾸면서, 종료 시점에 `index`가 스택에서 **제거되고 `summary`가 새 루트**가 됐다. 그 결과 `dismissAll()`은 더 이상 `index`가 아니라 `summary`로 떨어진다.

재현 경로:

1. 종료 → `endSession()` (`sessionPhase: 'ended'`) → `replace`로 `summary` 진입. 스택: `[summary]` (루트가 `summary`로 바뀜)
2. "기록 저장하기" → `push`로 `end` 진입. 스택: `[summary, end]`
3. "홈으로 돌아가기" → 탭 전환(`JUMP_TO`, 채팅 탭의 `Stack`은 언마운트되지 않고 그대로 보존됨) + `end`가 블러되며 `useFocusEffect` cleanup 실행 → `reset()` → `sessionPhase: 'idle'`, `sessionId: null`
4. 채팅 탭 재진입 → 탭이 다시 포커스되며, 그 탭의 `Stack`에서 마지막으로 포커스됐던 화면인 `end`가 다시 포커스 → `end`의 `useFocusEffect` 본문이 다시 실행 → `sessionPhase !== 'ended'`(`'idle'`)이므로 `router.dismissAll()` 호출
5. `dismissAll()` → 스택 루트인 **`summary`**로 이동(원래 의도는 `index`) → `SessionSummary`가 리렌더되는데 `sessionId`는 `routeSessionId(undefined) ?? storeSessionId(null)` = `null` → [33-35행](../../src/features/chat/components/SessionSummary.tsx#L33-L35) `return null` → **빈 화면**

→ 증상②(홈 갔다가 채팅 재진입 시 빈 화면)는 이 경로로 100% 설명된다.

### 3-2. 원인 B — `useFocusEffect`의 `reset()`이 "완전한 이탈"과 "같은 플로우 안에서의 일시적 후진"을 구분하지 못함

[SessionEnd.tsx:24-27](../../src/features/chat/components/SessionEnd.tsx#L24-L27)의 cleanup은 **블러될 때마다** 실행된다(언마운트뿐 아니라 포커스를 잃는 모든 경우 — React Navigation `useFocusEffect`의 정의상 그렇다). "버튼이든 하단 탭이든 어떻게 나가든 초기화"라는 의도(주석 25행)는 맞지만, 다음 경로도 똑같이 "블러"로 잡혀버린다:

- `end` 화면에서 **뒤로 스와이프(iOS)** 하면 `summary`로 돌아가는데, 이 역시 `end`가 블러되는 것이므로 `reset()`이 실행된다.
- 그러면 방금 본 `summary` 화면이 `sessionId`를 잃고(`storeSessionId` → `null`) 그 자리에서 바로 **빈 화면**이 된다.

이 경로는 `index`가 스택 루트인지 `summary`가 루트인지(원인 A)와 무관하게 **현재 코드에 원래부터 있던 별개의 버그**다 — `end`에서 뒤로 스와이프하기만 해도 요약 화면이 깨진다. 단, 회복 수단이 없다: `summary.tsx`에는 `end.tsx`처럼 "잘못된 상태면 dismissAll" 같은 자가복구 로직이 없으므로, 이 경로로 빠지면 사용자가 탭을 벗어났다가 돌아오는 것 외에는 빠져나올 방법이 없는 막다른 화면이 된다.

### 3-3. 원인 C(근본 원인) — `summary`/`end`에 뒤로가기 방어가 전혀 없음

[chat/\_layout.tsx](<../../src/app/(main)/chat/_layout.tsx>)는 전체 `Stack`에 `headerShown: false`만 설정하고, 화면별 `gestureEnabled`/`beforeRemove` 가드가 전혀 없다:

```tsx
export default function ChatLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`summary`/`end`는 둘 다 헤더(뒤로가기 버튼)도 없고, 화면 안의 유일한 액션은 "다음 단계로 진행"(기록 저장하기/홈으로 돌아가기)뿐인 **"되돌릴 수 없는 종료 지점" 화면**으로 설계돼 있다. 그런데 네이티브 스택 기본 동작(iOS 스와이프 백, Android 하드웨어/제스처 백)은 막혀있지 않다. 원인 A·B가 실제로 사용자에게 보이는 건 전부 이 방어 부재가 출입구를 열어주기 때문이다 — 즉 A·B를 각각 패치해도 "또 다른 방식의 뒤로가기"가 같은 종류의 버그를 또 드러낼 수 있는 구조다.

참고로 이 프로젝트에는 이미 같은 종류의 방어 사례가 있다 — [onboarding/\_layout.tsx:6](<../../src/app/(auth)/onboarding/_layout.tsx#L6>) `<Stack.Screen name="step1Emotion" options={{ gestureEnabled: false }} />`, [Step1EmotionScreen.tsx:31-33](../../src/features/onboarding/components/Step1EmotionScreen.tsx#L31-L33) `navigation.setOptions({ gestureEnabled: false })`. 다만 `gestureEnabled`는 **iOS 전용**이다(React Navigation native-stack 문서 기준 — Android 하드웨어/제스처 백은 막지 못함). 이 레포의 `@react-navigation/native` 7.1.33 / native-stack 7.15.1에는 `usePreventRemove`라는 더 포괄적인 훅이 있다(`@react-navigation/core`에서 재노출, `node_modules/@react-navigation/native/src/index.tsx:17` `export * from '@react-navigation/core'`). 이 훅은 화면별 `beforeRemove` 이벤트(스와이프·Android 백·`router.back()` 프로그램 호출 전부 포함)를 가로채므로 플랫폼 무관하게 "이 화면에서는 뒤로 못 간다"를 구현할 수 있다.

중요한 확인 사항(코드로 검증함): "홈으로 돌아가기" 버튼의 `router.replace('/(main)/home')`은 `end` 화면을 **제거(pop)하는 액션이 아니다** — `chat` 탭과 `home` 탭이 가장 가까운 공통 조상인 `Tabs` 내비게이터에서 갈라지므로, expo-router는 이걸 탭 전환(`JUMP_TO`)으로 변환해서 디스패치한다(`node_modules/expo-router/build/global-state/routing.js:260-261`, `navigationState.type === 'expo-tab'`이면 타입을 `JUMP_TO`로 강제). 탭 전환은 `beforeRemove`를 발생시키지 않으므로, **`end`에 `usePreventRemove`를 걸어도 "홈으로 돌아가기" 버튼은 막히지 않는다** — 뒤로가기(스와이프/하드웨어 백/`router.back()`)만 막힌다. 이 구분이 안전한 이유다.

### 3-4. 증상 ↔ 원인 매핑

| 증상                                                     | 트리거                                                                | 핵심 원인                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| (이전 보고) 요약 화면에서 뒤로 스와이프 → 대화 시작 화면 | `summary`에서 백 제스처                                               | 원인 C(방어 없음). 직전 수정(A)으로 일단 봉합됐지만 부작용(증상②) 발생 |
| ① 요약→결과 전환 시 "동일 현상"                          | `end`에서 백 제스처 시도 시 `summary`로 돌아가며 블러→`reset()`       | 원인 B + 원인 C(애초에 백 제스처를 막을 장치가 없어서 B가 표면화됨)    |
| ② 결과 화면에서 홈 → 채팅 재진입 시 빈 화면              | 탭 재포커스 시 `end`의 `dismissAll()`이 `summary`(현재 루트)로 떨어짐 | 원인 A (`push`→`replace`로 스택 루트가 바뀜)                           |

## 4. 수정 계획

핵심 방향: **"뒤로 못 가게 막기"를 스택 구조 트릭(`replace`)이 아니라 React Navigation의 정식 API(`usePreventRemove`)로 처리**하고, `SessionEnd`가 의존하는 "`dismissAll` → `index`" 불변식은 되돌려서 복원한다. 스택 트릭은 한 군데(`summary` 진입)의 증상은 고치지만 다른 곳(`end`→홈→재진입)의 불변식을 깨뜨린다는 게 이번에 확인됐으므로, 더 좁고 명시적인 도구로 교체한다.

| 파일                                                                        | 변경                                                                                                                      | 목적                                                                                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [useChat.ts:77](../../src/features/chat/hooks/useChat.ts#L77)               | `router.replace('/(main)/chat/summary')` → `router.push(...)`로 되돌림(직전 턴 변경 롤백)                                 | `SessionEnd.tsx`의 `dismissAll()` → `index` 불변식 복원 → 증상② 해결                                                        |
| [SessionSummary.tsx](../../src/features/chat/components/SessionSummary.tsx) | 컴포넌트 최상단에 `usePreventRemove(true, () => {})` 추가 (`import { usePreventRemove } from '@react-navigation/native'`) | 이 화면에서 스와이프/Android 백/`router.back()`을 전부 차단 — (이전 보고된) 뒤로가기로 대화 시작 화면 도달 문제의 근본 차단 |
| [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | 동일하게 `usePreventRemove(true, () => {})` 추가                                                                          | `end`에서 뒤로가기로 `summary`에 진입해 `reset()`이 도는 경로(원인 B) 자체를 봉쇄 → 증상① 해결                              |
| [chat/index.tsx:52-60](<../../src/app/(main)/chat/index.tsx#L52-L60>)       | 변경 없음 — 그대로 유지                                                                                                   | `push`로 되돌려도 "종료 버튼 누른 순간 `index`가 잠깐 보이는" 전환 애니메이션 중 깜빡임 방지 목적은 여전히 유효             |

`usePreventRemove`는 "홈으로 돌아가기"(탭 전환, `JUMP_TO`)는 막지 않고 같은 스택 안에서의 pop만 막는다는 걸 §3-3에서 코드로 확인했으므로, 정상 진행 경로(요약→결과→홈)는 그대로 동작해야 한다.

### 적용 안 함 — 검토했지만 채택하지 않은 대안 (1차 계획 당시)

- **`gestureEnabled: false`만 추가**: iOS 스와이프는 막지만 Android 하드웨어 백은 못 막아 원인 B/C를 절반만 해결한다고 판단해 1차로는 보류했다. → **§4-1에서 실기기 재현 후 번복: `usePreventRemove`만으로는 iOS 스와이프 자체가 막히지 않아, 결국 이 옵션을 `usePreventRemove`와 같이 적용했다.**
- **`dismissAll()`을 `router.dismissTo('/(main)/chat')`로 교체**: 현재 스택 루트가 무엇이든 명시적으로 `index`를 타겟할 수 있어 원인 A를 우회할 수 있는 대안이지만, 원인 B(뒤로가기 자체로 `reset()`이 도는 문제)는 그대로 남는다. `usePreventRemove`/`gestureEnabled`로 뒤로가기 자체를 막으면 이 대안은 불필요해진다.

## 4-1. 1차 적용 후 실기기 재현 — `usePreventRemove`만으로는 iOS 스와이프가 안 막힘

1차로 `usePreventRemove(true, () => {})`만 적용한 뒤 실기기로 확인한 결과, **요약 화면에서 뒤로 스와이프가 여전히 그대로 동작**했다. 스와이프 완료 후 도달한 화면은 `ChatBackground`만 있는 빈 화면(=[chat/index.tsx:54-60](<../../src/app/(main)/chat/index.tsx#L54-L60>)의 `sessionPhase === 'ended'` 분기) — `push` 롤백(원인 A 수정)은 의도대로 동작해 `index`로 돌아간 것이고, 거기서 "대화 시작 화면" 대신 빈 화면이 뜬 것도 의도대로지만, **스와이프 자체가 차단되지 않은 것**이 문제다.

원인을 코드로 추적: `@react-navigation/native-stack`(`NativeStackView.native.tsx:278,369-374,411`)은 `usePreventRemove`로 등록된 `preventRemove` 상태를 읽어 `preventNativeDismiss`(iOS 네이티브 prop)로 내려보내는 경로가 분명히 존재한다. 즉 라이브러리 차원의 의도된 기능은 맞지만, 이 레포의 의존성 조합(`@react-navigation/native-stack` 7.15.1, `react-native-screens` ~4.23.0, Expo Go/개발 빌드 환경 등)에서 실제로는 게이트가 걸리지 않았다 — `@react-navigation/native-stack`의 `useDismissedRouteError.tsx:22` 주석에도 "`beforeRemove`로 막는 게 native-stack에서 완전히 지원되지는 않는다"는 경고가 명시돼 있다. 정확한 실패 지점(네이티브 빌드 캐시, Fabric 버전 조합 등)까지는 이 환경에서 더 파고들기 어려워, **`usePreventRemove`는 보조 수단으로 남기고 `gestureEnabled: false`를 1차 수단으로 추가**하는 쪽으로 계획을 수정했다. `gestureEnabled`는 이미 이 레포([onboarding/\_layout.tsx:6](<../../src/app/(auth)/onboarding/_layout.tsx#L6>), [Step1EmotionScreen.tsx:31-33](../../src/features/onboarding/components/Step1EmotionScreen.tsx#L31-L33))에서 동작이 검증된 패턴이라는 점도 채택 이유다.

| 파일                                                                        | 추가 변경                                                                                                                           | 목적                                                       |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [chat/\_layout.tsx](<../../src/app/(main)/chat/_layout.tsx>)                | `summary`/`end` 각각 `<Stack.Screen options={{ gestureEnabled: false }} />` 추가                                                    | iOS 스와이프 백을 네이티브 레벨에서 차단(1차 수단)         |
| [SessionSummary.tsx](../../src/features/chat/components/SessionSummary.tsx) | `useNavigation()` + `useEffect(() => navigation.setOptions({ gestureEnabled: false }), [navigation])` 추가 (onboarding과 동일 패턴) | `_layout.tsx` 정적 옵션이 누락되는 경우를 대비한 동적 보강 |
| [SessionEnd.tsx](../../src/features/chat/components/SessionEnd.tsx)         | 동일                                                                                                                                | 동일                                                       |

`usePreventRemove`는 두 화면 모두 그대로 유지한다 — `gestureEnabled`가 iOS 전용이라 Android 하드웨어 백/`router.back()` 차단은 여전히 이 훅이 담당한다(§3-3에서 확인한 대로 "홈으로 돌아가기"는 탭 전환이라 영향 없음).

## 5. 체크리스트

- [x] `useChat.ts:77` `replace` → `push` 롤백
- [x] `SessionSummary.tsx`에 `usePreventRemove(true, () => {})` 추가
- [x] `SessionEnd.tsx`에 `usePreventRemove(true, () => {})` 추가
- [x] (추가) `chat/_layout.tsx`에 `summary`/`end` `gestureEnabled: false` 추가
- [x] (추가) `SessionSummary.tsx`/`SessionEnd.tsx`에 `navigation.setOptions({ gestureEnabled: false })` 동적 보강 추가
- [x] `tsc --noEmit` / `eslint` 통과 확인
- [ ] 시나리오 ① 종료 → 요약 화면 → (뒤로 스와이프 시도) → 화면 유지되는지 재확인 — 1차 시도에서 실패 확인됨, `gestureEnabled` 추가 후 재검증 필요
- [ ] 시나리오 ② 요약 → "기록 저장하기" → 결과 화면 → (뒤로 스와이프/Android 백 시도) → 화면 유지되는지 확인 — 사용자 확인 필요
- [ ] 시나리오 ③ 결과 화면 → "홈으로 돌아가기" → 채팅 탭 재진입 → `SessionStart`(대화 시작하기)가 정상적으로 보이는지 확인 — 사용자 확인 필요
- [ ] Android 실기기에서 하드웨어 백 버튼으로 동일 시나리오 확인 — `usePreventRemove` 경로만 타므로 별도 검증 필요
- [ ] 재진입 리다이렉트 경로([chat/index.tsx:44-49](<../../src/app/(main)/chat/index.tsx#L44-L49>), 05번 작업)도 `summary`로 `push`되므로 동일하게 뒤로가기가 막히는지 — 의도된 동작(이전 세션 요약에서 되돌아갈 곳이 없는 게 맞음)인지 재확인
- [x] [CHAT_STATUS_SUMMARY.md](../CHAT_STATUS_SUMMARY.md) §5 갱신
- [x] [00-INDEX.md](./00-INDEX.md) 목록 표에 행 추가

## 6. 범위 밖 — 알려진 한계

- `usePreventRemove(true, () => {})`는 콜백에서 아무것도 안 하므로(Android 백 등에서) 사용자에게 "왜 안 움직이지?" 피드백이 없다. `summary`/`end`는 화면 안에 명확한 다음 액션 버튼이 있어 큰 문제는 아니라고 판단했지만, 추후 QA에서 "막혔다는 느낌이 어색하다"는 피드백이 나오면 콜백에서 짧은 햅틱/토스트를 주는 정도의 보완을 고려할 수 있다(이번 범위에서는 다루지 않음).
- `usePreventRemove`가 이 환경에서 iOS 네이티브 스와이프를 막지 못한 정확한 원인(네이티브 빌드 캐시 / `react-native-screens` Fabric 구현 차이 등)은 끝까지 확인하지 못했다. `gestureEnabled: false`로 실질적으로 우회됐으므로 이번 범위에서는 더 파고들지 않으나, 추후 `react-native-screens`/`@react-navigation` 버전을 올릴 때 `usePreventRemove`만으로 충분해지는지 재확인해볼 만하다.
