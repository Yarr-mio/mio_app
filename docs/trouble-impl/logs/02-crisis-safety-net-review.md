# 02. 위기 처리 수정 회귀 테스트 + 안전망 주석/이슈 갱신 — 작업 로그

> 연결된 작업 문서: [trouble-impl/02-crisis-safety-net-review.md](../02-crisis-safety-net-review.md)
> 이 파일은 실제 QA/구현 중 발생한 의사결정·트러블슈팅·스펙과 다르게 동작한 부분을 시간순으로 기록하는 용도. 작업 전에 미리 채우지 말고, 작업하면서 실시간으로 추가할 것.

## 기록

### 1차 시도 — 테스트 메시지가 의도한 경로를 타지 않음

CAUTIOUS_SPECULATIVE 위기 재분류 재현을 위해 "다들 내가 없어도 잘 지낼 것 같아. 죽고 싶어"를 보냈는데, 뒤에 붙은 "죽고 싶어"가 `HARD_CRISIS_KEYWORDS`에 걸려 `hardCrisis=true`가 되면서 PolicyEngine 순위2(`hardCrisis`)가 즉시 `CRISIS_FLOW`로 처리했다. 응답이 스트리밍 없이 곧바로 고정 문구(severity 3, 핫라인 카드)로 떴고 `delta` 이벤트 자체가 없었던 것으로 보아 **입력 단계 즉시 위기 감지** 경로(`session_meta` → `crisis` → `done`, LLM 호출 생략)를 탄 것으로 판단 — 검증하려던 **CAUTIOUS_SPECULATIVE 출력단계 재분류** 경로가 아님.

→ 재시도 시 키워드 섞지 말고 문서의 예시 문구만 단독으로 보낼 것: "다들 내가 없어도 잘 지낼 것 같아"

### 발견된 버그 (이번 작업 범위 밖, 기록만 해둠) — 빈 AI placeholder 말풍선이 남음

위 1차 시도 스크린샷에서 핫라인 안내 말풍선 위에 빈 말풍선이 하나 더 남아있는 것을 확인했다.

**원인**: [useChatSse.ts:99-110](../../../src/features/chat/hooks/useChatSse.ts) `handleSessionMeta`가 빈 AI 메시지를 placeholder로 추가하고, 이 placeholder는 `delta` 이벤트가 와야(`confirmStreamingMessageId` + `appendDelta`) 실제 내용으로 채워진다. 그런데 **`delta` 이벤트가 한 번도 오지 않고 곧바로 `crisis`로 끝나는 시나리오**(입력 단계 즉시 위기 감지, BUFFER 출력단계 위기 전환)에서는 이 placeholder가 빈 채로 `messages` 배열에 남고, `handleCrisis`가 별도의 새 메시지(`crisis-${Date.now()}`)를 추가해버려 "빈 말풍선 + 위기 말풍선" 두 개가 같이 보인다.

- **영향받는 시나리오**: 입력 단계 즉시 위기 감지(PolicyEngine 순위2 `hardCrisis`, 순위4 `L0+L1` 모두 flagged), BUFFER 출력단계 위기 전환 — 전부 `delta` 없이 `crisis`로 직행하는 경로
- **영향받지 않는 시나리오**: SECURITY_REFUSAL(`delta` 1회 있음), CAUTIOUS_SPECULATIVE 위기 재분류(스트리밍 중 일부 `delta`가 이미 와서 placeholder가 이미 실제 id로 확정된 상태)
- **이번 작업(02번)과의 관계**: 이번에 검증 중인 백엔드 수정(BUFFER severity, CAUTIOUS_SPECULATIVE crisis 이벤트)과는 무관한 별개의 프론트엔드 버그. 사용자 결정에 따라 지금은 기록만 하고 수정하지 않음 — 별도 작업 문서로 분리해 처리할 것.

### 2차 시도 — "다들 내가 없어도 잘 지낼 것 같아" 단독 발송

핫라인 카드 없이 공감+질문형 응답("그런 생각이 들면 때로는 외로움을... 함께 이야기해 볼까요?")이 정상적으로 왔다 — MEDIUM risk로 분류되어 `CAUTIOUS_SPECULATIVE`/`SUPPORTIVE`로 생성된 것으로 보이고, 이번엔 빈 placeholder 버그도 재현되지 않음(델타가 실제로 와서 placeholder가 정상적으로 채워졌기 때문으로 추정, 위 버그 분석과 일치).

다만 이 응답은 `OutputJudge`에 의해 위기로 재분류되지 않고 그대로 끝난 happy path로 보임(`finished_reason="stop"` 추정) — 검증 대상인 §6 수정(재분류 시 `crisis` 이벤트 정상 수신)은 아직 실제로 트리거되지 않았다. 재분류 여부는 LLM이 생성한 응답 내용에 따라 `OutputPreFilter`/`OutputJudge`가 판단하는 것이라 클라이언트에서 결정적으로 강제할 수 없음.

