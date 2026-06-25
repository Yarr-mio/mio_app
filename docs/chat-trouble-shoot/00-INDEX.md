# 채팅 기능 트러블슈팅 — 실기기 테스트 중 발견된 문제

> 11번 작업([chat-impl/11-real-sse-integration.md](../chat-impl/11-real-sse-integration.md))에서 실기기/실서버 수동 테스트가 보류된 채 완료 처리됐고, 이후 실제로 테스트하면서 발견된 문제들을 정리한다.
> 작업 문서(`chat-impl/0N-*.md`)와 역할을 분리: 여기는 **문제 증상 → 원인 분석 → 해결 방안**만 다루고, 실제 수정은 별도 커밋(필요 시 새 `chat-impl` 작업 문서)으로 진행한다.
> ⚠️ 03번은 채팅 전용 문제가 아니라 **앱 전역(로그인/프로필 복원)** 문제다 — 채팅 캐릭터 고정 증상을 조사하다 더 근본적인 원인으로 발견되어 같은 폴더에 기록함.

## 목록

| #   | 문제                                                                                                        | 문서                                                                                                                                                                                   | 영향 범위                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 채팅 AI 캐릭터가 항상 "미오"로 고정됨 (세션 생성 요청에도 잘못된 `character_id` 전송)                       | [01-character-id-not-synced.md](./01-character-id-not-synced.md)                                                                                                                       | 프론트 코드 수정 완료, 실기기 검증 대기                                                                                                    |
| 2   | SSE 응답이 한 글자씩 도착하는데도 화면엔 완료 후 한번에 표시됨                                              | [02-sse-streaming-not-incremental.md](./02-sse-streaming-not-incremental.md) (원인 확정, 실측 근거: [02-findings-sse-frontend-delivery.md](./02-findings-sse-frontend-delivery.md))    | 원인 확정 — 서버/프록시(nginx) 버퍼링, 백엔드/인프라 조치 필요                                                                             |
| 4   | 모든 AI 응답마다 감정 슬라이더가 뜸 (socratic 여부와 무관하게 트리거됨)                                     | [05-cbt-completion-emotion-slider-plan.md](./05-cbt-completion-emotion-slider-plan.md) (이전 계획: [04-socratic-emotion-slider-plan.md](./04-socratic-emotion-slider-plan.md), 대체됨) | 백엔드 CBT 상태머신 수정 완료([04-cbt-emotion-score-redesign.md](./04-cbt-emotion-score-redesign.md)), 프론트 연동 계획 수립됨 — 구현 대기 |
| 5   | 세션 종료 후 요약→결과→홈 전환 구간에서 뒤로가기 시 빈 화면 / 결과 화면에서 홈 후 채팅 재진입 시 빈 화면    | [06-session-end-flow-back-navigation.md](./06-session-end-flow-back-navigation.md)                                                                                                     | 프론트 코드 수정 완료, 실기기 검증 대기                                                                                                    |
| 6   | 요약 화면 로딩 중 reload 후 채팅 탭 재진입 시 배경도 없는 검은 화면                                         | [07-chat-summary-black-screen-after-reload.md](./07-chat-summary-black-screen-after-reload.md)                                                                                         | 프론트 코드 수정 완료, 실기기 검증 대기 (상위 트리거 경로는 여전히 가설 단계)                                                              |
| 7   | 결과 화면에서 "홈으로 돌아가기" 이후 채팅 탭이 mio 고정 화면에 고착되어 새 대화 시작 불가                   | [08-session-end-home-navigation-bugs.md](./08-session-end-home-navigation-bugs.md)                                                                                                     | mio 고정 증상은 실기기에서 해소 확인됨. 잔여 증상(화면 고착 자체)은 09번으로 이어짐                                                        |
| 8   | (7번 수정 후에도 잔존) "홈으로 돌아가기" 후 채팅 탭 재진입 시 결과 화면이 그대로 남아있어 새 대화 시작 불가 | [09-dismissall-blocked-by-prevent-remove.md](./09-dismissall-blocked-by-prevent-remove.md)                                                                                             | 프론트 코드 수정 완료(`usePreventRemove` → 액션 타입 기반 `beforeRemove` 리스너로 교체), 실기기 검증 대기                                  |

## 공통 배경

- 이 레포에는 백엔드 소스가 없다 (`docs/CHAT_BACKEND_QUESTIONS.md` 참고). 서버 쪽이 원인일 가능성이 있는 항목은 "확인 방법"까지만 제시하고, 실제 서버/인프라 수정은 백엔드 협의가 필요하다.
- 1·2번은 `USE_MOCK=true`에서는 재현되지 않거나 다르게 동작한다 (mock은 단순 echo/setTimeout 기반이라 실제 서버의 동작 차이를 가리고 있었음). 확인·재현은 `EXPO_PUBLIC_USE_MOCK=false` + 실서버(`https://mio.io.kr`) 환경에서 해야 한다.
- 3번은 mock 여부와 무관하게 항상 재현된다 — 애초에 호출하는 코드가 없는 것이라 mock 분기 자체가 존재하지 않는다.
