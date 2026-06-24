# 채팅 기능 트러블슈팅 — 실기기 테스트 중 발견된 문제

> 11번 작업([chat-impl/11-real-sse-integration.md](../chat-impl/11-real-sse-integration.md))에서 실기기/실서버 수동 테스트가 보류된 채 완료 처리됐고, 이후 실제로 테스트하면서 발견된 문제들을 정리한다.
> 작업 문서(`chat-impl/0N-*.md`)와 역할을 분리: 여기는 **문제 증상 → 원인 분석 → 해결 방안**만 다루고, 실제 수정은 별도 커밋(필요 시 새 `chat-impl` 작업 문서)으로 진행한다.
> ⚠️ 03번은 채팅 전용 문제가 아니라 **앱 전역(로그인/프로필 복원)** 문제다 — 채팅 캐릭터 고정 증상을 조사하다 더 근본적인 원인으로 발견되어 같은 폴더에 기록함.

## 목록

| #   | 문제 | 문서 | 영향 범위 |
| --- | ---- | ---- | --------- |

| 2 | SSE 응답이 한 글자씩 도착하는데도 화면엔 완료 후 한번에 표시됨 | [02-sse-streaming-not-incremental.md](./02-sse-streaming-not-incremental.md) (원인 확정, 실측 근거: [02-findings-sse-frontend-delivery.md](./02-findings-sse-frontend-delivery.md)) | 원인 확정 — 서버/프록시(nginx) 버퍼링, 백엔드/인프라 조치 필요 |
| 4 | 모든 AI 응답마다 감정 슬라이더가 뜸 (socratic 여부와 무관하게 트리거됨) | [04-socratic-emotion-slider-plan.md](./04-socratic-emotion-slider-plan.md) | 원인 확정 — 백엔드 `is_socratic` 판정 로직 수정 대기, 수정 후 프론트 연동 필요 |

## 공통 배경

- 이 레포에는 백엔드 소스가 없다 (`docs/CHAT_BACKEND_QUESTIONS.md` 참고). 서버 쪽이 원인일 가능성이 있는 항목은 "확인 방법"까지만 제시하고, 실제 서버/인프라 수정은 백엔드 협의가 필요하다.
- 1·2번은 `USE_MOCK=true`에서는 재현되지 않거나 다르게 동작한다 (mock은 단순 echo/setTimeout 기반이라 실제 서버의 동작 차이를 가리고 있었음). 확인·재현은 `EXPO_PUBLIC_USE_MOCK=false` + 실서버(`https://mio.io.kr`) 환경에서 해야 한다.
- 3번은 mock 여부와 무관하게 항상 재현된다 — 애초에 호출하는 코드가 없는 것이라 mock 분기 자체가 존재하지 않는다.
