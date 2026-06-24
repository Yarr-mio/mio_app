# 채팅 구현 — 미결 이슈

> 구현 전/중에 결정이 필요하지만 보류된 항목을 모아둔 문서. 결정되면 해당 작업 문서(`chat-impl/0N-*.md`)에 반영하고 여기서 상태를 ✅로 닫을 것.

## 목록

| #   | 이슈                                                                      | 영향 작업                              | 상태                     |
| --- | ------------------------------------------------------------------------- | -------------------------------------- | ------------------------ |
| 1   | 위기 fallback 안내에 핫라인 번호(109/1577-0199) 포함 여부                 | [03](./03-crisis-handling-fixes.md)    | ✅ 해소(안전망으로 격하) |
| 2   | `summary_status` done→viewed 전환 시점 불명 (재진입 무한 리다이렉트 위험) | [05](./05-active-session-response.md)  | 🟡 보류                  |
| 3   | `bias_types_detected` 포맷(구분자)·null일 때 표시 방식                    | [07](./07-session-summary-redesign.md) | 🟡 보류                  |
| 4   | 위기 이후 지속 대화 시 안내 배너 표시 여부                                | [03](./03-crisis-handling-fixes.md)    | 🟡 보류                  |
| 5   | 메시지 전송 완전 실패 시 재전송 버튼 제공 여부                            | [11](./11-real-sse-integration.md)     | 🟡 보류                  |

---

## 1. 위기 fallback 안내에 핫라인 번호 포함 여부

**배경**: `CAUTIOUS_SPECULATIVE` 경로에서 출력단계 위기 재분류 시 `crisis` 이벤트 없이 `is_crisis_flagged=true`만 온다 ([CHAT_BACKEND_QUESTIONS §5](../CHAT_BACKEND_QUESTIONS.md#5-cautious_speculative-경로--출력단계-위기-재분류-시-crisis-이벤트-누락-수정-요청)에 백엔드 수정 요청해둠). 응답 전까지 프론트가 보여줄 fallback 안내에 핫라인 번호(109/1577-0199)를 넣을지, severity 1과 동일하게 번호 없는 문구만 보여줄지가 미정. 이 경로는 실제 severity를 알 수 없어 더 고민이 필요하다고 보류됨.

**후보안**:

- A) 핫라인 번호 항상 포함 — 실제 severity를 모르니 안전 우선
- B) 번호 없이 안내 문구만 — severity 1 기본값과 일관성 유지

**현재 임시 처리** ([03번 작업](./03-crisis-handling-fixes.md)): 번호 없는 문구(B)로 구현. 핫라인 정보가 없어 안전이 부족한 상태는 아님 — 백엔드 수정이 들어가면 정상적인 `crisis` 이벤트(+필요시 핫라인)가 오게 되므로 이 fallback 자체는 임시 안전망 역할.

**해소 (2026-06-24)**: 백엔드가 CAUTIOUS_SPECULATIVE 위기 재분류 시 `crisisFlowService.handle()`을 호출하도록 수정함(커밋 `f0c6744`, [chat-trouble-shoot/03-backend-fixes-applied.md §6](../chat-trouble-shoot/03-backend-fixes-applied.md#6-cautious_speculative-경로--출력단계-위기-재분류-시-crisis-이벤트-누락--수정됨-)). 이제 이 경로도 정상적인 `crisis` 이벤트(+핫라인)가 오므로, 이 fallback 분기(`handleCrisisFallback`, `useChatSse.ts`)는 이론상 도달 불가능한 안전망으로 격하됨. 실기기 QA(4회 시도: 입력단계 hardCrisis 1회 정상 확인, MEDIUM risk 문구 3회는 안전한 응답만 생성돼 출력단계 재분류 자체가 트리거되지 않음)로 fallback이 호출되지 않는 것까지는 확인했으나, 재분류 자체를 강제 재현하지는 못함 — LLM 응답에 좌우되는 드문 안전망이라 코드 분석(백엔드 diff + 프론트 `resources?.hotlines` 옵셔널 체이닝 구조)으로 충분하다고 판단해 마무리함. 상세: [trouble-impl/logs/02-crisis-safety-net-review.md](../trouble-impl/logs/02-crisis-safety-net-review.md).

---

## 2. `summary_status` done→viewed 전환 시점 불명

**배경**: `SummaryStatus`에 `viewed`가 있지만, `done`에서 `viewed`로 언제·어떻게 전환되는지 API_SPEC에 명시가 없다. `GET .../summary` 호출 자체가 자동으로 `viewed` 처리하는 건지 불명확하다. [05번 작업](./05-active-session-response.md)에서 "못 본 요약이 있으면 자동으로 요약 화면 리다이렉트"를 구현하기로 했는데, 전환 시점을 모르면 사용자가 이미 요약을 봤어도 앱을 열 때마다 다시 요약 화면으로 끌려가는 무한 리다이렉트가 생길 위험이 있다.

**후보안**:

- A) 백엔드에 문의 + 클라이언트에도 로컬 가드(이미 본 세션 기록) 추가
- B) 서버가 자동 전환한다고 가정하고 진행

