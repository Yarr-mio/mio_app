# 02 부록. 프론트엔드 기준 SSE 응답이 실제로 도착하는 방식 (실기기 로그 캡처 결과)

> 상위 문서: [02-sse-streaming-not-incremental.md](./02-sse-streaming-not-incremental.md)
> 이 문서는 그 문서의 "확인 방법(로그 추가)" 절차를 실기기에서 두 차례 실행해 얻은 **실측 결과와 결론**만 따로 정리한 것. 후보 분석 과정은 상위 문서 참고.
> 결론: **원인 확정됨 — 프론트엔드 코드 문제 아님.** 서버~클라이언트 사이 어딘가(가장 유력하게는 nginx 리버스 프록시)에서 SSE 응답 전체가 버퍼링된 뒤 한 번에 전달되고 있다.

## 1. 프론트엔드가 받는 경로

```
Spring SseEmitter (chunked, 토큰 단위 flush로 추정)
        │
        ▼
nginx 리버스 프록시  ← Server: nginx/1.30.2 헤더로 존재 확정 (curl 직접 프로브)
        │
        ▼
expo/fetch (Response.body.getReader())
        │
        ▼
consumeStream()  ← src/features/chat/hooks/useChatSse.ts:201
  - reader.read()로 raw 바이트(Uint8Array) 수신
  - 디코딩 후 버퍼에 누적, "\n\n" 경계로 이벤트 블록 분리
  - 블록마다 handleSessionMeta / handleDelta / handleDone 등 디스패치
        │
        ▼
zustand chatStore → ChatMain / MessageBubble 리렌더
```

프론트엔드가 직접 관찰할 수 있는 지점은 **"expo/fetch 이후"** 뿐이다. `reader.read()`가 정확히 언제, 몇 바이트씩 resolve되는지가 "스트리밍이 실제로 점진적인가"를 가르는 유일한 증거다.

## 2. 측정 방법

`useChatSse.ts`에 임시 로그 4종 추가 (★ 표시, 진단 종료 후 제거 예정):

1. 응답 헤더 도착 시점 + `content-encoding`/`transfer-encoding`
2. 매 `reader.read()` resolve 시점 (청크 인덱스, 경과시간, bytes)
3. `session_meta` 디스패치 시점
4. `delta` 디스패치 시점 (청크 내용 포함)

모두 요청 시작 시각(`sendStartedAtRef`) 기준 경과시간(`+Nms`)으로 통일.

## 3. 실측 결과

### 캡처 1

| 시점                       | 경과시간          | 내용                                                                                                                  |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| 응답 헤더 도착             | +2037ms           | status=200, content-type=`text/event-stream;charset=UTF-8`, content-encoding=`null`, **transfer-encoding=`Identity`** |
| `read()` #1                | +2054ms           | done=false, **bytes=2197**                                                                                            |
| `session_meta` 디스패치    | +2060ms           |                                                                                                                       |
| `delta` 디스패치 (약 30개) | +2061ms ~ +2071ms | 10ms 안에 전부 끝남                                                                                                   |
| `read()` #2                | +2122ms           | done=true, bytes=0                                                                                                    |

### 캡처 2 (재현, 청크 인덱스 추가 후)

| 시점                       | 경과시간          | 내용                                                                                                                  |
| -------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| 응답 헤더 도착             | +2771ms           | status=200, content-type=`text/event-stream;charset=UTF-8`, content-encoding=`null`, **transfer-encoding=`Identity`** |
| chunk #0                   | +2788ms           | done=false, **bytes=1929**                                                                                            |
| `session_meta` 디스패치    | +2793ms           |                                                                                                                       |
| `delta` 디스패치 (약 28개) | +2794ms ~ +2802ms | 9ms 안에 전부 끝남                                                                                                    |
| chunk #1                   | +2856ms           | done=true, bytes=0                                                                                                    |

두 캡처가 패턴이 동일하다 (재현성 확인됨).

## 4. 해석 — "프론트 입장에서 SSE가 어떻게 도착하는가"

- **`reader.read()`는 요청당 정확히 2번만 호출(resolve)된다.** 첫 번째 호출에 `session_meta`부터 `done`까지 전체 이벤트 시퀀스가 **이미 다 합쳐진 채로** 들어있고, 두 번째 호출은 스트림 종료 신호(빈 바이트)일 뿐이다.
- 즉 **JS 코드가 받는 시점에는 이미 "스트리밍"이 아니라 "하나의 완성된 응답"**이다. `consumeStream`의 `\n\n` 분리 로직은 이 하나의 청크를 받은 즉시 30개 가까운 이벤트로 올바르게 쪼개고 10ms 안에 전부 처리한다 — 파싱 로직 자체는 정상이고 빠르다.
- 첫 바이트가 도착하기까지 걸린 시간(+2037ms / +2771ms)이 LLM이 전체 응답을 생성하는 데 걸리는 시간과 거의 일치한다. **"응답을 다 만든 뒤에 한 번에 보낸다"는 그림과 정확히 부합.**
- 가장 결정적인 단서는 **`transfer-encoding: Identity`**다. 토큰 단위로 진짜 스트리밍한다면 서버는 전체 길이를 미리 알 수 없으므로 HTTP/1.1 `chunked` 인코딩으로 보내야 정상이다. 클라이언트에 `chunked`가 아니라 `Identity`(=길이가 고정된 단일 응답)로 도착했다는 건, **중간의 누군가가 백엔드의 chunked 응답을 끝까지 모은 뒤, 전체 길이를 알게 된 상태로 다시 포장해서 보냈다는 뜻**이다. 이전에 별도로 확인한 `Server: nginx/1.30.2` 헤더와 합쳐보면, nginx의 `proxy_buffering on`(기본값) 동작과 정확히 일치한다.

## 5. 대조 — 정상적으로 스트리밍됐다면 어떻게 보였어야 하는가

| 항목                | 정상 스트리밍이라면                                           | 실제 관찰                                                    |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `read()` 호출 횟수  | 이벤트/토큰 수만큼 여러 번, 응답 생성 시간(2~3초)에 걸쳐 분산 | **2번뿐**                                                    |
| 각 `read()` 시점    | `+50ms`, `+300ms`, `+700ms`... 식으로 고르게 분산             | `+2054ms` 한 번에 몰림                                       |
| `transfer-encoding` | `chunked`                                                     | `Identity`                                                   |
| 화면 동작           | 글자가 시간차를 두고 이어 붙음                                | 타이핑 인디케이터가 끝까지 돌다가 전체 텍스트가 한 번에 표시 |

## 6. 결론

- **프론트엔드 코드(`useChatSse.ts`)는 원인이 아니다.** 받은 데이터를 즉시, 정확하게 처리한다.
- **원인은 서버~클라이언트 사이의 버퍼링이다.** 가장 유력한 지점은 nginx 리버스 프록시 (`proxy_buffering`). 프론트 코드 수정으로는 해결할 수 없다.
- 다음 단계: `docs/CHAT_BACKEND_QUESTIONS.md`에 인프라 문의 추가 (`proxy_buffering off` + `X-Accel-Buffering: no` + `text/event-stream`을 `gzip_types`에서 제외 요청), 백엔드/인프라 확인 후 재검증.
- 원인 확정에 사용한 임시 로그(`useChatSse.ts`의 `★` 표시)는 정리 대상이며 실제 수정 커밋에는 포함하지 않는다.
