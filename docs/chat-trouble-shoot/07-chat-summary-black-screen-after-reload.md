# 07. 요약 화면 로딩 중 reload 후 채팅 탭 재진입 시 검은 화면 — 원인 분석 및 수정 계획

> 작성일: 2026-06-25
> 상태: 🟡 코드 수정 완료, 실기기 검증 대기 — 상위 트리거 경로는 가설 단계로 남아있어 재현 시 추가 로그 확인 필요
> 관련: [06-session-end-flow-back-navigation.md](./06-session-end-flow-back-navigation.md) — 06번에서 추가한 `usePreventRemove`/`gestureEnabled` 코드 변경을 반영하려고 reload한 것이 이번 증상의 트리거. 06번 자체(뒤로가기 차단)는 정상 동작 확인됨("뒤로가기 안되는 문제는 해결된 것 같아").

## 1. 문제 증상

요약 화면(`/(main)/chat/summary`)이 "대화 요약을 불러오는 중..." 로딩 상태로 떠 있는 동안 앱을 reload하고, 채팅 탭에 다시 들어가면 **배경 이미지조차 적용되지 않은 완전한 검은 화면**이 뜬다. 이전 턴에서 본 "배경은 있는데 내용만 빈" 화면([chat/index.tsx](<../../src/app/(main)/chat/index.tsx>)의 `sessionPhase === 'ended'` 분기, `ChatBackground`는 보임)과는 다른 증상이다 — 이번엔 `ChatBackground`까지 안 보인다.

## 2. 검은 화면이 뜰 수 있는 모든 지점 (전체 리스트업)

전체 코드베이스에서 "배경/View 없이 정말 아무것도 렌더링하지 않는" 지점과, 참고용으로 "스타일은 있지만 내용이 빈" 지점을 함께 정리했다.

### 2-1. 진짜로 아무것도 렌더링하지 않는 지점 (검은 화면 가능)

