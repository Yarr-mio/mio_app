# 09. "홈으로 돌아가기" 후 채팅 탭 재진입 시 결과 화면이 그대로 남아있는 문제 — 원인 분석

> 작성일: 2026-06-25
> 상태: 🟡 코드 수정 완료, 실기기 검증 대기 — 이 환경엔 시뮬레이터가 없어 수동 테스트는 사용자가 직접 확인 필요.
> 관련: [08-session-end-home-navigation-bugs.md](./08-session-end-home-navigation-bugs.md) (08번에서 고친 원인 A~F는 그대로 유효함 — "mio 고정 화면" 증상은 사용자가 실기기에서 직접 확인해 해소를 확인함. 이번 문서는 08번 수정 후에도 남아있는 **별개의 잔여 버그**를 다룬다)
> 관련: [06-session-end-flow-back-navigation.md](./06-session-end-flow-back-navigation.md) (이번 버그의 직접 원인이 되는 `usePreventRemove` 가드가 이 문서에서 추가됨)

## 1. 문제 증상 (사용자 보고)

08번 문서의 수정(원인 A~E 패치)을 적용한 뒤 실기기로 재확인한 결과:

- ✅ 캐릭터가 "mio"로 고정되는 증상은 해소됨.
- 🔴 그러나 핵심 증상은 남아있음: 결과 화면(`/(main)/chat/end`)에서 "홈으로 돌아가기"를 누르면 일단 홈으로는 이동하지만, **채팅 탭에 다시 들어가면 "홈으로 돌아가기" 버튼이 있는 결과 화면이 그대로 떠 있다.** 캐릭터 표시는 이제 정확하지만(이전엔 mio로 고정), 화면 자체는 전혀 정리되지 않는다.
- 결과: 새 대화를 시작할 방법이 없다 — 채팅 탭에 들어갈 때마다 같은 결과 화면만 반복해서 보임(08번 문서가 "이번 버그의 가장 치명적인 영향"으로 지목했던 것과 동일한 결과 상태가, 다른 경로로 다시 발생).

## 2. 관련 코드 (08번 수정 적용 후 현재 상태)

