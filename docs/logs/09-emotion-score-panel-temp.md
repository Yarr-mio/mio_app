# 09. EmotionScorePanel 제출 동작 임시 단순화 — 작업 로그

> 연결된 작업 문서: [chat-impl/09-emotion-score-panel-temp.md](../chat-impl/09-emotion-score-panel-temp.md)
> 이 파일은 실제 구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

- `confirmEmotionScore()`에서 후속 mock 응답 트리거(소크라테스 답변용 follow-up) 제거 — `deactivateEmotionScoring()`만 호출.
- `awaitingSocraticScoreRef`가 더 이상 읽히는 곳이 없어(쓰기만 하던 죽은 상태) 함께 제거. `sendMessage`의 소크라테스 분기는 `activateEmotionScoring(50)` 호출만 남음.
- 패널이 닫힌 뒤 흐름 확인: 소크라테스 분기에서는 `setIsStreaming(true)`를 호출하지 않으므로 `isStreaming`이 계속 `false`로 유지됨 → 패널이 닫히면 `ChatMain`이 `ChatInputBar`를 `disabled=false`로 바로 보여줘서 다음 메시지 입력으로 자연스럽게 이어짐 (코드 경로로 확인, 백엔드가 없어 실기기 동작 확인은 보류).
