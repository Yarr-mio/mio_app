# 09. EmotionScorePanel 제출 동작 임시 단순화

> 상태: 완료
> 로그: [logs/09-emotion-score-panel-temp.md](../../logs/09-emotion-score-panel-temp.md)
> 관련: [CHAT_FRONTEND_TASKS.md §9](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 3-2](../CHAT_SERVER_GAP_ANALYSIS.md#3-2-감정-점수-제출-엔드포인트는-존재하지-않는다)
> 백엔드 요청 중: [CHAT_BACKEND_QUESTIONS §6](../CHAT_BACKEND_QUESTIONS.md#6-감정-점수-제출-엔드포인트-신규-요청)
> 결정 사항: 점수는 버리고 패널만 닫음 (mock 트리거 제거). 패널은 자동으로 사라지지 않고 "완료" 버튼 탭으로만 닫힘 (2026-06-23 확정, 기존 동작과 동일)

## 목표

백엔드 제출 엔드포인트가 생기기 전까지, 사용자가 조정한 점수를 제출하는 것처럼 보이지만 실제로는 버려지는 현재 동작을 정직하게 정리한다.

## 배경

`emotion_score`는 서버→클라이언트 단방향 신호이고 제출 API가 없다. 현재 `confirmEmotionScore()`는 점수를 버리면서 후속 mock 응답을 한 번 더 트리거해 마치 제출이 처리된 것처럼 보이게 한다. 이번엔 mock 트리거 없이 패널만 닫는 것으로 단순화한다.

## 변경 대상 파일

- `src/features/chat/hooks/useChatSse.ts`

## 구현 체크리스트

- [ ] `confirmEmotionScore()`에서 후속 mock 트리거(소크라테스 답변용 follow-up 응답) 제거
- [ ] `deactivateEmotionScoring()`만 호출하도록 단순화
- [ ] `// TODO: 백엔드 emotion-score 제출 엔드포인트 추가되면 연동` 주석 추가
- [ ] 소크라테스 질문 답변 흐름이 패널만 닫혔을 때 자연스럽게 이어지는지(다음 메시지 입력으로 넘어가는지) 확인

## 커밋 메시지

```
fix: EmotionScorePanel 제출 동작을 임시로 단순화

- 백엔드 제출 API 부재로 점수를 버리고 패널만 닫도록 변경
- 후속 mock 응답 트리거 제거, TODO 주석 추가

related to: #21
```
