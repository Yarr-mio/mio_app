# 10. 세션 시작 실패 에러 코드별 분기 처리 — 작업 로그

> 연결된 작업 문서: [chat-impl/10-session-start-error-handling.md](../chat-impl/10-session-start-error-handling.md)
> 이 파일은 실제 구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

- "토스트 안내"라고 적혀 있지만, 이 코드베이스에 실제 Toast 컴포넌트/훅이 없다 (FOLDER_STRUCTURE.md엔 계획만 있고 구현 안 됨). 기존 auth 플로우(SignUpInfoScreen 등)가 전부 `Alert.alert(title, message, buttons)`로 안내 후 확인 버튼 콜백에서 다음 동작을 트리거하는 패턴을 쓰고 있어서, 새 Toast 인프라를 만드는 대신 동일한 `Alert.alert` 패턴을 그대로 따름.
- `useStartChatSession`의 `onError`에서 `readApiErrorCode`/`readApiHttpStatus`(`features/auth/utils/readApiError.ts`)를 그대로 재사용 — axios 에러에서 `error.code`/`error.response.status`를 읽는 범용 유틸이라 auth 전용 로직이 없어 기능 경계상 재사용이 안전하다고 판단함 (새 유틸 중복 작성 대신).
- `ONBOARDING_REQUIRED`(403): Alert 확인 → `AUTH_ROUTES.onboardingStep1`로 `router.replace`.
- `SESSION_ALREADY_ACTIVE`(409): Alert 확인 → `queryKeys.chat.activeSession()` invalidate → `chat/index.tsx`의 기존 `useEffect`가 재조회된 활성 세션으로 자동으로 `ChatMain`까지 데려감 (05번 작업에서 만든 분기 재사용, 별도 코드 불필요).
- 그 외 코드: 공통 Alert.
- mock으로 3가지 케이스 모두 강제 발생 가능하게 `api/endpoints/chat.ts`에 `setMockStartSessionError()` 추가 (axios의 `isAxiosError()`가 `isAxiosError === true` 플래그만 검사하길래, 실제 axios 요청 없이 같은 모양의 평범한 객체로 흉내냄). `SessionStart.tsx`에 `USE_MOCK`일 때만 보이는 임시 테스트 버튼 3개 추가 (`ChatHeader`의 `TestSocraticFlowButton`과 같은 성격, 11번 작업에서 mock 제거 시 같이 삭제).
- 백엔드 서버가 없어 시뮬레이터로 직접 탭해 Alert가 뜨는 모습을 보지는 못했음 — 타입체크/린트와 코드 경로 추적으로만 확인했고, 실기기/시뮬레이터 수동 확인은 사용자에게 위임.
