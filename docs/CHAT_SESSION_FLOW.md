# 채팅 세션 AI 처리 흐름 분석

> 대상: 백엔드/AI 파이프라인 동작을 이해해야 하는 개발자.
> REST 엔드포인트 스펙은 [API_SPEC.md](./API_SPEC.md), SSE 이벤트 와이어 포맷은 [SSE_SPEC.md](./SSE_SPEC.md) 참고.
> 이 문서는 "그 이벤트가 왜 나오는지", "서버 내부에서 어떤 판단을 거치는지"를 다룬다. 코드가 변경되면 함께 갱신해야 한다 (자동 동기화 아님).
> 기준 소스: `com.mio.session.*`, `com.mio.ai.*`, `com.mio.crisis.*`

## 목차

1. [전체 흐름 한눈에 보기](#1-전체-흐름-한눈에-보기)
2. [세션 생성 & Pre-warming](#2-세션-생성--pre-warming)
3. [메시지 처리 파이프라인 (단계별)](#3-메시지-처리-파이프라인-단계별)
4. [PolicyEngine: 10단계 결정 트리](#4-policyengine-10단계-결정-트리)
5. [위험 감지 메커니즘 총정리 (3중 레이어)](#5-위험-감지-메커니즘-총정리-3중-레이어)
6. [위험 감지 시 실제로 무엇을 응답하는가](#6-위험-감지-시-실제로-무엇을-응답하는가)
7. [출력(AI 응답) 검증 — OutputPreFilter / OutputJudge](#7-출력ai-응답-검증--outputprefilter--outputjudge)
8. [세션 종료 이후 처리 (체크포인트 / 컨솔리데이션)](#8-세션-종료-이후-처리-체크포인트--컨솔리데이션)
9. [알아두면 좋은 설계 특징과 한계](#9-알아두면-좋은-설계-특징과-한계)

---

## 1. 전체 흐름 한눈에 보기

```
POST /v1/sessions                          → 세션 생성 + (비동기) SafetyProfile/메모리 컨텍스트 pre-warming
POST /v1/sessions/{id}/messages (SSE)       → ConversationOrchestrator.handle() 1회 실행
  ├─ 입력 정규화 + 사용자 신호 분석(UserMessageSignal)
  ├─ [보안] SecurityRuleFilter            — 프롬프트 인젝션/탈옥 규칙 매칭
  ├─ [L0]   OpenAI Moderation API         — self-harm 등 카테고리 점수
  ├─ [L1]   SafetyL1                       — 위기/위험 키워드, 감정 급락, 반복 부정, 의존 신호
  ├─ SafetySignalCombiner                  — 위 3개 신호를 합쳐 "LLM Judge를 부를지" 결정
  ├─ [선택] InputJudge (LLM, gpt-4o-mini)  — 애매한 케이스만 호출, risk_level 등 재분류
  ├─ SafetyProfile 로드 (Redis 캐시, 사용자별 개인화 임계값)
  ├─ WorkingMemory(세션 버퍼) + 메모리 컨텍스트(RAG) 로드
  ├─ PolicyEngine.decide()                 — 결정론적 10단계 규칙 → 최종 액션 결정
  └─ 액션 실행:
       ├─ SECURITY_REFUSAL → 고정 거부 문구
       ├─ CRISIS_FLOW       → CrisisFlowService (고정 위기 문구 + 핫라인)
       └─ GENERATE          → PromptBuilder로 시스템 프롬프트 구성 → LLM 호출(gpt-4o)
                               → [선택] OutputPreFilter + OutputJudge로 출력 재검증
  └─ 메시지 영속화(암호화) + WorkingMemory 갱신 + AiDecisionLogger 비동기 감사 로그

POST /v1/sessions/{id}/end                 → 세션 종료, SessionEndedEvent 발행 (커밋 후)
  ├─ WorkingMemory.clear (Redis 정리)
  └─ SessionConsolidator (비동기, 별도 트랜잭션)
       ├─ 체크포인트 + 잔여 메시지로 전체 대화 재구성
       ├─ LLM으로 세션 요약 생성 → AES 암호화 저장
       ├─ ExtractorLLM으로 thought/distortion/emotion/trigger 추출
       ├─ cbt_patterns / emotional_states / thoughts / user_beliefs 갱신
       └─ 인지왜곡 감지 시 Todo 3건 자동 생성 (TodoRecommendationService)

(세션 진행 중, 20개 메시지=10턴마다) ConversationCheckpointService가 비동기로 중간 요약 생성
```

핵심 설계: **결정론적 규칙(SafetyL1, PolicyEngine)이 먼저 걸러내고, 애매한 경우에만 LLM Judge를 추가로 호출**하는 계층 구조다. LLM 호출은 비용/지연이 크므로 명백한 케이스(고위험 키워드, 명백히 안전한 대화)는 LLM 없이 즉시 처리한다.

---

## 2. 세션 생성 & Pre-warming

`SessionService.createSession` (`POST /v1/sessions`):

- 온보딩 미완료 사용자는 차단 (`ONBOARDING_REQUIRED`).
- `character_id`를 안 보내면 사용자의 `preferredCharacterId`를 사용. 허용 캐릭터: `mio, bau, rumi, momo, chichi` (`SessionService.ALLOWED_CHARACTER_IDS`).
- 사용자당 활성 세션은 1개만 허용 (`SESSION_ALREADY_ACTIVE`, DB unique 제약 `uq_sessions_one_active_per_user`로도 이중 방어).
- **트랜잭션 커밋 후** `ContextPreWarmer.preWarm()`이 비동기로 실행됨 (`@Async`):
  - `SafetyProfileBuilder.buildAndCache()` — 사용자의 과거 belief/crisis/CBT 패턴/개입 효과를 5개 쿼리 병렬 조회 후 Redis에 90분 캐싱 (`SafetyProfile`, 아래 §3-7 참고).
  - 기본 메모리 컨텍스트(`RetrievalPlan.clearLow()`)를 미리 구성해 Redis에 5분 캐싱.
  - 목적: 사용자가 첫 메시지를 "타이핑하는 동안"(5~30초) 미리 준비해, 실제 메시지 처리 시 캐시 HIT으로 지연을 줄임.

---

## 3. 메시지 처리 파이프라인 (단계별)

소스: `ConversationOrchestrator.handle()` — 메시지 1건당 정확히 1회 실행되는 동기 메서드(가상 스레드에서 실행).

### 3-1. 입력 정규화 + 사용자 신호 분석

- `InputNormalizer.normalize()`: trim + 공백 압축 + 소문자화. 이후 모든 키워드 매칭은 이 정규화된 문자열 기준.
- `UserMessageSignalAnalyzer.analyze()`: **키워드 매칭만으로** 사용자 메시지의 감정 점수와 인지왜곡 유형을 즉시 추정 (LLM 호출 없음, 빠름):
  - `emotionScore`: "무너졌/감당이안/버티기힘들" 등 강한 고통 표현 포함 시 `25`, "힘들/불안/우울" 등 중간 표현 시 `45`, 그 외 기본값 `70` (0~100 스케일, 3단계 고정값).
  - `biasType`: `overgeneralization`(과잉 일반화) / `catastrophizing`(파국화) / `all_or_nothing`(전부 아니면 전무) 중 하나, 매칭 없으면 `null`.
  - 이 결과는 ① 위험 신호 계산(§3-4)과 ② `done` SSE 이벤트의 `emotion_score`, ③ DB의 `messages.emotion_score`/`messages.bias_type` 컬럼에 모두 쓰인다.

### 3-2. 보안 규칙 필터 — `SecurityRuleFilter`

목적: **AI를 향한 공격(프롬프트 인젝션/탈옥)**을 탐지. 사용자의 정신건강 위기와는 별개의 축이다.

- `ATTACK_PATTERNS` (즉시 차단, 예: "이전 지침 무시", "시스템 프롬프트 보여줘", "관리자 권한", "단계별 자해 방법 알려줘") → `SecurityLevel.ATTACK`, `allowMainGeneration=false`.
- `SUSPICIOUS_PATTERNS` (예: "역할극", "dan mode", "개발자 모드", "이건 픽션이니까") 또는 **Base64로 인코딩된 "ignore/무시" 패턴 탐지(`isObfuscated`)** → `SecurityLevel.SUSPICIOUS`, 생성은 허용하되 출력 가드 강제.
- 그 외 → `SecurityLevel.CLEAN`.

### 3-3. OpenAI Moderation API — L0

- `OpenAiModerationClient.moderate()`가 OpenAI `/v1/moderations`를 호출. **실패 시 fail-open** (즉, 모더레이션 서버 장애나 타임아웃이면 `flagged=false`로 간주하고 통과시킴 — 가용성을 우선한 설계).
- `ModerationResult.isSelfHarmFlagged()`: `self-harm`, `self-harm/intent`, `self-harm/instructions` 카테고리 중 하나라도 true면 true.

### 3-4. SafetyL1 — 키워드 기반 위기/위험 탐지 (L1)

`SafetyL1.check()`가 결정론적으로 다음을 모두 평가:

| 신호                 | 판정 조건                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hardCrisis`         | "자살/자해/죽고싶다/죽을거야/suicid/self-harm" 등 `HARD_CRISIS_KEYWORDS` 포함                                                                                             |
| `riskCandidate`      | (hardCrisis 아닐 때) "사라지고싶다/살기싫다/삶이의미없다" 등 `RISK_KEYWORDS`, 또는 `HOPELESSNESS_KEYWORDS`(예: "전부엉망인것만"), 또는 현재 `biasType == catastrophizing` |
| `dependencyHint`     | "너밖에없어/네가없으면/여기뿐인것같아" 등 AI에 대한 과의존 표현                                                                                                           |
| `emotionSpike`       | 최근 3개 사용자 메시지(DB 조회, `loadRecentUserSafetyHistory`) 평균 emotionScore보다 현재 점수가 임계값(기본 30, SafetyProfile로 개인화 가능) 이상 급락                   |
| `repetitiveNegative` | 최근 메시지 중 동일 `biasType` 출현 횟수 + 1이 임계값(기본 3) 이상                                                                                                        |
| `moderationFlagged`  | L0 모더레이션이 self-harm 계열로 flagged                                                                                                                                  |

`hardCrisis`가 가장 강한 신호이며, 다른 신호보다 우선 평가된다(다른 신호는 `!hardCrisis`일 때만 추가 평가). 종합 `combinedConfidence`는 `hardCrisis=0.9 > riskCandidate=0.6 > (그 외 신호 있음)=0.45 > 0.0` 순.

### 3-5. SafetySignalCombiner — Judge 호출 여부 결정

세 신호(Security, SafetyL1, Moderation)를 합쳐 `CombinedSignal`을 만들고, **"이 메시지를 LLM Judge(InputJudge)에게 보여줄지"**를 결정한다 (`requiresJudge`). 다음 중 하나라도 해당하면 호출:

- `riskCandidate`, `dependencyHint`, `repetitiveNegative`, `emotionSpike` 중 하나라도 true
- L0 self-harm flagged인데 L1 신호가 전혀 없음 (애매한 케이스)
- L0 self-harm 카테고리 점수가 0.3 초과인데 flagged 미달
- `SecurityLevel.SUSPICIOUS`
- `SafetyProfile.policyFlags`에 `force_judge` 포함 (최근 14일 내 severity≥2 위기 이력이 있는 사용자는 강제로 매 메시지 Judge를 거침)

단, `hardCrisis`이거나 `SecurityLevel.ATTACK`이면 **Judge를 호출하지 않고 즉시 확정** — 이미 결론이 명확하기 때문에 LLM 호출로 지연시키지 않는다.

### 3-6. InputJudge — LLM 기반 2차 분류 (조건부, gpt-4o-mini)

- 호출될 때만 실행되는 추가 분류기. `risk_level`을 `CLEAR_LOW|LOW|MEDIUM|HIGH` 4단계로, 그리고 권장 `generation_mode`/`delivery_mode`까지 함께 응답하도록 프롬프트에 명시.
- 프롬프트 가이드라인 원문 기준: **HIGH**는 "타인이 없어도 괜찮을지 생각하는 등 소극적 자살사고, 대화 상대가 없는 고립, 반복되는 무망감"이며 `GUARDED + BUFFER` 권장. **MEDIUM**은 "명확한 정서적 고통, 의존 표현, 위기 신호 없는 인지왜곡"이며 `SUPPORTIVE + CAUTIOUS_SPECULATIVE` 권장.
- 프롬프트에 "애매하면 보수적으로 판단(LOW보다 MEDIUM, MEDIUM보다 HIGH 우선)"이라는 지시가 명시돼 있음.
- `SafetyProfile`의 `commonDistortionCodes`/`recentCrisisSeverityMax`를 컨텍스트로 함께 전달해 사용자별 이력을 반영.
- **실패 시(LLM 에러/파싱 실패) `fallback()` → `CLEAR_LOW`로 안전하게 후퇴**한다 — 즉 Judge 실패는 "위험 없음"으로 간주되므로, 동시에 SafetyL1의 결정론적 체크가 이미 더 강한 위험을 잡아낸 경우라면 PolicyEngine의 이전 단계(§4의 1~5단계)에서 먼저 걸러져 있다.
- 이 호출은 `OutputJudge`와 마찬가지로 **별도 모델(`gpt-4o-mini`)**을 쓴다 — 실제 대화 응답 생성(`gpt-4o`)과는 분리된 저비용 분류 전용 모델.

### 3-7. SafetyProfile — 사용자별 개인화 임계값

`SafetyProfileBuilder`가 만드는 구조화 프로필 (Redis에 세션당 90분 캐싱, 원문 belief 텍스트는 포함하지 않음):

- 활성 신념(`user_beliefs`), 최근 14일 위기 이력 최대 severity, CBT 패턴, 개입 효과(`intervention_outcomes`), 세션 이력을 5개 쿼리로 병렬 조회.
- 7일 이상 사용 또는 10세션 이상이면 `source="personalized"`로 전환 (그 전엔 `"default"`).
- `riskPriorScore`가 높을수록(`crisisMax*0.3 + negativeBeliefCount*0.1`) 감정 급락 임계값을 30→25로, 반복 부정 임계값을 3→2로 낮춰 **더 민감하게** 만듦.
- `riskPrior > 0.5`면 `dependency_caution` 플래그, `crisisMax >= 2`면 `force_judge` 플래그 추가.
- **위기 감지 시(`CrisisDetectedEvent`) 즉시 invalidate** → 다음 메시지부터 새로 빌드되어 더 보수적인 임계값이 즉시 반영됨.

### 3-8. WorkingMemory + 메모리 컨텍스트

- `WorkingMemory`(Redis): 세션 내 최근 10턴(20개) 메시지 버퍼, 소크라테스식 질문 사용 횟수(`socratic_count`, 2회 제한), 인지왜곡별 카운트, 리스크 누적치를 세션 TTL(90분) 동안 보관.
- 메모리 컨텍스트(RAG): `ContextPreWarmer`가 캐시 HIT이면 즉시 사용, MISS면 `MemoryRetrievalPlanner`가 현재 위험도에 따라 검색 범위(`RetrievalPlan`)를 동적으로 결정해 동기로 재구성(~50ms 목표). 이 컨텍스트는 `PromptBuilder`를 통해 시스템 프롬프트에 그대로 삽입된다.

---

## 4. PolicyEngine: 10단계 결정 트리

`PolicyEngine.decide()`는 **LLM을 호출하지 않는 순수 결정론적 코드**다. 위 단계들의 결과(`CombinedSignal`, `InputJudgeResult`, `SafetyProfile`, `SessionDelta`)를 입력받아 위에서부터 순서대로 평가하고, 먼저 매칭되는 규칙이 즉시 적용된다 (우선순위 = 코드 순서):

| 순위 | 조건                                                                | action             | generationMode | deliveryMode         |
| ---- | ------------------------------------------------------------------- | ------------------ | -------------- | -------------------- |
| 1    | `SecurityLevel.ATTACK`                                              | `SECURITY_REFUSAL` | CRISIS         | SECURITY_REFUSAL     |
| 2    | `hardCrisis`                                                        | `CRISIS_FLOW`      | CRISIS         | CRISIS_FLOW          |
| 3    | `SecurityLevel.SUSPICIOUS`                                          | `GENERATE`         | GUARDED        | CAUTIOUS_SPECULATIVE |
| 4    | L0 self-harm flagged **그리고** L1 moderationFlagged                | `CRISIS_FLOW`      | CRISIS         | CRISIS_FLOW          |
| 5    | L0 self-harm flagged인데 L1엔 신호 없음                             | `GENERATE`         | GUARDED        | CAUTIOUS_SPECULATIVE |
| 6    | (Judge 호출됨) `risk_level == HIGH`                                 | `GENERATE`         | GUARDED        | **BUFFER**           |
| 7    | (Judge 호출됨) `risk_level == MEDIUM`                               | `GENERATE`         | SUPPORTIVE     | CAUTIOUS_SPECULATIVE |
| 8    | (Judge 호출됨) `risk_level == LOW`                                  | `GENERATE`         | NORMAL         | SPECULATIVE          |
| 9    | Judge 미호출 + (`repetitiveNegative` 또는 `emotionSpike`) 단독 신호 | `GENERATE`         | SUPPORTIVE     | SPECULATIVE          |
| 10   | 그 외 전부 (기본값)                                                 | `GENERATE`         | NORMAL         | SPECULATIVE          |

추가 규칙:

- 7번(MEDIUM) 분기에서 **세션 내 소크라테스식 질문이 이미 2회 사용됐으면**(`SessionDelta.socraticLimitReached()`) CBT 개입 힌트(`InterventionHints`)를 비움 — 같은 세션에서 소크라테스식 질문을 과도하게 반복하지 않도록 하는 제약.
- `InterventionHints`는 `SafetyProfile.effectiveInterventions`(과거에 효과 있었던 개입 방식, MEDIUM/HIGH는 최대 3개·그 외 2개)와 `ineffectiveInterventions`(피해야 할 방식)를 시스템 프롬프트에 주입하는 용도.
- `decisionId`마다 12자리 랜덤 hex가 발급되어 `AiPolicyDecision` 감사 로그의 식별자로 쓰인다.

---

## 5. 위험 감지 메커니즘 총정리 (3중 레이어)

| 레이어 | 구성요소                   | 방식                                           | 속도/비용                         | 무엇을 잡나                                                            |
| ------ | -------------------------- | ---------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **L0** | OpenAI Moderation API      | 외부 API, 카테고리+점수                        | 빠름·저비용, **fail-open**        | self-harm 등 OpenAI가 정의한 일반 유해 카테고리                        |
| **L1** | `SafetyL1` (키워드/패턴)   | 정규화 문자열의 키워드 매칭 + 최근 메시지 통계 | 매우 빠름, LLM 비용 없음          | 한국어 위기 키워드, 감정 급락, 반복 부정, AI 의존 신호                 |
| **L2** | `InputJudge` (gpt-4o-mini) | LLM 분류, JSON 구조화 출력                     | 느림·비용 있음, **조건부 호출만** | 키워드로 안 잡히는 애매한 문맥 (예: "다들 내가 없어도 괜찮을 것 같아") |

이와 별개로 **보안 레이어**(`SecurityRuleFilter`)가 항상 먼저 평가되어, "사용자의 정신건강 위험"과 "AI를 향한 공격/탈옥 시도"를 구분해서 처리한다 (전자는 위기 대응, 후자는 거부).

그리고 **출력에도 동일한 사고로 2단계 검증**이 있다 (§7): 결정론적 `OutputPreFilter` → 필요시 LLM `OutputJudge`.

---

## 6. 위험 감지 시 실제로 무엇을 응답하는가

### 6-1. 입력 단계에서 위기로 판정된 경우 (`CRISIS_FLOW`)

`CrisisFlowService.handle()`이 실행되며, **LLM 호출 자체를 생략**하고 고정 문구만 내려준다 (안전성 보장 — 생성형 응답이 위기 상황에서 부적절한 말을 할 위험을 원천 차단):

| severity | 트리거                                                                                                                                                              | 고정 응답                                                         | 핫라인 안내                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 3        | SafetyL1의 `hardCrisis=true` (PolicyEngine 순위 2번 경로는 항상 이 케이스), 또는 원본 메시지에 "자살/자해/죽고싶다" 등 `CrisisFlowService.SEVERITY_3_KEYWORDS` 포함 | "지금 바로 전문가와 이야기할 수 있는 곳을 알려드릴게요" 계열 문구 | 자살예방상담전화 109, 정신건강위기상담전화 1577-0199 (24/7) |
| 2        | `hardCrisis=false`인데 원본 메시지에 "사라지고싶다/없어지고싶다/살기싫다" 등 `SEVERITY_2_KEYWORDS` 포함                                                             | "전문적인 도움을 받으실 수 있는 곳을 안내해드릴게요" 계열 문구    | 위와 동일                                                   |
| 1        | `hardCrisis=false`이고 위 키워드 어디에도 안 걸림 (예: L0 모더레이션이 self-harm으로 flag했지만 한국어 키워드 사전엔 없는 표현)                                     | 진정 유도 문구                                                    | 없음 (`null`)                                               |

부가 동작: `crisis_events` 테이블에 기록 + `CrisisDetectedEvent` 발행으로 해당 세션 SafetyProfile **즉시 무효화** (다음 메시지부터 더 보수적인 임계값 적용).

> 참고: PolicyEngine이 `CRISIS_FLOW`를 내리는 두 경로(§4 순위 2·4번) 중 순위 2(`hardCrisis`)는 항상 severity 3으로 귀결된다. 반면 순위 4(`L0 self-harm flagged && L1.moderationFlagged`)는 `hardCrisis`가 false인 채로도 도달 가능하므로 — 즉 모더레이션 API는 self-harm으로 판단했지만 `SafetyL1`의 한국어 키워드 사전에는 안 걸린 경우 — severity가 1 또는 2로 떨어질 수 있다. `CrisisFlowService`는 `SafetyL1`과 별개의 자체 키워드 목록(`SEVERITY_2/3_KEYWORDS`)으로 원본 메시지를 한 번 더 검사해 severity를 정한다.

### 6-2. 출력 생성 후 위기로 재분류된 경우

LLM이 응답을 만든 _후_ `OutputJudge`가 `CRISIS_FLOW`를 판정할 수도 있다 (예: 사용자 발화는 애매했지만 LLM 응답 내용이나 사전 필터 결과를 보고서야 위기로 확정되는 경우). 이때 동작이 **딜리버리 모드에 따라 다르다**:

- **BUFFER 모드**: `resolveOutputJudgeAction`이 `crisisFlowService.handle()`을 호출하긴 하지만, **이때 원본 메시지를 `null`로 넘긴다.** `BUFFER` 딜리버리는 PolicyEngine 순위 6번(HIGH risk)에서만 오는데 이 경로는 `hardCrisis=false`가 보장된 상태이므로, `determineSeverity`는 `originalMessage == null` 분기를 타 **항상 severity 1**(핫라인 없는 진정 유도 문구)로 귀결된다. 즉 `crisis` SSE 이벤트 자체는 오지만(§6-1과 달리), **실질적으로 핫라인 정보가 포함된 severity 2/3은 이 경로에서 나오지 않는다.**
- **CAUTIOUS_SPECULATIVE 모드**: `crisisFlowService.handle()`을 호출하지 **않고**, 고정 대체 문구("지금 많이 힘드시겠어요…")를 `delta.replace`로 보낸 뒤 `done(is_crisis_flagged=true, finished_reason="replaced_by_guard")`만 전송 — **`crisis` 이벤트와 핫라인 정보가 클라이언트에 전달되지 않는다.** (SSE_SPEC.md §7의 gotcha와 동일 사안, 백엔드 구현상의 비대칭)

### 6-3. 보안 공격으로 판정된 경우 (`SECURITY_REFUSAL`)

`SecurityRefusalTemplate`의 고정 문구 1개뿐: _"죄송해요, 그 요청에는 응답하기 어려워요. 다른 이야기를 나눠볼까요?"_ — 공격 유형이 무엇이었는지와 무관하게 항상 동일한 응답.

### 6-4. 위기까진 아니지만 위험도가 있는 경우 (`GUARDED`/`SUPPORTIVE` 생성 모드)

이 경우는 "고정 문구"가 아니라 **LLM이 정상적으로 응답을 생성**하되, 시스템 프롬프트에 추가 지시를 주입해 톤을 조절한다 (`PromptBuilder`):

- `GUARDED`: "분석적 발언을 삼가고 공감 위주로 응답하세요. 단정적 표현을 사용하지 마세요."
- `SUPPORTIVE`: "감정을 먼저 충분히 인정하고 공감하세요. 행동 제안이나 해결책은 최소화합니다."
- 여기에 더해 `InterventionHints`(권장/회피 개입 코드)가 있으면 "[개입 힌트]" 섹션이 추가됨.
- 이 경로는 `requireOutputGuard=true`로 설정되어 **출력 후 OutputPreFilter/OutputJudge 검증이 강제**된다 (§7).

---

## 7. 출력(AI 응답) 검증 — OutputPreFilter / OutputJudge

LLM이 생성한 응답이라도 그대로 내보내지 않고, `deliveryMode`가 `BUFFER`/`CAUTIOUS_SPECULATIVE`인 경우 한 번 더 검사한다 (`SPECULATIVE`는 검사 없이 그대로 스트리밍 — 저위험으로 판단된 경로이므로).

### 7-1. OutputPreFilter (결정론적, LLM 아님)

`OutputPreFilter.check()`가 응답 텍스트에서 패턴 매칭으로 5가지 위반 유형을 탐지:

| 위반 유형              | 의미                    | 예시 패턴                           |
| ---------------------- | ----------------------- | ----------------------------------- |
| `ROLE_BOUNDARY`        | AI가 전문가 역할을 자처 | "저는 의사", "상담사로서"           |
| `DIAGNOSIS_CLAIM`      | 진단/처방 발언          | "당신은 우울증", "항우울제"         |
| `DEPENDENCY_REINFORCE` | 의존성 강화 발언        | "나 없이는 안 돼", "나만 믿으면 돼" |
| `INSTRUCTION_LEAK`     | 시스템 프롬프트 노출    | "시스템 프롬프트", "내 지침은"      |
| `EXPLICIT_HARM`        | 자해/자살 방법 안내     | "자살하는 방법", "약을 과다복용"    |

추가로 `checkWithCrisisContext()`: **입력이 위기 신호였는데 응답이 가볍고 긍정적인 톤**("기분 전환", "화이팅", "괜찮아질 거야" 등)이면 `CRISIS_MISMATCH`로 잡아낸다 — 위기 상황에 부적절하게 가벼운 응답을 거르는 장치.

### 7-2. OutputJudge (LLM, gpt-4o-mini, PreFilter 실패 시에만 호출)

PreFilter를 통과하지 못한 경우에만 비용을 들여 LLM에게 재검토를 맡긴다. 4가지 액션 중 하나를 반환:

| action        | 처리                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| `SEND`        | 원래 응답 그대로 전송 (PreFilter가 false positive였던 경우)                       |
| `REWRITE`     | LLM이 제공한 수정 버전(`rewrittenContent`)으로 교체. 값이 없으면 안전 문구로 대체 |
| `REPLACE`     | 고정 안전 문구("지금 많이 힘드시겠어요…")로 전면 교체                             |
| `CRISIS_FLOW` | 위기로 재분류 (처리는 딜리버리 모드별로 다름, §6-2)                               |

**LLM 호출 실패 시 `REPLACE`로 안전하게 후퇴** (fail-closed — InputJudge의 fail-open과 반대 방향인 점에 주의: 입력 판단이 실패하면 "위험 없음"으로, 출력 검증이 실패하면 "안전한 고정 문구로 교체"로 후퇴해 더 보수적으로 동작).

### 7-3. 전달 방식별 검증 타이밍

- **BUFFER**: LLM 응답을 전부 받은 후 → PreFilter → (필요시) Judge → 그제서야 SSE로 전송. 스트리밍 체감 없음 (가장 보수적).
- **CAUTIOUS_SPECULATIVE**: 스트리밍하면서 200자 단위로 PreFilter를 실행. 일찍 위반이 감지되면 그 즉시 스트리밍을 멈추고 Judge를 비동기로 호출(타임아웃 5초, 실패 시 `REPLACE`). 위반이 없으면 스트림 종료 후 한 번 더 PreFilter, 실패 시에만 Judge 호출. 안전하면 `delta.replace` 없이 `done`만 전송.
- **SPECULATIVE**: 아무 검증 없이 스트리밍 → 가장 빠르지만 가장 낮은 위험도 케이스에만 적용됨.

---

## 8. 세션 종료 이후 처리 (체크포인트 / 컨솔리데이션)

### 8-1. 진행 중 체크포인트 (`ConversationCheckpointService`)

- 메시지 20개(=10턴)마다 자동으로 트리거 (`messageCount % 20 == 0`), 비동기·별도 트랜잭션.
- 이전 체크포인트 이후의 메시지만 모아 gpt-4o-mini로 200자 이내 중간 요약을 생성해 `session_checkpoints`에 저장.
- 목적: 세션이 매우 길어져도 최종 요약(§8-2) 생성 시 전체 메시지를 LLM에 다시 넣지 않고 "체크포인트 요약들 + 마지막 체크포인트 이후의 잔여 메시지"만 사용하도록 해 토큰/비용을 절약.

### 8-2. 세션 종료 시 컨솔리데이션 (`SessionConsolidator`)

`POST /v1/sessions/{id}/end` 트랜잭션이 **커밋된 후**(`@TransactionalEventListener(AFTER_COMMIT)`) 별도 트랜잭션(`REQUIRES_NEW`)으로 비동기 실행:

1. 체크포인트 + 잔여 메시지를 합쳐 전체 대화를 재구성 (복호화 필요 — 메시지는 AES로 암호화 저장됨).
2. gpt-4o-mini로 **300~500자 세션 요약** 생성 → AES-256 암호화해 `session_summaries`에 저장. (`GET /v1/sessions/{id}/summary`가 반환하는 값의 출처 — 이 작업이 끝나기 전엔 `SummaryStatus.PENDING`이라 해당 엔드포인트가 `202`를 반환함, [API_SPEC.md](./API_SPEC.md) 참고)
3. **ExtractorLLM**(gpt-4o-mini)이 요약문에서 자동적 사고(`thoughts`, 최대 3개), 인지왜곡 코드, 핵심 신념 종류(`beliefKind`)/극성(`polarity`), 주요 감정, 트리거 태그, 에피소드 유형(`regular|crisis|cbt_success|cbt_partial|support_only`)을 JSON으로 추출.
4. `OntologyValidator`가 추출된 distortion/emotion 코드 중 시드 데이터에 정의되지 않은 값을 걸러냄 (LLM이 스키마 밖의 값을 만들어내는 것을 방지).
5. `cbt_patterns.recurrence_count` 증가, `emotional_states` insert, `thoughts` insert(암호화), `user_beliefs`에 증거 누적(`BeliefEvidenceAccumulator`) — 이 데이터들이 다음 세션의 `SafetyProfile`(§3-7)과 메모리 컨텍스트(RAG)의 재료가 된다.
6. **인지왜곡이 감지되면 `TodoRecommendationService`가 할 일 3건을 자동 생성** (심리*안정/인지*재구성/행동\_활성화 각 1건, 사용자가 과거에 싫어했던 개입 유형은 제외).
7. 성공하면 `SummaryStatus.DONE`, 예외 발생 시 별도 트랜잭션(`SummaryStatusWriter`)으로 `SummaryStatus.FAILED`를 확실히 기록.

---

## 9. 알아두면 좋은 설계 특징과 한계

- **fail-open vs fail-closed가 단계별로 다르다.** 입력 측 (L0 모더레이션, InputJudge)은 실패 시 "위험 없음"으로 후퇴해 대화가 끊기지 않게 하고, 출력 측 (OutputJudge)은 실패 시 "안전 문구로 교체"로 후퇴해 더 보수적으로 동작한다. 입력 판단이 실패해도 SafetyL1의 결정론적 키워드 체크는 별도로 항상 동작하므로 완전 무방비 상태는 아니다.
- **`Message.isCrisisFlagged` 컬럼은 메시지 저장 시 항상 `false`로 저장된다** (`SessionMessagePersistenceService.saveMessage`). 실제 위기 판정 결과는 SSE의 `done.is_crisis_flagged`와 `crisis_events` 테이블에만 남고, `messages` 테이블의 해당 컬럼에는 반영되지 않는다.
- **CAUTIOUS_SPECULATIVE 경로에서 출력 단계 위기 재분류 시 `crisis` 이벤트(핫라인 정보)가 누락된다** — 자세한 내용은 §6-2와 [SSE_SPEC.md](./SSE_SPEC.md) §7.
- **판사(Judge) 모델은 실제 대화 생성 모델과 분리**돼 있다 — 대화 응답은 `gpt-4o`, InputJudge/OutputJudge/ExtractorLLM/세션요약/체크포인트 요약은 모두 `gpt-4o-mini` (비용 최적화).
- **세션당 활성 SafetyProfile/메모리 컨텍스트는 Redis 캐시 기반**이라, Redis 장애 시 매 메시지마다 동기로 DB를 다시 조회하게 되어 지연이 늘어날 수 있다 (fallback 경로는 있으나 성능 저하 가능).
- **소크라테스식 질문 2회 제한**(`SessionDelta.socraticLimitReached`)처럼 세션 단위로 누적되는 CBT 관련 제약이 있어, 같은 세션이 길어질수록 AI의 개입 스타일이 달라질 수 있다.
- **SafetyL1의 위기/위험 키워드는 한국어 키워드 사전 기반**이라(`HARD_CRISIS_KEYWORDS` 등), 동의어·은유적 표현·다른 언어로 우회하면 L1에서는 안 잡히고 L0 모더레이션이나 InputJudge(호출되는 경우)에만 의존하게 된다.
