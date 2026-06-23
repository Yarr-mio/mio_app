# 04. `emotion_score` optional 처리

> 상태: 미착수
> 로그: [logs/04-emotion-score-optional.md](../../logs/04-emotion-score-optional.md)
> 관련: [CHAT_FRONTEND_TASKS.md §4](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 1-2](../CHAT_SERVER_GAP_ANALYSIS.md#1-2-emotion_score-undefined-체크-누락)

## 목표

`done.emotion_score`가 필드 자체 생략(`undefined`)될 수 있다는 서버 스펙에 맞게 타입과 체크 로직을 고친다.

## 배경

서버 스펙상 `emotion_score?: number`는 선택 필드라 생략 시 키 자체가 없다. 현재 타입은 `number | null`로 가정하고 `data.emotion_score !== null` 체크를 쓰는데, `undefined !== null`은 `true`라 의도와 반대로 통과해버려 `activateEmotionScoring(undefined)`가 호출된다.

## 변경 대상 파일

- `src/types/chat.ts`
- `src/features/chat/hooks/useChatSse.ts`

## 구현 체크리스트

- [ ] `types/chat.ts`: `DoneData.emotion_score`를 `number | null`에서 `emotion_score?: number`로 변경
- [ ] `useChatSse.ts`: 체크를 `typeof data.emotion_score === 'number'`로 변경
- [ ] `emotion_score`가 없는 `done` 이벤트 mock 시나리오로 회귀 확인 (슬라이더가 안 뜨는지)

## 커밋 메시지

```
fix: emotion_score 누락 케이스 처리

- emotion_score를 optional 타입으로 변경
- undefined 체크 로직 수정 (typeof 검사로 변경)

related to: #21
```