| 파일                                                                                      | 위치                                               | 트리거 조건                                                         | 이번 증상과의 관련성                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SessionSummary.tsx:46-48](../../src/features/chat/components/SessionSummary.tsx#L46-L48) | `if (!sessionId) { return null; }`                 | 라우트 파라미터(`sessionId`)도 없고 `chatStore.sessionId`도 없을 때 | **★ 가장 유력한 결정적 지점** — `View`/`ChatBackground` 자체가 없어 정확히 "배경도 없는 검은 화면"                                                                                                    |
| [app/\_layout.tsx:33-35](../../src/app/_layout.tsx#L33-L35)                               | `if (!fontsLoaded && !fontError) { return null; }` | 폰트 로딩 완료 전(루트 레이아웃 전체)                               | 매우 짧은 구간(보통 수십~수백ms)이고, 폰트 로딩이 끝나지 않으면 스플래시도 안 사라지므로 "채팅 탭에 들어갔는데"라는 사용자 시나리오와는 안 맞음 — 가능성 낮음                                         |
| [app/index.tsx:1-3](../../src/app/index.tsx#L1-L3)                                        | `return null;` (항상)                              | 루트 경로(`/`) 자체로 라우팅됐을 때                                 | `RootAppContent.tsx`가 항상 `(auth)`/`(main)`로 가도록 스플래시 단계에서 `replaceRoute()`를 호출하므로, 정상 흐름에선 이 화면이 사용자에게 보이지 않아야 함(스플래시 오버레이로 가려짐) — 가능성 낮음 |

### 2-2. 스타일은 있지만 "내용이 빈" 지점 (참고 — 검은 화면 아님)

| 파일                                                                                      | 위치                                                                            | 비고                                                                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [chat/index.tsx:54-60](<../../src/app/(main)/chat/index.tsx#L54-L60>)                     | `isLoading \|\| sessionPhase === 'ended'` → `<ChatBackground />`만 있는 빈 화면 | 이전 턴에서 본 증상이 이쪽. `ChatBackground`는 보임 — 이번 증상과는 다름                              |
| [RootAppContent.tsx:29-33](../../src/features/auth/components/RootAppContent.tsx#L29-L33) | `!splashDone`이면 풀스크린 `<SplashScreen />` 오버레이                          | 부팅 초기엔 이 오버레이가 모든 걸 가리므로, 오버레이 자체가 정상 렌더링되면 검은 화면으로 보이지 않음 |

### 2-3. 에러 바운더리 부재 — 위 표와는 별개의 잠재 원인

코드베이스 전체에 `ErrorBoundary`/`componentDidCatch`/`getDerivedStateFromError`가 **한 곳도 없다**. 즉 렌더링 중 어디서든 처리되지 않은 예외가 던져지면, 그 화면 서브트리는 통째로 사라지고 — 마침 위 2-1·2-2 지점들도 전부 `View`/`ChatBackground`가 없는 검은 배경 위에 떠 있으므로, **렌더 에러가 나도 "검은 화면"으로 보이는 결과는 동일하다.** 이 경로는 표에는 못 넣었지만(특정 파일/라인으로 한정되지 않음) 이번 증상의 후보로 반드시 같이 검토해야 한다(§3-3).

## 3. 결정적 원인 분석

### 3-1. 1차 가설(반증됨) — reload가 같은 라우트(`summary`)로 복원된다

처음엔 "reload 후에도 expo-router가 직전 라우트(`/(main)/chat/summary`)를 그대로 복원하고, 그 사이 `chatStore`(인메모리, reload 시 초기화)만 리셋돼서 `sessionId`가 사라진 것"이라고 의심했다. 그런데 코드를 추적해보니 **이 가설은 반증된다**:

- 부팅 시퀀스는 [app/\_layout.tsx](../../src/app/_layout.tsx) → [RootAppContent.tsx](../../src/features/auth/components/RootAppContent.tsx) → [useSplashAuth.ts](../../src/features/auth/hooks/useSplashAuth.ts) → [restoreSession.ts](../../src/features/auth/services/restoreSession.ts) 순으로 항상 동일하게 실행된다.
- [restoreSession.ts:33-35](../../src/features/auth/services/restoreSession.ts#L33-L35): 토큰 갱신 성공 시 `resolveRoute()`(=[resolveRouteFromSignupStatus](../../src/features/auth/services/signupNavigation.ts#L78-L85))가 **서버의 가입/온보딩 진행 상태만 보고** 목적지 라우트를 정하고, `replaceRoute()`로 그 라우트로 이동한다. "이전에 보고 있던 화면"이라는 개념이 코드 어디에도 없다 — 기존에 완료된 사용자라면 항상 `AUTH_ROUTES.home`(`/(main)/home`)으로 간다.
- 즉 reload하면 사용자는 무조건 홈으로 떨어지고, **"다시 채팅 페이지 들어왔는데"는 사용자가 채팅 탭을 직접 다시 탭한 것**이다 — 1차 가설은 폐기.

### 3-2. 2차 가설(검토했지만 단독으로는 검은 화면을 설명 못 함) — 재진입 리다이렉트 가드 충돌

채팅 탭을 다시 탭하면 [chat/index.tsx](<../../src/app/(main)/chat/index.tsx>)가 새로 마운트되고, `useActiveSession()`이 서버에서 `last_ended_session_id`/`last_summary_status`를 받아 [44-48행](<../../src/app/(main)/chat/index.tsx#L44-L48>)에서 **`sessionId`를 라우트 파라미터로 들고** `summary`로 `push`한다. 이 경로로 가면 `SessionSummary`는 `routeSessionId`를 정상적으로 받으므로 `!sessionId` 분기를 안 탄다.

다만 이 리다이렉트에는 [40-42행](<../../src/app/(main)/chat/index.tsx#L40-L42>)에 "같은 세션으로는 한 번만 리다이렉트" 가드(`storage.chatRedirectedSessionId`, `SecureStore` — reload에도 안 사라짐)가 있다. 이미 한 번 이 경로로 리다이렉트된 적이 있는 세션이면 두 번째 재진입에서는 **리다이렉트 자체가 스킵**되고, `sessionPhase`도 idle이라 [chat/index.tsx:66](<../../src/app/(main)/chat/index.tsx#L66>) `<SessionStart />`로 떨어진다 — 이건 "대화 시작하기" 화면이지 검은 화면이 아니다.

→ 즉 재진입 리다이렉트가 **정상 동작하면** `summary`가 유효한 `sessionId`로 뜨고, **가드에 걸려 스킵되면** `SessionStart`가 뜬다. 두 경우 다 검은 화면이 아니다. 이 경로만으로는 "검은 화면"이 설명되지 않는다 — 즉 `SessionSummary`가 `sessionId` 없이 마운트된 정확한 트리거 경로는 이 환경에서 코드만으로 100% 확정하지 못했다(§6에서 실기기 로그로 확인할 항목으로 남김).

### 3-3. 결정적 지점 — `SessionSummary.tsx`의 무조건 `return null` (§3-2의 경로와 무관하게 유효)

위 가설들과 별개로, **`SessionSummary`가 `sessionId` 없이 마운트되는 경로가 (어떤 식으로든) 존재한다면 그 결과는 항상 동일**하다 — [SessionSummary.tsx:46-48](../../src/features/chat/components/SessionSummary.tsx#L46-L48):

```tsx
if (!sessionId) {
  return null;
}
```

같은 파일의 다른 모든 분기([50-60행](../../src/features/chat/components/SessionSummary.tsx#L50-L60) 로딩, [62-74행](../../src/features/chat/components/SessionSummary.tsx#L62-L74) 실패)는 빠짐없이 `<View className="flex-1 bg-midnight"><ChatBackground />...` 패턴을 쓰는데, 이 분기만 예외적으로 아무 wrapper도 없다. 코드베이스 전체에서 "라우트 화면이 배경 없이 진짜 `null`을 반환하는" 유일한 지점이기도 하다(§2-1). **이게 06번 문서에서 본 "배경은 있는 빈 화면"과 이번 "배경도 없는 검은 화면"의 차이를 정확히 설명한다** — 전자는 `chat/index.tsx`(View+ChatBackground 보유), 후자는 `SessionSummary`(아무것도 없음)다.

추가로, §2-3에서 짚었듯 **에러 바운더리가 전혀 없다는 점도 같이 고려해야 한다.** 06번 문서에서 이 파일에 `useNavigation`/`usePreventRemove`/`useEffect`를 막 추가했고, 사용자가 그 변경을 반영하려고 reload한 직후 바로 이 증상을 봤다는 시간적 일치가 있다 — 만약 그 신규 코드 경로에서 렌더링 중 예외가 났다면(현재로선 `tsc`/`eslint` 통과 + 기존 onboarding 패턴과 동일 구조라 가능성이 높진 않다고 판단하지만, 디바이스에서 직접 검증한 적은 없다), 에러 바운더리가 없으니 결과는 똑같이 "아무것도 안 그려진 검은 화면"이 된다. 이 두 후보(①`sessionId` 누락 ②렌더 에러)는 **증상만으로는 구분이 안 되고**, §6의 진단 방법으로 구분해야 한다.

## 4. 수정 계획

| 파일                                                                                      | 변경                                                                                                                                        | 목적                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [SessionSummary.tsx:46-48](../../src/features/chat/components/SessionSummary.tsx#L46-L48) | `return null` → `ChatBackground`를 포함한 스타일된 fallback 반환 + `useEffect`로 `sessionId`가 없으면 `router.replace('/(main)/chat')` 호출 | 어떤 경로로든 `sessionId` 없이 마운트돼도 검은 화면 대신 배경이 보이고, `chat/index.tsx`의 기존 활성 세션 판별 로직으로 자가 복구(redirect)됨                                                                                                                                                                                                                                                                                        |
| [SessionSummary.tsx:44](../../src/features/chat/components/SessionSummary.tsx#L44)        | `usePreventRemove(true, () => {})` → `usePreventRemove(!!sessionId, () => {})`                                                              | 위에서 추가한 자가복구용 `router.replace`가 같은 화면의 뒤로가기 차단(06번 작업)에 막히지 않게 함 — `sessionId`가 있어 실제 보여줄 내용이 있을 때만 뒤로가기를 막는 게 원래 의도에도 더 맞음                                                                                                                                                                                                                                         |
| [app/\_layout.tsx](../../src/app/_layout.tsx)                                             | `export { ErrorBoundary } from 'expo-router';` 추가                                                                                         | §3-3의 두 번째 후보(렌더 에러)가 맞았을 경우의 안전망. expo-router는 라우트 모듈이 `ErrorBoundary`를 export하면 그 세그먼트 전체를 `<Try catch={ErrorBoundary}>`로 감싸주는 내장 기능이 있다(`useScreens.js:134-153`) — 루트 `_layout.tsx`에서 export하면 앱 전역에 적용됨. 커스텀 UI 대신 expo-router 기본 에러 화면(에러 메시지 + 재시도 버튼)을 그대로 사용 — 이번 사례와 무관하게 에러 바운더리가 전혀 없다는 구조적 공백을 막음 |

### 적용 안 함 — 검토했지만 채택하지 않은 대안

- **재진입 리다이렉트 가드(`storage.chatRedirectedSessionId`) 자체를 손보기**: §3-2에서 확인했듯 이 가드는 "검은 화면"을 직접 유발하지 않는다(스킵되면 `SessionStart`로 감). 손대도 이번 버그는 안 고쳐지고, `summary_status` done→viewed 전환 시점 불명 문제(기존 OPEN_ISSUES, [CHAT_STATUS_SUMMARY.md §3-4](../CHAT_STATUS_SUMMARY.md))와 얽혀 있어 범위가 커진다 — 이번 수정 범위 밖.

## 5. 체크리스트

- [x] `SessionSummary.tsx`: `!sessionId` 분기를 스타일된 fallback + 자가복구 redirect로 교체
- [x] `SessionSummary.tsx`: `usePreventRemove(true, ...)` → `usePreventRemove(!!sessionId, ...)`
- [x] 루트 레벨 `ErrorBoundary` 추가 (`app/_layout.tsx`에서 `export { ErrorBoundary } from 'expo-router'`)
- [x] `tsc --noEmit` / `eslint` 통과 확인
- [ ] **(진단, 가능하면 재현 시도 전에)** 동일 시나리오를 재현하면서 Metro 로그/디바이스 로그에 빨간 에러 화면이나 JS 에러 스택이 찍히는지 확인 — 찍히면 §3-3의 "렌더 에러" 후보가 맞는 것이고, 이번에 추가한 루트 `ErrorBoundary`가 그 에러를 화면에 표시해줄 것
- [ ] 수정 후 동일 시나리오(요약 로딩 중 reload → 채팅 탭 재진입) 재현 시 검은 화면 대신 배경+적절한 화면(로딩/SessionStart/요약)이 뜨는지 확인 — 사용자 확인 필요
- [x] [CHAT_STATUS_SUMMARY.md](../CHAT_STATUS_SUMMARY.md) §5 갱신
- [x] [00-INDEX.md](./00-INDEX.md) 목록 표에 행 추가

## 6. 범위 밖 — 알려진 한계 / 추가 확인이 필요한 부분

- `SessionSummary`가 정확히 *어떤 순서의 사용자 동작*으로 `sessionId` 없이 마운트됐는지는 이 환경(시뮬레이터 없음, 코드 정적 분석만 가능)에서 100% 재현/확정하지 못했다. §3-1에서 가장 그럴듯했던 가설(라우트 자체가 복원됨)은 코드로 반증했고, §3-2(재진입 리다이렉트 가드 충돌)는 검은 화면을 직접 설명하지 못해 보류 상태로 남았다 — 수정 후에도 같은 시나리오가 재현되면 정확한 트리거 경로를 다시 추적해야 한다.
- §3-3에서 언급한 "렌더 에러" 가능성은 추측이다 — 06번에서 추가한 `usePreventRemove`/`gestureEnabled` 코드가 실제로 에러를 던지는지는 디바이스 로그 확인 전까지는 확정할 수 없다.
- 루트 에러 바운더리는 이번엔 "검은 화면 방지" 안전망 목적으로 최소 형태만 추가한다 — 에러 리포팅(Sentry 등) 연동이나 화면별 세분화된 에러 UI는 이번 범위 밖.
