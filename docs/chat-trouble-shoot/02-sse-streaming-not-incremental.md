# 02. SSE 응답이 한 글자씩 도착하는데도 화면엔 완료 후 한번에 표시되는 문제

> 상태: **원인 확정됨** — 실기기 로그 캡처(2회 재현)로 후보 1(서버/프록시 버퍼링) 확정. 상세 근거는 [02-findings-sse-frontend-delivery.md](./02-findings-sse-frontend-delivery.md) 참고.
> 관련 파일: `src/features/chat/hooks/useChatSse.ts`, `docs/SSE_SPEC.md`, `docs/logs/11-real-sse-integration.md`

## 증상

메시지를 보내면 네트워크 탭에는 `delta` 이벤트가 한 글자(토큰) 단위로 도착하는 것처럼 보인다. 하지만 실제 화면에서는:

- "..." 타이핑 인디케이터(`TypingIndicator`)가 응답이 끝날 때까지 계속 돈다.
- AI 응답 텍스트가 중간에 조금씩 채워지지 않고, 응답이 전부 끝난 시점(`done` 이벤트)에 통째로 한번에 나타난다.

기대 동작은 "글자가 도착하는 즉시 말풍선에 이어 붙어야 함" (SSE_SPEC.md의 SPECULATIVE/CAUTIOUS_SPECULATIVE 경로가 정상 동작할 때의 모습).

## 이전 작업에서 이미 남겨진 위험 신호

이 부분은 11번 작업([chat-impl/11-real-sse-integration.md](../chat-impl/11-real-sse-integration.md)) 때부터 **검증되지 않은 채로 남아있던 부분**이다.

> [logs/11-real-sse-integration.md:18](../logs/11-real-sse-integration.md) — "...코드 경로는 SSE_SPEC.md 표와 대조해 확인했지만, `expo/fetch`가 실제 헤더(Authorization, Idempotency-Key)·POST 바디·AbortController를 의도대로 처리하는지는 실기기 확인이 필요함."

즉 "이벤트 핸들러 로직"은 점검됐지만, `expo/fetch`가 **실제로 한 청크씩 점진적으로 스트리밍해주는지 자체는 한 번도 실기기에서 확인된 적이 없다.** 지금 보고된 증상은 바로 그 미검증 리스크가 실제로 터진 것일 가능성이 높다.

## 코드 분석 — 이벤트 처리 파이프라인 자체는 구조적으로 문제없어 보임

`useChatSse.ts`의 처리 흐름을 단계별로 보면:

1. `performSendMessage` (`useChatSse.ts:237-293`) — `expo/fetch`로 POST 요청, `res.body.getReader()`로 리더 획득
2. `consumeStream` (`useChatSse.ts:191-235`) — `while (true) { await reader.read() }` 루프. 매 `read()` 결과를 디코딩해 버퍼에 누적하고, `\n\n`으로 완결된 이벤트 블록을 찾으면 **그 즉시** `parseSSELine`으로 파싱해 핸들러로 디스패치. 다음 `read()`를 기다리기 전에 현재 버퍼에 있는 블록을 전부 처리함 (`while (separatorIndex !== -1)` 루프).
3. `handleSessionMeta`(`:92-105`) — `session_meta` 수신 즉시 `setAiTyping(false)` 호출 → 이 시점부터 타이핑 인디케이터가 사라지고 빈 AI 말풍선이 보여야 함.
4. `handleDelta`(`:107-111`) — `delta` 수신마다 `appendDelta(msgId, chunk)`로 zustand store를 즉시 갱신. `ChatMain`/`MessageBubble`은 이 store를 구독하고 있어 갱신될 때마다 리렌더되는 구조 (별도 메모이제이션으로 막혀있지 않음 — `ChatMain.tsx:18`, `MessageBubble.tsx`).

