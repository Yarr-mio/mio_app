# 08. "기록 저장하기" 버튼 단순화

> 상태: 완료
> 로그: [logs/08-save-button-simplify.md](../../logs/08-save-button-simplify.md)
> 관련: [CHAT_FRONTEND_TASKS.md §8](../CHAT_FRONTEND_TASKS.md), [GAP_ANALYSIS 3-4](../CHAT_SERVER_GAP_ANALYSIS.md#3-4-기록-저장하기-버튼에-대응하는-api가-없다)

## 목표

대응하는 백엔드 API가 없는 "저장" mutation을 제거하고 버튼을 단순 네비게이션으로 바꾼다.

## 배경

`POST /v1/sessions/{id}/end`가 성공하면 서버가 트랜잭션 커밋 후 자동으로 `SessionConsolidator`를 실행해 요약·추출·신념 갱신·Todo 생성까지 전부 처리한다. 즉 "저장"은 이미 끝난 일이라 별도로 보낼 요청이 없는데, `useSaveChatSession`은 아무 일도 안 하는 빈 함수를 mutation으로 감싸놓고 있다.

## 변경 대상 파일

- `src/features/chat/hooks/useChat.ts`
- "기록 저장하기" 버튼을 사용하는 화면 (`SessionSummary.tsx` 등)

## 구현 체크리스트

- [ ] `useSaveChatSession` 제거
- [ ] 버튼 핸들러를 `router.push('/(main)/chat/end')` 단순 네비게이션으로 교체
- [ ] 기존에 mutation 로딩 상태로 비활성화하던 버튼 로직이 있다면 제거

## 커밋 메시지

```
refactor: 기록 저장하기 버튼을 단순 네비게이션으로 변경

- 대응 백엔드 API가 없는 useSaveChatSession mutation 제거
- 버튼 핸들러를 라우터 이동으로 단순화

related to: #21
```
