# 11. 채팅 SSE 실제 서버 연동 (mock 제거)

> 상태: 미착수
> 로그: [logs/11-real-sse-integration.md](../../logs/11-real-sse-integration.md)
> 관련: [CHAT_FRONTEND_TASKS.md §11](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 4](../CHAT_SERVER_GAP_ANALYSIS.md#4-누락된-구현-현재-전부-mock), [SSE_SPEC.md](../SSE_SPEC.md)
> 선행 작업: 01~10번 전부 (이 작업이 mock→실제 전환의 마지막 단계이므로, 핸들러 로직이 먼저 정리돼 있어야 함)
> 미결 이슈: [OPEN_ISSUES.md #5](./OPEN_ISSUES.md#5-메시지-전송-완전-실패-시-재전송-버튼-제공-여부) — 재전송 버튼은 이번 작업 범위에 포함하지 않음 (에러 토스트만)

## 목표

`useChatSse.ts`의 `setTimeout`/`setInterval` mock을 실제 `fetch` + `ReadableStream` 파싱으로 교체하고, 세션 시작/종료 REST 호출도 실제 연동으로 바꾼다. 이번 범위의 마지막 작업이자 가장 큰 작업.

## 배경

지금까지(01~10번) 이벤트 핸들러 로직(`session_meta`/`delta`/`delta.replace`/`crisis`/`done`)은 mock 기준으로 정리했지만, 실제 네트워크 호출 자체가 없다. `parseSSELine()`은 작성돼 있으나 미사용 상태다.

## 테스트 환경 (확인됨, 2026-06-23)

- 실제 동작 확인용 서버: `https://mio.io.kr` (트레일링 슬래시 없이 `EXPO_PUBLIC_API_BASE_URL`에 설정 — `config.ts`가 `${API_BASE_URL}/v1/...`로 그대로 이어붙이므로 슬래시 중복 주의)
- 로컬 `.env`는 현재 `EXPO_PUBLIC_API_BASE_URL=https://api.example.com`(placeholder)로 돼 있어 그대로 두면 연결 안 됨. 테스트 시 `EXPO_PUBLIC_USE_MOCK=false`, `EXPO_PUBLIC_API_BASE_URL=https://mio.io.kr`로 로컬에서 변경 필요 (`.env`는 gitignore 대상이라 커밋되지 않음)
- `src/api/endpoints/auth.ts`는 이미 `USE_MOCK` 체크 후 `apiClient`(axios)로 분기하는 패턴을 쓰고 있다 (`src/constants/config.ts`의 `USE_MOCK`/`API_BASE_URL`). `chat.ts`는 아직 이 분기 없이 항상 mock을 반환하므로, 이 작업에서 동일한 패턴을 따라간다.

## 변경 대상 파일

- `src/features/chat/hooks/useChatSse.ts`
- `src/api/endpoints/chat.ts`

## 구현 체크리스트

- [ ] `useChatSse.ts`: mock(`runMock`, `setTimeout`/`setInterval`) 제거
- [ ] `fetch(POST /v1/sessions/{id}/messages, { headers: { Accept: 'text/event-stream', Authorization, 'Idempotency-Key' } })` + `response.body.getReader()`로 스트림 파싱, `parseSSELine()` 연결
- [ ] `Authorization: Bearer` 헤더를 토큰 저장소에서 직접 읽어 주입 (axios 인터셉터 재사용 불가)
- [ ] `Idempotency-Key`: 메시지 전송마다 `crypto.randomUUID()`로 새로 발급
- [ ] 동기 검증 실패 시 JSON 에러 처리: `res.headers.get('content-type')`로 JSON/스트림 분기, `429`/`409`/`404`/`403`/`410`/`400` 각각 처리
- [ ] 60초 타임아웃 또는 `done` 없이 스트림이 끝나는 경우를 일반 에러 토스트로 처리 (재전송 버튼은 추가하지 않음, 사용자가 직접 다시 입력)
- [ ] `AbortController` 연결 — 화면 이탈/언마운트 시 진행 중인 스트림 정리. 그때까지 쌓인 부분 응답(미완성 AI 메시지)은 롤백하지 않고 화면/스토어에 그대로 둠 (2026-06-23 확정)
- [ ] `src/api/endpoints/chat.ts`: `auth.ts`와 동일한 `USE_MOCK` 분기 패턴으로 `fetchActiveSession`/`startSession`/`endSession`을 실제 `apiClient` 호출로 교체 (mock 고정 응답은 `USE_MOCK=true`일 때만 반환)
- [ ] 로컬 `.env`를 `https://mio.io.kr`로 맞춘 뒤, 전체 시나리오(정상 스트리밍, 보안 거부, 위기 감지, BUFFER, CAUTIOUS_SPECULATIVE 정상/교체/위기전환, fallback 에러)를 실제 서버 대상으로 수동 테스트

## 커밋 메시지

```
feature: 채팅 SSE 실제 서버 연동

- mock(setTimeout/setInterval) 제거, 실제 fetch + ReadableStream 파싱 구현
- Authorization 헤더, Idempotency-Key 적용
- 동기 검증 실패 JSON 에러 처리, 60초 타임아웃/연결 끊김 처리, AbortController 연동
- 세션 시작/종료 REST 실제 호출로 교체

related to: #21
```