즉 "이벤트 1개 수신 = store 갱신 1번 = 리렌더 1번"이라는 구조 자체는 정상이다. **"`session_meta`가 와도 타이핑 인디케이터가 안 사라지고, 끝날 때까지 계속 돈다"는 보고가 핵심 단서다.** `session_meta`는 SSE_SPEC.md §2에 따르면 동기 검증을 통과하면 LLM 호출 전에 가장 먼저, 거의 즉시 전송된다. 만약 이벤트 처리 로직 자체에 버그가 있어서 리렌더만 늦게 일어나는 거라면 최소한 `session_meta`는 빨리 처리돼서 인디케이터가 빨리 사라져야 한다. 그런데 인디케이터가 "끝날 때까지" 계속 돈다는 건, **JS 코드(`consumeStream`)가 첫 이벤트조차 응답이 끝나기 전까지는 아예 받지 못하고 있다**는 뜻에 더 가깝다 — 즉 리렌더링 문제가 아니라 **스트림 자체가 어딘가에서 통째로 버퍼링되고 있다는 강한 신호**다.

## 원인 후보 (가능성 순)

### 후보 1 (가능성 높음): 응답이 어딘가에서 압축(gzip) 또는 버퍼링되어 클라이언트에 한번에 전달됨

`text/event-stream` 응답이 서버↔클라이언트 사이의 어느 한 지점(리버스 프록시/CDN/네이티브 HTTP 클라이언트의 자동 압축·해제 로직)에서 압축되거나 버퍼링되면, 네트워크 와이어 레벨에서는 바이트가 점진적으로 도착해도 JS의 `ReadableStream`에는 전체 응답이 모인 후에야 한번에 노출된다. 이게 흔히 발생하는 이유:

- HTTP 클라이언트(Android OkHttp/iOS URLSession 등)는 `Content-Encoding: gzip` 응답을 해제할 때, 스트리밍 해제를 지원하지 않고 전체를 모아서 한번에 압축 해제하는 구현이 흔하다.
- nginx 등 리버스 프록시는 기본적으로 `proxy_buffering on`이라, 백엔드(Spring `SseEmitter`)가 청크 단위로 flush해도 프록시가 모아서 보낼 수 있다. `text/event-stream`을 `gzip_types`에서 빼고 `proxy_buffering off` + `X-Accel-Buffering: no` 헤더가 필요한 게 SSE 배포의 정석이다.
- "네트워크 탭에서 한 글자씩 잘 오는 것처럼 보인다"는 관찰과 모순되지 않는다 — 네트워크 탭 도구가 보는 지점(예: 패킷 레벨, 혹은 서버 자체 로그)과 RN JS가 실제로 `read()`를 통해 받는 지점 사이에 위와 같은 중간 버퍼링 계층이 있다면, 둘의 타이밍이 다르게 보일 수 있다.

이건 이 레포(프론트엔드)만으로는 확정할 수 없는 부분이다 — 백엔드/인프라 설정 확인이 필요하다.

### 후보 2 (가능성 있음): `expo/fetch`의 스트리밍이 이 환경에서 실제로는 점진적으로 동작하지 않음

Expo 공식 문서(SDK 55, `expo/fetch`)는 `resp.body.getReader()`로 점진적 스트리밍을 지원한다고 명시하지만, 이 레포에서는 **이번이 처음으로 실기기·실서버 대상 검증**이다 (위 "이전 작업에서 남겨진 위험 신호" 참고). 네이티브 구현 디테일(예: 응답을 다 받은 후에야 `Response`를 구성하는 경로가 있는지, 디버거가 붙어있을 때 네트워크 호출이 별도 프로세스를 경유하며 스트리밍이 깨지는지 등)은 SDK 버전/플랫폼에 따라 달라질 수 있다.

### 후보 3 (가능성 낮음, 배제 비용 낮음): 리모트 JS 디버거가 붙어 있어서 네트워크 스트리밍이 깨짐

레거시 RN "Remote JS Debugging"처럼 네트워크 요청이 디버거 프로세스를 경유하는 디버깅 모드가 켜져 있으면 스트리밍이 깨지는 경우가 있었다. 디버거를 끄고 재현되는지 확인해볼 가치가 있다.

### 후보 4 (가능성 낮음): `consumeStream`의 `\n\n` 경계 파싱 버그