| 파일                                                                               | 핵심 코드                                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [SessionEnd.tsx:31](../../src/features/chat/components/SessionEnd.tsx#L31)         | `usePreventRemove(true, () => {});` — 06번 문서에서 추가, 조건이 항상 `true`                            |
| [SessionEnd.tsx:48-54](../../src/features/chat/components/SessionEnd.tsx#L48-L54)  | `handleGoHome`: `router.dismissAll()` → `router.replace('/(main)/home')` (08번 수정)                    |
| [SessionEnd.tsx:33-46](../../src/features/chat/components/SessionEnd.tsx#L33-L46)  | `useFocusEffect`: 포커스 시 `sessionPhase !== 'ended'`면 `router.dismissAll()` (06번 수정, 그대로 유지) |
| [SessionSummary.tsx:46](../../src/features/chat/components/SessionSummary.tsx#L46) | `usePreventRemove(!!sessionId, () => {});` — 06번 문서에서 추가, `sessionId`가 있을 때 `true`           |

## 3. 원인 분석 — `usePreventRemove(true, ...)`가 "뒤로가기"뿐 아니라 우리가 직접 호출하는 `dismissAll()`까지 막는다

### 3-1. `dismissAll()`이 실제로 무엇을 디스패치하는지

[routing.js:131-136](../../node_modules/expo-router/build/global-state/routing.js#L131-L136):

```js
function dismissAll() {
  if (emitDomEvent.emitDomDismissAll()) return;
  exports.routingQueue.add({ type: 'POP_TO_TOP' });
}
```

`target` 없이 `{ type: 'POP_TO_TOP' }` 액션만 큐에 쌓인다. 이 큐는 `useImperativeApiEmitter`([imperative-api.js:24-29](../../node_modules/expo-router/build/imperative-api.js#L24-L29))가 `useEffect`에서 `routingQueue.run(ref)`로 순서대로 드레인하는데, `ref`는 루트 `navigationRef`다.

루트 `navigationRef.dispatch(action)`은 [BaseNavigationContainer.js:106-112](../../node_modules/@react-navigation/core/lib/module/BaseNavigationContainer.js#L106-L112)에서:

```js
const dispatch = useLatestCallback((action) => {
  listeners.focus[0]((navigation) => navigation.dispatch(action));
});
```

즉 "루트에서 디스패치"가 아니라 **현재 포커스된 최하위 화면의 `navigation` 객체에서 디스패치**하는 것과 동일하게 동작한다. `handleGoHome`이 호출되는 시점엔 `end` 화면이 포커스돼 있으므로, 이 `POP_TO_TOP`은 `end`의 `navigation.dispatch`로 시작해 부모로 버블링되고, `chat` `Stack`(가장 가까운 조상 스택)의 라우터가 이를 처리한다 — 08번 문서가 가정한 "다음 탭 전환 전이라 `chat`이 아직 대상"이라는 전제는 맞다.

### 3-2. `chat` `Stack`이 `POP_TO_TOP`을 처리하는 과정에서 "제거되는 라우트"에 대해 `beforeRemove`가 발생한다

[StackRouter.js:356-362](../../node_modules/@react-navigation/routers/lib/module/StackRouter.js#L356-L362):

```js
case 'POP_TO_TOP':
  return router.getStateForAction(state, {
    type: 'POP',
    payload: { count: state.routes.length - 1 },
  }, options);
```

`POP_TO_TOP`은 내부적으로 `POP`으로 변환돼 `routes = [index]`(나머지 전부 제거)인 새 상태를 계산한다. 이 계산 자체는 정상이다. 문제는 이 결과를 실제로 반영하기 직전 단계에 있다.

[useOnAction.js:46-60](../../node_modules/@react-navigation/core/lib/module/useOnAction.js#L46-L60):

```js
let result = router.getStateForAction(state, action, ...);
...
if (result !== null) {
  onDispatchAction(action, state === result);
  if (state !== result) {
    const isPrevented = shouldPreventRemove(emitter, beforeRemoveListeners, state.routes, result.routes, action);
    if (isPrevented) {
      return true;          // ★ 액션은 "처리됨"으로 리턴되지만 setState는 호출되지 않는다
    }
    setState(result);
  }
  ...
}
```

`state !== result`(라우트가 실제로 줄어드는 모든 경우, 액션 타입과 무관하게)일 때마다 `shouldPreventRemove`가 호출된다. 여기서 핵심은 — **이 검사는 액션 타입(`POP_TO_TOP`인지 `GO_BACK`인지)을 구분하지 않고, "제거되는 라우트가 있는가"만 본다.**

[useOnPreventRemove.js:7-44](../../node_modules/@react-navigation/core/lib/module/useOnPreventRemove.js#L7-L44) `shouldPreventRemove`:

```js
const removedRoutes = currentRoutes.filter(route => !nextRouteKeys.includes(route.key)).reverse();
for (const route of removedRoutes) {
  ...
  const event = emitter.emit({ type: 'beforeRemove', target: route.key, data: { action: beforeRemoveAction }, canPreventDefault: true });
  if (event.defaultPrevented) {
    return true;   // 제거되는 라우트 중 단 하나라도 막으면 액션 전체가 무효화된다
  }
}
return false;
```

`chat` 스택의 `currentRoutes = [index, summary, end]`, `result.routes = [index]`이므로 `removedRoutes = [summary, end].reverse() = [end, summary]` — **`end`가 먼저 검사된다.**

### 3-3. `SessionEnd`의 `usePreventRemove(true, () => {})`가 액션 타입을 가리지 않고 항상 `preventDefault()`를 호출한다

[usePreventRemove.js:31-39](../../node_modules/@react-navigation/core/lib/module/usePreventRemove.js#L31-L39):

```js
const beforeRemoveListener = useLatestCallback((e) => {
  if (!preventRemove) return;
  e.preventDefault(); // ★ 조건 없이 무조건 prevent — 액션 타입을 보지 않는다
  callback({ data: e.data });
});
```

[SessionEnd.tsx:31](../../src/features/chat/components/SessionEnd.tsx#L31)에서 `preventRemove` 인자가 `true`(상수)이므로, `end` 라우트를 제거하려는 **모든** `beforeRemove` 이벤트가 무조건 `preventDefault()`된다. 이 이벤트엔 `e.data.action`(원본 액션 객체, 타입 포함)이 들어있지만 콜백이 이를 들여다보지 않고 무조건 막는다.

결과: `handleGoHome`의 `router.dismissAll()`이 큐를 통해 `POP_TO_TOP`으로 디스패치되면, `chat` 스택이 `end`를 제거하려고 시도 → `end`의 `beforeRemove` 리스너가 (스와이프/하드웨어 백과 전혀 구분되지 않은 채) 무조건 `preventDefault()` → `shouldPreventRemove`가 `true` 반환 → **`setState(result)`가 호출되지 않아 `chat` 스택은 `[index, summary, end]`(포커스 `end`)에서 한 글자도 바뀌지 않는다.** `dismissAll()`은 "처리된 액션"으로 조용히 소비되지만 실제로는 아무 효과도 없다.

이후 `router.replace('/(main)/home')`은 (08번 문서가 분석한 대로) `JUMP_TO`로 변환되어 홈 탭으로는 정상 전환되지만, `chat` 탭의 내부 스택은 여전히 `end`에 멈춰있는 채로 보존된다. 채팅 탭에 재진입하면 보존된 그 `end` 화면이 다시 보인다 — 사용자가 보고한 증상과 정확히 일치한다.

### 3-4. 이 문제는 `handleGoHome`만의 문제가 아니다 — 재진입 시 자가복구 로직도 동일하게 막힌다

[SessionEnd.tsx:33-46](../../src/features/chat/components/SessionEnd.tsx#L33-L46)의 `useFocusEffect`는 포커스될 때마다 `sessionPhase !== 'ended'`면 `router.dismissAll()`을 호출해 "잘못된 상태로 재노출된 `end`"를 복구하려고 시도한다. 이 호출도 **같은 `usePreventRemove(true, ...)`에 의해 똑같이 막힌다** — `end`가 포커스를 받는 모든 경로(탭 재진입 포함)에서 이 복구 시도가 실행되지만 매번 무효화되므로, **사용자가 채팅 탭에 들어갈 때마다 복구를 "시도"는 하지만 절대 성공하지 못하는 무한 루프 같은 상태**가 된다. 이것이 "새 대화를 시작할 방법이 없다"는 증상의 직접 원인이다 — 막힌 게 한 번이 아니라, 빠져나갈 수 있는 모든 경로가 구조적으로 봉쇄돼 있다.

### 3-5. `SessionSummary`도 같은 결함을 잠재적으로 갖고 있다

[SessionSummary.tsx:46](../../src/features/chat/components/SessionSummary.tsx#L46) `usePreventRemove(!!sessionId, () => {})`도 동일한 패턴이다. `removedRoutes`가 `[end, summary]` 순서로 검사되므로 이번 재현에서는 `end`의 차단이 먼저 걸려 `summary`까지는 검사가 도달하지 않았을 가능성이 높지만, `end`가 고쳐진 뒤에는 `summary` 차례가 검사된다 — `dismissAll()` 시점에 `sessionId`가 아직 `null`로 리셋되지 않았다면(반복문 블러 cleanup의 `reset()`은 포커스/블러 이펙트가 커밋된 후에야 실행되므로, 액션 처리 시점엔 아직 이전 값일 가능성이 큼) `summary`도 `dismissAll()`을 막아버릴 수 있다. 즉 **`end`만 고치면 운 좋게 통과할 수도 있지만, `summary`도 구조적으로 동일한 결함을 갖고 있어 같이 고쳐야 안전하다.**

### 3-6. 액션 타입으로 "진짜 뒤로가기"와 "우리가 호출하는 정리용 액션"을 구분할 수 있다 (수정 방향의 근거)

이 레포에서 `end`/`summary`의 `beforeRemove`에 실제로 도달하는 액션 타입은 코드로 추적한 결과 다음 셋뿐이다:

| 트리거                                           | 액션 타입    | 근거                                                                                                                                                                                                 |
| ------------------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS 스와이프 백 / 네이티브 dismiss / 헤더 백버튼 | `POP`        | [NativeStackView.native.js:433-447](../../node_modules/@react-navigation/native-stack/lib/module/views/NativeStackView.native.js#L433-L447) `navigation.dispatch({ ...StackActions.pop(...), ... })` |
| Android 하드웨어 백                              | `GO_BACK`    | [useBackButton.native.js:13](../../node_modules/@react-navigation/native/lib/module/useBackButton.native.js#L13) `navigation.goBack()`                                                               |
| `router.back()` (프로그램적)                     | `GO_BACK`    | [routing.js:137-143](../../node_modules/expo-router/build/global-state/routing.js#L137-L143) `goBack()` → `routingQueue.add({ type: 'GO_BACK' })`                                                    |
| `router.dismissAll()` (우리가 호출)              | `POP_TO_TOP` | §3-1                                                                                                                                                                                                 |

`StackRouter`는 `POP_TO_TOP`을 내부적으로 `POP`으로 재계산하지만([StackRouter.js:356-362](../../node_modules/@react-navigation/routers/lib/module/StackRouter.js#L356-L362)), 이건 **상태 계산에만 쓰이는 내부 호출**이고 `useOnAction.js`가 `shouldPreventRemove`에 넘기는 `action`은 **원본 액션 객체**(`onAction(action, ...)`의 그 `action`)이므로 `e.data.action.type`은 그대로 `'POP_TO_TOP'`으로 관찰된다 — 즉 콜백에서 `action.type`을 보면 "사용자의 뒤로가기"(`POP`/`GO_BACK`)와 "우리의 정리용 액션"(`POP_TO_TOP`)을 정확히 구분할 수 있다.

(참고로 06번 문서가 이미 §4-1에서 확인했듯, iOS 스와이프는 이 환경에서 `usePreventRemove`로 막히지 않고 `_layout.tsx`/동적 `setOptions`의 `gestureEnabled: false`가 실질적 방어 수단이다. 즉 `usePreventRemove`가 실제로 막아야 하는 건 `GO_BACK`(Android 하드웨어 백, `router.back()`) 뿐이고, `POP`은 애초에 게이트 역할을 거의 하지 않고 있었다.)

### 3-7. 배제한 대안 설명

- **Tabs의 `unmountOnBlur`/`lazy` 등으로 탭 전환 시 `chat` 스택이 리셋되는 것 아닌가?** → [(main)/\_layout.tsx](<../../src/app/(main)/_layout.tsx>)를 확인한 결과 `Tabs`에 그런 옵션이 전혀 없다(`headerShown: false`, `tabBar`만 커스텀). 06번 문서의 "탭 전환 시 언마운트 안 됨" 전제가 그대로 유효하므로 이 경로는 배제.
- **08번 수정의 순서(`dismissAll()` → `replace()`) 자체가 잘못된 것 아닌가?** → §3-1에서 확인했듯 `dismissAll()`이 디스패치되는 시점(아직 `chat` 포커스 상태)은 08번 문서의 의도대로 맞다. 문제는 순서가 아니라, 그 디스패치가 **도달은 했지만 `usePreventRemove`에 의해 무효화**되는 것이다.

## 4. 증상 ↔ 원인 매핑

| 증상                                                                     | 원인                                                                                                                                                         |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "홈으로 돌아가기" 후 채팅 탭 재진입 시 결과 화면(`end`)이 그대로 보임    | `handleGoHome`의 `dismissAll()`이 `SessionEnd`의 `usePreventRemove(true, () => {})`에 의해 무효화됨(§3-1~§3-3)                                               |
| 그 뒤로도 채팅 탭에 들어갈 때마다 같은 화면이 반복되어 새 대화 시작 불가 | 재진입 시 실행되는 `useFocusEffect`의 자가복구용 `dismissAll()`도 동일한 가드에 의해 매번 무효화됨(§3-4) — 빠져나갈 수 있는 모든 경로가 같은 가드에 막혀있음 |
| (아직 미관찰, 잠재적) `end` 수정 후 `summary`에서 같은 증상 재발 가능성  | `SessionSummary`의 `usePreventRemove(!!sessionId, () => {})`도 동일 결함(§3-5)                                                                               |

## 5. 수정 계획 (구현 전 검토용 — 아직 적용 안 함)

핵심 방향: `usePreventRemove`의 "조건 없이 무조건 차단" 방식을 버리고, **액션 타입을 보고 선택적으로 차단**하는 커스텀 `beforeRemove` 리스너로 교체한다. `usePreventRemove`는 이런 세분화를 지원하지 않으므로(불리언 게이트 하나로만 켜고 끔), 같은 역할을 하는 저수준 API(`navigation.addListener('beforeRemove', handler)` — `usePreventRemove` 내부가 실제로 이걸 감싸고 있는 것)를 직접 사용한다.

| 파일                                                                               | 변경(안)                                                                                                                                                                                                                           | 목적                                                                                                      |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [SessionEnd.tsx:31](../../src/features/chat/components/SessionEnd.tsx#L31)         | `usePreventRemove(true, () => {})` 제거. 대신 `useEffect(() => navigation.addListener('beforeRemove', (e) => { if (e.data.action.type === 'POP' \|\| e.data.action.type === 'GO_BACK') e.preventDefault(); }), [navigation])` 추가 | `GO_BACK`/`POP`(사용자의 실제 뒤로가기)은 그대로 차단하되, `POP_TO_TOP`(우리의 `dismissAll()`)은 통과시킴 |
| [SessionSummary.tsx:46](../../src/features/chat/components/SessionSummary.tsx#L46) | 동일 패턴으로 교체. 단 `sessionId`가 없을 때는(자가복구 redirect가 동작해야 하므로) 리스너 자체를 비활성화 — 기존 `!!sessionId` 게이트와 동등한 조건을 새 리스너 내부에도 유지                                                     | 동일 결함(§3-5) 제거                                                                                      |

부가 확인 사항:

- `usePreventRemove`를 버리면 `preventNativeDismiss`(iOS 네이티브 prop) 연동도 함께 사라지지만, 06번 문서 §4-1에서 이미 "이 환경에서는 `usePreventRemove`만으로 iOS 스와이프가 막히지 않았다"고 실기기로 확인했고 실제 방어는 `gestureEnabled: false`가 담당하고 있으므로 **회귀가 아니다.**
- `GO_BACK`/`POP` 차단을 유지하므로 06번 문서가 막으려던 증상(뒤로가기로 요약 화면이 빈 화면 되는 문제)은 계속 차단된 채로 유지된다.
- `e.data.action.type`이 `'POP_TO_TOP'`임을 코드로 확정했으므로(§3-6), 이 매핑은 추측이 아니라 라이브러리 소스 추적으로 검증된 사실이다. 다만 라이브러리 버전이 올라가면(현재 `@react-navigation/core` 7.17.4, `@react-navigation/routers` 7.5.5, `@react-navigation/native-stack` 7.15.1, `expo-router` 55.0.16) 내부 구현이 바뀔 수 있어 재검증이 필요할 수 있다.

## 6. 체크리스트

- [x] `SessionEnd.tsx`의 `usePreventRemove(true, () => {})`를 액션 타입 기반 커스텀 `beforeRemove` 리스너로 교체
- [x] `SessionSummary.tsx`의 `usePreventRemove(!!sessionId, () => {})`를 동일 패턴으로 교체
- [x] `tsc --noEmit` / `eslint` 통과 확인
- [ ] 시나리오: 결과 화면 → "홈으로 돌아가기" → 채팅 탭 재진입 → `SessionStart`(대화 시작하기)가 보이는지 확인 (이번 문서의 핵심 재현 시나리오)
- [ ] 시나리오: 새 대화를 실제로 시작할 수 있는지 확인
- [ ] 시나리오: 요약/결과 화면에서 Android 하드웨어 백 버튼 시도 → 화면이 그대로 유지되는지 (06번에서 고친 차단이 여전히 동작하는지 회귀 확인)
- [ ] 시나리오: 요약/결과 화면에서 iOS 스와이프 백 시도 → 화면이 그대로 유지되는지 (`gestureEnabled: false`가 여전히 동작하는지 회귀 확인)
- [x] [CHAT_STATUS_SUMMARY.md](../CHAT_STATUS_SUMMARY.md) 갱신
- [x] [00-INDEX.md](./00-INDEX.md) 목록 표 갱신

## 7. 범위 밖 / 잔여 불확실성

- §3-6의 액션 타입 표는 **현재 코드에 실제로 존재하는 호출 경로**를 추적한 결과다. 추후 `summary`/`end`에 헤더 백버튼이나 다른 네비게이션 트리거가 추가되면, 그 트리거가 디스패치하는 액션 타입도 차단 목록에 포함해야 하는지 재검토가 필요하다.
- 이 환경엔 시뮬레이터가 없어 위 분석은 라이브러리 소스 코드 추적만으로 확정한 것이며, 실기기 동작은 §6 체크리스트의 시나리오로 사용자가 직접 확인해야 한다.
- §3-5(`SessionSummary`도 동일 결함을 가질 가능성)는 `end`가 고쳐지기 전까지는 실제로 트리거된 적이 없어(항상 `end`가 먼저 막으므로) 실기기에서 직접 재현되지는 않았다 — `end` 수정 후에도 `summary`를 같이 고치지 않으면 같은 증상이 `summary` 단계에서 재발할 수 있다는 게 코드 추적상의 결론이다.