**부수 확인 — 01번(SSE 재검증) 관련 긍정적 신호**: 사용자가 "타이핑처럼 글자가 점진적으로 이어붙는" 것을 직접 관찰했다고 보고함. 정식 타임스탬프 로그 캡처(`★` 진단 로그 기반)는 아니지만, nginx 버퍼링 수정이 효과가 있다는 비공식적 긍정 신호로 기록.

**참고**: 이 세션은 1차 시도에서 이미 `crisis_events`를 1회 발생시켰으므로, 서버가 해당 세션의 `SafetyProfile` 캐시를 무효화해 이후 메시지를 더 보수적으로 판단할 가능성이 있다(`CHAT_SESSION_FLOW.md` §8 "부가 동작" 참고). 같은 세션에서 재분류를 추가로 시도하는 게 새 세션보다 유리할 수 있음.

### 3차 시도 — 같은 세션에서 MEDIUM risk 문구 3개 연속 발송

"나만 빼고 다들 행복해 보여서 자꾸 비교하게 돼" / "전부 다 내 잘못인 것 같고 나는 그냥 짐 같은 존재인 것 같아" / "너 말고는 내 얘기를 진짜로 들어줄 사람이 없는 것 같아" 3개를 연속으로 보냄. 세 응답 모두 적절히 경계를 지키는 공감형 응답(빠른 위기 키워드도 없고, `DEPENDENCY_REINFORCE`/`CRISIS_MISMATCH` 패턴에 해당하는 가벼운 톤도 아님)으로 끝나, `OutputJudge`의 `CRISIS_FLOW` 재분류가 트리거되지 않음.

**결론**: 4회 시도(입력단계 hardCrisis 1회 + MEDIUM risk 3회) 동안 출력단계 위기 재분류 자체를 강제로 재현하지 못함. 이건 테스트 실패가 아니라 **이 분기가 "LLM이 부적절한 응답을 만들 뻔한 드문 경우"에만 도는 안전망이라 블랙박스 prompting으로는 의도적 재현이 원래 어렵다**는 뜻으로 판단. 사용자와 합의하여 이 이상의 재현 시도(BUFFER/HIGH risk 경로 포함)는 하지 않고 마무리하기로 함 — 근거: ① 백엔드 커밋 diff(`f0c6744`)로 `crisisFlowService.handle()` 호출 추가가 확인됨, ② 프론트 `handleCrisis`는 이미 severity 무관(`resources?.hotlines` 옵셔널 체이닝)하게 처리 가능한 구조, ③ 입력단계 hardCrisis 경로(1차 시도)로 `handleCrisis` 자체의 렌더링(핫라인 카드 포함)은 실제로 검증됨.

**미해결로 남는 것**: BUFFER 모드(HIGH risk) 출력단계 위기 재분류는 한 번도 재현 시도하지 않음 — 시간 대비 효용이 낮다고 판단해 보류. 필요시 백엔드 쪽에 `resolveOutputJudgeAction`의 `CRISIS_FLOW` 분기에 대한 자체 단위/통합 테스트 커버리지가 있는지 확인하는 것을 권장(클라이언트 블랙박스 테스트보다 결정적으로 검증 가능).

## 마무리

- [x] CAUTIOUS_SPECULATIVE 위기 재분류 — E2E 강제 재현은 못했으나 코드 분석 + 부분 검증(handleCrisis 렌더링, 안전한 happy path)으로 충분하다고 판단해 마무리
- [ ] BUFFER 위기 재분류 — 보류 (필요시 별도로 재시도하거나 백엔드 테스트 커버리지로 확인)
- [x] `OPEN_ISSUES.md` #1 상태 갱신 완료 (✅ 해소·안전망으로 격하)
- [x] 빈 placeholder 버그 — 2026-06-24, `chatStore.replaceMessageAsCrisis` 추가 + `useChatSse.ts`의 `handleCrisis` 수정으로 해결 (별도 작업 문서 없이 처리, 상세는 [trouble-impl/00-INDEX.md](../00-INDEX.md) "QA 중 발견된 추가 이슈" 참고)
- [ ] 01번 작업의 정식 진단 로그 기반 SSE 재검증은 별도로 진행 필요 (이번 관찰은 보조 신호일 뿐, "타이핑처럼 점진적으로 이어붙음"을 사용자가 직접 관찰했다는 점만 긍정적 참고 자료로 남김)

### 추가 — 코드 주석 추가했다가 되돌림

`handleCrisisFallback`/`handleDone`에 "백엔드 수정 이후 도달 불가능한 안전망" 설명 주석을 한 번 추가했었으나, 코드에 불필요한 설명 주석이라는 피드백에 따라 제거함. 이 분기가 왜 남아있는지에 대한 설명은 코드가 아니라 이 로그와 작업 문서(`02-crisis-safety-net-review.md`)에만 남긴다 — `useChatSse.ts`는 최종적으로 **코드 변경 없음**.