`consumeStream`(`useChatSse.ts:191-235`)은 디코딩된 텍스트를 누적하다가 `\n\n` 구분자를 찾았을 때만 블록을 잘라 처리한다. 서버가 이벤트 사이에 정확히 빈 줄(`\n\n`)을 보장하지 않거나, 일부 네트워크 계층에서 줄바꿈이 변형되면 블록 경계를 못 찾고 계속 버퍼링만 하다가 스트림이 끝나는 시점(또는 마지막 청크에 우연히 누적된 `\n\n`이 다수 포함된 시점)에 한꺼번에 처리될 수 있다. SSE 표준 포맷을 따른다면 발생하지 않아야 하므로 가능성은 낮지만, 클라이언트 코드만으로 직접 수정 가능한 유일한 후보라 검증 가치가 있다.

## 추가 관찰 (2026-06-23) — Expo 네트워크 탭 캡처 결과

실기기에서 Expo 네트워크 탭으로 메시지 전송 요청의 Preview/Response를 확인한 결과, `delta` 이벤트가 음절 단위로 매우 잘게 나뉘어 있는 정상적인 SSE 응답이 캡처됐다 (`event:session_meta` → `event:delta` × 다수(글자/음절 단위) → `event:done`). 이를 보고 "청크가 한 글자씩 잘 나뉘어 있으니 스트리밍이 정상"이라는 판단이 있었으나, **이는 서로 다른 두 속성을 혼동한 것**이라 주의가 필요하다:

- **청크 단위(granularity)** — 서버가 응답을 얼마나 잘게 쪼개서 보내는가. 캡처된 응답으로 검증 가능하고, 실제로 정상이다 (서버 쪽은 문제없어 보임).
- **전달 시점(timing)** — 그 청크들이 실제로 시간차를 두고(예: 응답 생성에 걸리는 1~3초에 걸쳐) 도착하는가, 아니면 전부 도착한 뒤 한 번에 캡처되는가. **캡처된 응답 내용만으로는 이걸 증명할 수 없다** — 완료된 요청의 Preview/Response는 도착 타이밍과 무관하게 항상 전체 내용을 보여준다.

오히려 더 의미있는 관찰은 다음 진술이다: "네트워크 탭 상에서 실시간 스트리밍은 보지 못했고... 응답 결과가 한번에 빵 하고 떴다." 이는 네트워크 탭 자체에서도 점진적으로 채워지는 모습이 안 보였다는 뜻으로, **후보 1(서버/프록시 버퍼링) 또는 후보 2(`expo/fetch`가 이 환경에서 점진적 전달을 못 함)에 무게를 더하는 관찰**이다 (후보 4 "클라이언트 파싱 버그"는 이 시나리오와 맞지 않음 — 파싱이 그렇게 깨졌다면 사용자가 본 것처럼 "끝나고 나서 정상적으로 전체 텍스트가 뜨는" 결과 자체가 나올 수 없고, 영영 아무것도 안 뜨거나 깨진 텍스트가 떴을 것).

다만 "네트워크 탭에서 실시간으로 안 보인다"는 것 자체가 도구의 한계일 수도 있다 — Expo 자체 네트워크 탭은 Chrome DevTools의 "EventStream" 탭처럼 SSE를 이벤트 단위로 실시간 표시하는 전용 UI가 없을 가능성이 높고, 대부분의 경량 네트워크 인스펙터는 요청이 완료된 뒤에야 Preview/Response를 한 번에 렌더링한다. 그래서 이것만으로 원인을 확정하기엔 부족하고, 아래의 결정적 검증이 필요하다.

### 결정적 검증: 앱(`expo/fetch`)을 거치지 않고 서버에 직접 curl

PC 터미널에서 실제 `sessionId`/`accessToken`으로 동일 엔드포인트를 직접 호출해서, **앱/RN 네트워킹 스택을 완전히 배제한 채** 서버~네트워크 구간만 따로 확인한다:

```bash
curl -N --no-buffer \
  -X POST "https://mio.io.kr/v1/sessions/{sessionId}/messages" \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"content":"테스트"}'
```

