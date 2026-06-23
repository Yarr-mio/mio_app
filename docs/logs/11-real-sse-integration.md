# 11. 채팅 SSE 실제 서버 연동 — 작업 로그

> 연결된 작업 문서: [chat-impl/11-real-sse-integration.md](../chat-impl/11-real-sse-integration.md)
> 이 파일은 실제 구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

- **중요 발견**: React Native의 글로벌 `fetch`는 `response.body.getReader()` 스트리밍을 지원하지 않는다 (RN core의 오래된 한계 — XHR 기반 폴리필이라 ReadableStream을 못 줌). 작업 문서의 의사코드는 표준 `fetch`를 가정하고 있었지만 그대로는 동작하지 않았을 것. 대신 `expo/fetch`(WinterCG 호환, 이미 설치된 `expo` 패키지에 포함되어 있어 새 의존성 추가 아님)로 교체 — `import { fetch } from 'expo/fetch'`. Expo SDK 55 공식 문서에서 `resp.body.getReader()` 스트리밍 예제를 확인하고 결정함.
- `parseSSELine`: 기존 구현은 `data:` 줄 하나만 보고 `{event, data}`를 파싱한다고 가정했는데, 실제 SSE 와이어 포맷은 `event:`와 `data:`가 별도 줄이라 그 가정 자체가 맞지 않았음(애초에 미사용 상태였던 이유). 같은 함수명을 유지하면서 "빈 줄로 구분된 이벤트 블록 하나"를 받아 `event:`/`data:` 줄을 같이 읽어 파싱하도록 재작성.
- `consumeStream`: 디코딩한 텍스트를 버퍼에 누적하고 `\n\n` 기준으로 완결된 이벤트 블록만 잘라 처리. `\r\n`은 `\n`으로 정규화. `done` 이벤트 수신 여부를 boolean으로 반환해 호출부가 "정상 종료"와 "done 없이 끝남"을 구분할 수 있게 함.
- `Authorization` 헤더는 `useAuthStore.getState().accessToken`에서 직접 읽음 (axios 인터셉터가 적용 안 되는 raw fetch라 명시한 대로). 401(토큰 만료) 자동 갱신·재시도는 이번 범위에 포함하지 않음 — SSE_SPEC.md §2의 동기 검증 실패 표에도 401이 없고(JwtAuthenticationFilter가 더 앞단에서 처리하는 일반 인증 실패라 이 표 밖의 케이스), 작업 문서 체크리스트에도 없어 범위를 넘는 추가라고 판단함. 401이 오면 일반 에러 코드들과 마찬가지로 공통 실패 안내만 표시됨 — 토큰 만료가 잦다면 후속 작업으로 분리 필요.
- `Idempotency-Key`는 `crypto.randomUUID()`(작업 문서 의사코드) 대신 `expo-crypto`의 `Crypto.randomUUID()`를 사용. 이 레포의 `src/utils/deviceId.ts`가 이미 "RN에 글로벌 `crypto.randomUUID`가 없을 수 있다"는 전제로 `expo-crypto`의 `getRandomBytesAsync`로 UUID v4를 수동 생성해뒀던 걸 보고, 같은 라이브러리가 동기 `randomUUID()`도 제공한다는 걸 확인해 그대로 사용 (전역 `crypto.randomUUID`에 의존하지 않음).
- 60초 타임아웃: 서버가 SseEmitter 자체 타임아웃(60초)에서 별도 에러 이벤트 없이 스트림을 조용히 끝내므로, 클라이언트가 별도로 60초를 강제하지 않아도 `done` 미수신으로 자연히 감지됨. 다만 연결이 완전히 멈춰버리는 극단적 케이스에 대한 안전망으로 65초(`SSE_STREAM_SAFETY_TIMEOUT_MS`, `constants/config.ts`) 후 클라이언트가 직접 `AbortController.abort()`하도록 추가. 이 안전망 타임아웃과 "사용자가 화면을 나가서 abort된 경우"를 구분하기 위해 `timedOut` 플래그를 따로 둠 (둘 다 `controller.signal.aborted`가 true가 되므로 플래그 없인 구분 불가).
- 화면 이탈/언마운트로 인한 abort는 에러 Alert를 띄우지 않고 조용히 종료. 그때까지 쌓인 부분 응답(미완성 AI 메시지)은 롤백하지 않고 그대로 둠 (2026-06-23 확정 사항 — 별도로 지우는 코드를 추가하지 않은 것 자체가 구현).
- 동기 검증 실패(`content-type: application/json`) 시 상태 코드별 Alert 분기 추가: 429/409/404/403/410/400 + 그 외 공통. 410(`SESSION_ALREADY_ENDED`)은 서버 상태와 클라이언트를 맞추기 위해 `chatStore.endSession()`도 같이 호출.
- `api/endpoints/chat.ts`: `fetchActiveSession`/`startSession`/`endSession`을 `auth.ts`와 동일한 `USE_MOCK` 분기 패턴으로 실제 `apiClient` 호출로 교체. 체크리스트에 이름이 명시되진 않았지만 `fetchSessionSummary`(07번 작업에서 추가)도 같은 파일에서 mock 전용으로 남아있으면 "실제 서버로 전체 시나리오 테스트"가 막히므로 같이 전환함. 서버 응답은 `ApiResponse<T>`(`{success, data, meta}`) 래퍼로 오는데, 이 파일의 기존 반환 타입들은 전부 래퍼 없이 내부 payload만 노출하는 형태로 이미 짜여 있어서(05~07번 작업에서 그대로 따라간 기존 컨벤션), 함수 내부에서 `data.data`만 꺼내 반환하도록 해 기존 타입/호출부(스토어, 훅, 컴포넌트)는 전혀 안 건드림.
- mock 전용 코드 전부 제거됨: `runMock`/`runMockDeltaReplaceScenario`/`MOCK_DELTA_REPLACE_TRIGGER`(02번에서 추가했던 delta.replace 수동 테스트 트리거)/`mockTimeoutRef`/`mockIntervalRef`/`awaitingSocraticScoreRef`. `setMockStartSessionError`(10번)는 `USE_MOCK`이 아닐 때 효과가 없으므로 그대로 남겨둠 — 실제 서버에서도 mock 모드로 되돌아가 그 에러 케이스들을 다시 확인할 수 있어야 해서 유지가 맞다고 판단.
- **남은 작업 (사용자 확인 필요)**: 이 환경엔 백엔드 소스도 없고 시뮬레이터/실기기를 직접 조작할 수도 없어서, 로컬 `.env`를 `https://mio.io.kr` + `EXPO_PUBLIC_USE_MOCK=false`로 바꿔서 실제 서버 대상으로 정상 스트리밍/보안 거부/위기 감지/BUFFER/CAUTIOUS_SPECULATIVE 각 시나리오를 수동으로 확인하는 절차는 수행하지 못했음. 타입체크(`tsc --noEmit`)와 린트는 전부 통과했고 코드 경로는 SSE_SPEC.md 표와 대조해 확인했지만, `expo/fetch`가 실제 헤더(Authorization, Idempotency-Key)·POST 바디·AbortController를 의도대로 처리하는지는 실기기 확인이 필요함.