**현재 임시 처리** ([05번 작업](./05-active-session-response.md)): 서버 동작과 무관하게 동작하는 안전장치로, 클라이언트에서 "리다이렉트로 한 번 보여준 `last_ended_session_id`"를 로컬에 기록해 같은 세션으로는 같은 앱 실행 동안 중복 리다이렉트하지 않도록 가드만 추가. 정확한 서버 전환 시점 확인은 보류.

---

## 3. `bias_types_detected` 포맷·null일 때 표시 방식

**배경**: [07번 작업](./07-session-summary-redesign.md)에서 새로 노출하기로 한 `bias_types_detected`는 string 1개 필드인데, 여러 유형이 감지되면 어떤 구분자로 오는지(쉼표 등) 스펙에 없다. 감지되지 않으면 `null`인데, 이때 카드를 숨길지 빈 상태로 보여줄지도 미정.

**후보안**:

- A) raw 문자열 그대로 표시 + `null`이면 카드 숨김
- B) 구분자로 split해 칩(chip) 리스트로 표시 + `null`이면 "감지된 인지왜곡 없음" 빈 상태 표시

**현재 임시 처리** ([07번 작업](./07-session-summary-redesign.md)): A로 구현 (raw 문자열 그대로, `null`이면 카드 숨김). 포맷이 확인되면 칩 렌더링으로 개선 가능하도록 컴포넌트 분리해둘 것.

---

## 4. 위기 이후 지속 대화 시 안내 배너 표시 여부

**배경**: `crisis_flow` 이후에도 세션을 종료하지 않고 대화를 계속할 수 있게 두기로 했다 ([5-1 결정](../CHAT_SERVER_GAP_ANALYSIS.md#0-1-결정-사항-2026-06-22-점검)). 이후 메시지들이 더 보수적으로 처리될 수 있다는 걸 사용자에게 "조금 더 조심스럽게 응답해요" 같은 배너로 알려줄지, 안내 없이 그대로 이어갈지가 미정.

**후보안**:

- A) 안내 없이 그대로 이어감 — 위기 메시지 자체(핫라인 카드)로 충분히 전달됐다고 봄
- B) 짧은 안내 배너 추가 (예: 헤더에 문구 표시)

**현재 임시 처리** ([03번 작업](./03-crisis-handling-fixes.md)): 이번 커밋에서는 배너를 추가하지 **않음**. 결정되면 별도 커밋으로 추가.

---

## 5. 메시지 전송 완전 실패 시 재전송 버튼 제공 여부

**배경**: [11번 작업](./11-real-sse-integration.md)에서 타임아웃/연결 끊김으로 `done` 없이 스트림이 끝나는 경우를 일반 에러로 처리하기로 했다. 이때 사용자에게 실패한 메시지에 "재전송" 버튼을 줄지, 에러 토스트만 띄우고 사용자가 직접 다시 입력하게 둘지가 미정.

**후보안**:

- A) 에러 토스트만, 재전송은 사용자가 직접 다시 입력
- B) 실패한 메시지에 "재전송" 버튼 추가

**현재 임시 처리** ([11번 작업](./11-real-sse-integration.md)): 이번 커밋에서는 재전송 버튼을 **포함하지 않음** (에러 토스트만). 결정되면 별도 커밋으로 추가.