- **터미널에 글자가 실시간으로(응답 생성 시간에 걸쳐 천천히) 출력됨** → 서버/네트워크 구간은 정상. 원인은 클라이언트 쪽(`expo/fetch` 또는 RN 네트워킹 스택이 이 기기/환경에서 점진적으로 못 받음, 후보 2)으로 좁혀짐 → 다음 단계는 `useChatSse.ts`에 타임스탬프 로그를 추가해 `reader.read()`가 진짜로 늦게 resolve되는지 확인.
- **몇 초간 멈췄다가 전체가 한번에 쏟아짐** → 서버/프록시 쪽에서 버퍼링되고 있는 것 (후보 1). 앱 코드로 해결 불가 — `docs/CHAT_BACKEND_QUESTIONS.md`에 문의 추가하고 백엔드/인프라(리버스 프록시 `proxy_buffering`, 응답 압축 설정 등) 확인 필요.

이 curl 테스트가 기기/디버거/앱 코드를 전혀 거치지 않으므로, 아래 "확인 방법(로그 추가)"보다 더 적은 노력으로 더 깨끗하게 클라이언트 문제와 서버/인프라 문제를 가른다. **다음 작업은 이 curl 테스트를 먼저 실행하는 것을 권장.**

## 확인 방법 (원인을 좁히기 위한 로그 추가)

curl 테스트(위)와 별개로, **앱 안에서 실제로 어느 시점에 데이터를 받는지**를 직접 찍어보면 "클라이언트가 늦게 받는지" vs "받고 나서 화면 반영이 늦는지"를 가장 직접적으로 확인할 수 있다. 코드를 고치기 전에 아래 로그를 임시로 추가한다.

### 어디에 무엇을 찍을지 (`useChatSse.ts` 기준 줄 번호)

1. **요청 시작 시각 기록 + 응답 헤더 확인** — `performSendMessage`, fetch 호출 부분 (`:246-258` 근처)

   ```ts
   async function performSendMessage(currentSessionId: string, content: string) {
     const controller = new AbortController();
     abortRef.current = controller;
     let timedOut = false;
     const sendStartedAt = Date.now(); // ★ 추가

     ...

     const res = await fetch(`${API_BASE_URL}/v1/sessions/${currentSessionId}/messages`, { ... });

     // ★ 추가 — 응답 헤더가 도착한 시점(첫 바이트 도착 시각)과 압축/인코딩 여부
     console.log(
       '[sse] response headers at +%dms',
       Date.now() - sendStartedAt,
       'status=', res.status,
       'content-type=', res.headers.get('content-type'),
       'content-encoding=', res.headers.get('content-encoding'),
       'transfer-encoding=', res.headers.get('transfer-encoding')
     );
   ```

   `sendStartedAt`을 `consumeStream` 안에서도 써야 하므로, 함수 인자로 넘기거나 클로저로 캡처해 다음 단계에서 재사용한다.

2. **`reader.read()`가 resolve될 때마다** — `consumeStream` 루프 안, `:196-200` 근처

   ```ts
   while (true) {
     const { done, value } = await reader.read();
     // ★ 추가 — 매 read() 호출이 실제로 언제 resolve됐는지, 몇 바이트를 받았는지
     console.log('[sse] read() at +%dms, done=%s, bytes=%d', Date.now() - sendStartedAt, done, value?.length ?? 0);
     if (done) break;
     ...
   ```

3. **이벤트가 실제로 디스패치될 때마다** — `handleSessionMeta`(`:92`), `handleDelta`(`:107`)

   ```ts
   function handleSessionMeta(data: SseSessionMetaData) {
     console.log('[sse] session_meta dispatched at +%dms', Date.now() - sendStartedAt); // ★ 추가
     ...
   }

   function handleDelta(data: SseDeltaData) {
     console.log('[sse] delta dispatched at +%dms chunk=%s', Date.now() - sendStartedAt, data.chunk); // ★ 추가
     ...
   }
   ```

   `sendStartedAt`을 이 핸들러들에서도 쓰려면 모듈 스코프 변수나 `useRef`로 잠깐 끌어올려두면 된다 (임시 코드라 깔끔하게 짤 필요는 없음).

### 로그를 어디서 보는지

