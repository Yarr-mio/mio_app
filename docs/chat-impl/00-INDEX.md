# 채팅 API 연동 — 구현 계획 (issue #21)

> 출처: [CHAT_FRONTEND_TASKS.md](../CHAT_FRONTEND_TASKS.md) (백엔드 협의 없이 진행 가능한 작업만 추린 목록)
> 백엔드 답변이 필요한 항목: [CHAT_BACKEND_QUESTIONS.md](../CHAT_BACKEND_QUESTIONS.md)
> 각 작업은 **커밋 1개 단위**로 나눠져 있다. 작업 중 발생한 트러블슈팅/결정/특이사항은 작업 문서가 아니라 **연결된 로그 파일에 기록**할 것 — 작업 문서는 계획, 로그는 실제 진행 기록으로 역할을 분리한다.

## 작업 순서

| #   | 작업                                          | 커밋 타입 | 작업 문서                                                                  | 로그                                              | 상태 |
| --- | --------------------------------------------- | --------- | -------------------------------------------------------------------------- | ------------------------------------------------- | ---- |
| 1   | 메시지 ID 체계 재설계 (inbound/outbound 분리) | fix       | [01-message-id-refactor.md](./01-message-id-refactor.md)                   | [log](../logs/01-message-id-refactor.md)          | ✅   |
| 2   | `delta.replace` 이벤트 핸들러 추가            | feature   | [02-delta-replace-handler.md](./02-delta-replace-handler.md)               | [log](../logs/02-delta-replace-handler.md)        | ✅   |
| 3   | 위기(crisis) 처리 보강 + 세션 자동종료 제거   | fix       | [03-crisis-handling-fixes.md](./03-crisis-handling-fixes.md)               | [log](../logs/03-crisis-handling-fixes.md)        | ✅   |
| 4   | `emotion_score` optional 처리                 | fix       | [04-emotion-score-optional.md](./04-emotion-score-optional.md)             | [log](../logs/04-emotion-score-optional.md)       | ⬜   |
| 5   | `GET /sessions/active` 응답 모델 교체         | fix       | [05-active-session-response.md](./05-active-session-response.md)           | [log](../logs/05-active-session-response.md)      | ⬜   |
| 6   | `summary_status` viewed/failed 케이스 처리    | fix       | [06-summary-status-handling.md](./06-summary-status-handling.md)           | [log](../logs/06-summary-status-handling.md)      | ⬜   |
| 7   | 세션 요약 화면 재구성                         | feature   | [07-session-summary-redesign.md](./07-session-summary-redesign.md)         | [log](../logs/07-session-summary-redesign.md)     | ⬜   |
| 8   | "기록 저장하기" 버튼 단순화                   | refactor  | [08-save-button-simplify.md](./08-save-button-simplify.md)                 | [log](../logs/08-save-button-simplify.md)         | ⬜   |
| 9   | EmotionScorePanel 제출 동작 임시 단순화       | fix       | [09-emotion-score-panel-temp.md](./09-emotion-score-panel-temp.md)         | [log](../logs/09-emotion-score-panel-temp.md)     | ⬜   |
| 10  | 세션 시작 실패 에러 코드별 분기 처리          | feature   | [10-session-start-error-handling.md](./10-session-start-error-handling.md) | [log](../logs/10-session-start-error-handling.md) | ⬜   |
| 11  | 채팅 SSE 실제 서버 연동 (mock 제거)           | feature   | [11-real-sse-integration.md](./11-real-sse-integration.md)                 | [log](../logs/11-real-sse-integration.md)         | ⬜   |

상태 표기: ⬜ 미착수 · 🟨 진행중 · ✅ 완료. 작업을 시작/완료할 때 이 표와 해당 작업 문서 상단의 상태를 함께 갱신할 것.

## 이번 범위에서 제외된 것

- "오늘의 적절 행동"(Todo) 연동 — 별도 작업으로 분리 ([GAP_ANALYSIS 3-5](../CHAT_SERVER_GAP_ANALYSIS.md#3-5-오늘의-적절행동은-summary-응답이-아니라-todo-도메인))
- `ChatHeader`의 socratic 테스트용 임시 버튼 — 백엔드 필드 추가 전까지 유지
- 감정 점수 실제 제출(PATCH), socratic 식별, 세션 요약 구조화 필드, CAUTIOUS_SPECULATIVE `crisis` 이벤트 백엔드 수정 — [CHAT_BACKEND_QUESTIONS.md](../CHAT_BACKEND_QUESTIONS.md) 답변 대기 중

## 테스트 환경

- 실제 서버 동작 확인용 주소: `https://mio.io.kr` (로컬 `.env`의 `EXPO_PUBLIC_API_BASE_URL`을 여기로, `EXPO_PUBLIC_USE_MOCK=false`로 설정해 테스트). 자세한 내용은 [11-real-sse-integration.md](./11-real-sse-integration.md) 참고

## 결정 사항 (2026-06-23)

- 세션 재진입: 못 본 요약이 있으면 자동으로 요약 화면으로 리다이렉트 ([05번](./05-active-session-response.md))
- 세션 요약 화면에 `bias_types_detected`/`cbt_intervened`를 새 카드로 노출 ([07번](./07-session-summary-redesign.md))

## 미결 이슈

구현 중 결정이 필요하지만 보류된 항목은 전부 [OPEN_ISSUES.md](./OPEN_ISSUES.md)에 모아둔다 (현재 5건: 위기 fallback 핫라인 번호, `summary_status` viewed 전환 시점, `bias_types_detected` 포맷, 위기 후 안내 배너, 메시지 전송 실패 시 재전송 버튼). 각 항목은 안전한 임시 처리와 함께 해당 작업에 반영돼 있어 구현을 막지는 않는다.
