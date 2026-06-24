# 01. SSE 스트리밍 실측 재검증 + 진단 로그 제거

> 상태: ⬜ 미착수
> 로그: `trouble-impl/logs/01-sse-realtime-reverify.md` (작업 시작 시 생성)
> 관련: [chat-trouble-shoot/03-backend-fixes-applied.md §1](../chat-trouble-shoot/03-backend-fixes-applied.md#1-sse-스트리밍-버퍼링-문제-), [chat-trouble-shoot/02-findings-sse-frontend-delivery.md](../chat-trouble-shoot/02-findings-sse-frontend-delivery.md)
> 선행 작업: 없음 (실기기 QA가 먼저, 코드 변경은 QA 결과에 따라 결정)

## 목표

백엔드의 nginx `proxy_buffering` 수정(`X-Accel-Buffering: no` + `Cache-Control: no-cache` 헤더 추가, 커밋 `ae64c33`)이 실제로 SSE 토큰을 점진적으로 전달하는지 실기기에서 재확인하고, 확인되면 진단용으로 남겨둔 임시 로그를 제거한다.

## 배경

[02-findings-sse-frontend-delivery.md](../chat-trouble-shoot/02-findings-sse-frontend-delivery.md)에서 `reader.read()`가 요청당 정확히 2번만 호출되고(`session_meta`~`done`이 한 번에 도착), `transfer-encoding: Identity`로 응답이 와 nginx 버퍼링이 원인임을 실측으로 확정했다. 백엔드가 헤더를 추가해 수정했다고 보고했지만(`03-backend-fixes-applied.md` §1), **"코드 diff 기준 정리이며 실기기 재현 확인은 하지 않았다"**고 명시돼 있어 재검증이 필요하다. 재검증에 쓴 로그는 이전 작업에서 진단용으로 추가된 것으로, 원인 확정 후 제거하기로 이미 합의돼 있었다([02-sse-streaming-not-incremental.md](../chat-trouble-shoot/02-sse-streaming-not-incremental.md) "정리 시점" 절).

## 변경 대상 파일

- [src/features/chat/hooks/useChatSse.ts](../../src/features/chat/hooks/useChatSse.ts) — `★` 표시된 5곳만 대상 (이벤트 핸들러 로직 자체는 변경 없음)
  - `sendStartedAtRef` 선언 및 대입 (`:45-46`, `:262`)
  - `performSendMessage`의 응답 헤더 로그 (`:278-281`)
  - `consumeStream`의 `chunk #N arrived` 로그 + `chunkIndex` 변수 (`:205`, `:209-213`)
  - `handleSessionMeta`의 `session_meta dispatched` 로그 (`:95-98`)
  - `handleDelta`의 `delta dispatched` 로그 (`:114-117`)

## 사전 조건

- 로컬 `.env`: `EXPO_PUBLIC_USE_MOCK=false`, `EXPO_PUBLIC_API_BASE_URL=https://mio.io.kr`
- 실기기 또는 실기기에 준하는 환경(에뮬레이터/시뮬레이터도 네트워크 스택은 동일하므로 가능, 단 nginx 경유 여부가 핵심이므로 로컬 mock 서버 금지)

## 절차 / 구현 체크리스트

- [ ] 메시지 1회 전송 후 터미널(`npx expo start` 또는 `react-native log-android`/`log-ios`)에서 `[sse]` 로그를 시간순으로 수집
- [ ] 같은 절차로 최소 1회 더 반복해 재현성 확인 (02-findings 문서가 2회 캡처로 확정한 것과 동일한 방식)
- [ ] 아래 판단 기준표로 정상/비정상 판정

### 판단 기준

1차 신호는 `read()`(`chunk #N arrived`) 호출 횟수와 시간 분산이고, `transfer-encoding` 헤더는 보조 신호다 — HTTP/2 경유 등 일부 환경에서는 이 헤더 자체가 노출되지 않을 수 있어, 헤더만으로 판정하지 않는다.

| 관찰                                                                                                                                                                | 판정                     | 다음 행동                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `chunk #N arrived` 로그가 여러 번, 응답 생성 시간(1~3초)에 걸쳐 고르게 분산 (참고: 응답 헤더의 `transfer-encoding`이 `chunked`이면 보조 확증)                       | ✅ 수정 확정             | 아래 "로그 제거" 체크리스트로 진행                                                    |
| `chunk #0`에 `session_meta`~`done`이 전부 들어있고 `chunk #1`이 `done=true, bytes=0`뿐 (이전과 동일 패턴) — `transfer-encoding: Identity`가 함께 관찰되면 보조 확증 | ❌ 수정 미반영/효과 없음 | 로그 유지. 백엔드에 재확인 요청 (배포 반영 여부, 다른 경로의 프록시/CDN 존재 여부 등) |
| 그 외 애매한 패턴                                                                                                                                                   | 판단 불가                | 02-findings 문서의 다른 후보(후보 2~4)도 함께 재검토                                  |

### 검증 통과 시 — 로그 제거

- [ ] 위 5곳의 `★` 표시 코드를 전부 제거 (로직에는 영향 없는 순수 로깅 코드이므로 제거 후 동작 변화 없어야 함)
- [ ] 제거 후 최소 2개 시나리오로 가볍게 재확인 — 로그 제거 자체가 회귀를 만들지 않았는지만 체크: ① 정상 스트리밍(SPECULATIVE happy path), ② 위기/BUFFER 등 비-happy-path 1개(`consumeStream`은 모든 시나리오가 공통으로 거치는 경로라 happy path만으로는 부족)

## 커밋 메시지

```
chore: SSE 버퍼링 수정 실측 재검증 후 진단 로그 제거

- nginx X-Accel-Buffering 수정이 실기기에서 점진적 스트리밍으로 이어지는지 재확인
- 원인 확정에 썼던 useChatSse.ts의 임시 진단 로그 제거

related to: #21
```

(검증에 실패해 로그를 유지하기로 한 경우, 이 커밋은 만들지 않고 로그 결과만 `trouble-impl/logs/01-sse-realtime-reverify.md`에 기록한다.)