- Expo Go/Dev Client로 실행 중이면, `console.log`는 **`npx expo start`(또는 `npx expo run:android` 등)를 띄운 터미널**에 그대로 출력된다 — 별도 도구 설치 없이 바로 확인 가능.
- 터미널 출력이 안 보이면 Android는 `npx react-native log-android`, iOS는 `npx react-native log-ios` (또는 Xcode 콘솔)로도 동일 로그를 볼 수 있다.
- 메시지를 한 번 보내고 `done` 이벤트까지 한 사이클이 끝나면, `[sse]`로 시작하는 로그들을 시간순으로 모아서 `+Nms` 값들의 간격을 비교한다.

### 결과 해석

- **`read() at +Nms` 로그가 응답 전체 시간(예: 2~3초) 동안 거의 안 찍히다가, 마지막 한두 번에 몰려서 찍힘** (예: `+50ms`, 그다음 바로 `+2980ms`, `+2990ms`, `+3000ms`...) → 클라이언트(JS)가 데이터를 애초에 늦게 받는 것. `response headers` 로그의 `content-encoding`이 `gzip`이면 후보 1(서버/프록시 압축·버퍼링)에 강한 확증, 비어있으면 후보 2(`expo/fetch` 자체가 이 환경에서 점진적으로 못 받음)에 무게가 실림.
- **`read() at +Nms`는 응답 전체에 걸쳐 고르게 찍히는데(예: `+80ms`, `+150ms`, `+230ms`... 식으로 자연스럽게 분산), `session_meta`/`delta dispatched` 로그만 끝에 몰려서 찍힘** → 데이터는 제때 받았는데 파싱/디스패치 단계에서 막히는 것 (후보 4, `consumeStream`/`parseSSELine`의 `\n\n` 경계 탐지 버그) — 이 경우는 위 curl 테스트로 실제 wire 포맷(이벤트 사이 줄바꿈이 정확히 몇 개인지)을 같이 확인해서 파싱 로직을 그 포맷에 맞춘다.
- **`read()`도 `dispatched`도 둘 다 고르게 찍히는데 화면만 안 바뀜** → 이 문서의 다른 후보들과는 다른 종류의 문제(순수 렌더링 이슈)이므로, 이 경우에만 `ChatMain`/`MessageBubble`의 zustand 구독·FlatList 쪽을 별도로 점검한다 (지금까지의 코드 분석상 가능성은 낮다고 판단했던 경로).
- 디버거(Remote JS Debugging 등)를 끄고 동일 테스트를 한 번 더 돌려서 결과가 같으면 후보 3은 배제.

### 정리 시점

이 로그들은 진단용 임시 코드다. 원인이 확정되면 `useChatSse.ts`에서 `★ 추가` 표시한 줄들을 전부 제거하고 실제 수정 커밋에는 포함하지 않는다.

## 해결 방안 (후보별)

- **후보 1 확정 시**: 백엔드/인프라 쪽에 `text/event-stream` 응답의 압축·버퍼링 비활성화를 요청해야 한다. `docs/CHAT_BACKEND_QUESTIONS.md`에 새 항목으로 추가 권장 (예: "SSE 응답에 `Content-Encoding`이 적용되고 있는지, 프록시 `proxy_buffering`이 꺼져 있는지 확인 요청"). 프론트엔드 코드 수정은 불필요.
- **후보 2 확정 시**: `expo/fetch` 대신 POST를 지원하는 SSE 전용 라이브러리(예: `react-native-sse`, `@microsoft/fetch-event-source`의 RN 대응 구현)로 교체하거나, Expo 이슈 트래커에서 동일 증상의 알려진 이슈/우회법을 확인해 적용한다.
- **후보 3 확정 시**: 코드 수정 없음. 개발 시 디버거를 끄고 테스트하도록 안내만 추가.
- **후보 4 확정 시**: `consumeStream`의 블록 경계 탐지 로직을 서버가 실제로 보내는 줄바꿈 포맷에 맞춰 수정 (예: `\n\n` 외에 단일 `\n` 두 번 연속도 허용하거나, 정규식 기반으로 완화).

## 영향 받는 파일

- `src/features/chat/hooks/useChatSse.ts` (검증 로그 추가 위치, 후보 2/4 수정 시 변경 대상)
- 후보 1 확정 시: 이 레포 밖(백엔드/인프라) — `docs/CHAT_BACKEND_QUESTIONS.md`에 문의 추가
