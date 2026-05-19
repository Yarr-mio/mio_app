# Folder Structure

Expo SDK 55 + Expo Router + TanStack Query 기반 feature 구조.

```
mio_app/
├── src/
│   │
│   ├── app/                              # 라우트 파일만 (절대 컴포넌트 X)
│   │   ├── _layout.tsx                   # 루트 레이아웃 (AuthGuard, QueryClientProvider, NativeWind 초기화)
│   │   ├── +not-found.tsx
│   │   │
│   │   ├── (auth)/                       # 비로그인 접근 그룹
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx                 # 소셜 로그인
│   │   │   └── onboarding/
│   │   │       ├── _layout.tsx
│   │   │       ├── step1-emotion.tsx
│   │   │       ├── step2-concern.tsx
│   │   │       ├── step3-style.tsx
│   │   │       └── step4-character.tsx
│   │   │
│   │   ├── (main)/                       # 로그인 후 탭 그룹
│   │   │   ├── _layout.tsx               # Bottom Tab Navigator + 탭바 숨김 조건 처리
│   │   │   ├── home/
│   │   │   │   └── index.tsx
│   │   │   ├── checkin/
│   │   │   │   ├── index.tsx
│   │   │   │   └── history.tsx
│   │   │   ├── chat/
│   │   │   │   ├── index.tsx
│   │   │   │   └── restructure.tsx       # CBT 생각 재구성 (탭바 숨김)
│   │   │   ├── report/
│   │   │   │   └── index.tsx
│   │   │   └── my/
│   │   │       ├── index.tsx
│   │   │       ├── partner.tsx           # AI 파트너 변경
│   │   │       ├── settings.tsx
│   │   │       ├── records.tsx           # 재구성 기록 목록
│   │   │       └── memory.tsx            # AI 기억 관리
│   │   │
│   │   └── mind-explore/                 # 모달 스택 (홈에서 presentModal, 탭 외부)
│   │       ├── _layout.tsx
│   │       ├── index.tsx                 # 오프닝
│   │       ├── [stageId].tsx             # 스토리 스테이지
│   │       └── result.tsx
│   │
│   ├── features/                         # 기능별 모듈
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   └── SocialLoginButton.tsx
│   │   │   └── hooks/
│   │   │       └── use-auth.ts           # 로그인/로그아웃 useMutation
│   │   │
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   │   ├── StepEmotionSelect.tsx
│   │   │   │   ├── StepConcernSelect.tsx
│   │   │   │   ├── StepStyleSelect.tsx
│   │   │   │   └── StepCharacterSelect.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-onboarding.ts     # 온보딩 제출 useMutation
│   │   │   └── store/
│   │   │       └── onboarding-store.ts   # 스텝별 선택값 (완료 후 초기화)
│   │   │
│   │   ├── home/
│   │   │   ├── components/
│   │   │   │   ├── EmotionConstellation.tsx
│   │   │   │   ├── TodaySummaryCard.tsx
│   │   │   │   └── TodoList.tsx
│   │   │   └── hooks/
│   │   │       └── use-home.ts           # home-today, constellation, todos
│   │   │
│   │   ├── checkin/
│   │   │   ├── components/
│   │   │   │   ├── EmotionSelector.tsx
│   │   │   │   ├── IntensitySlider.tsx
│   │   │   │   ├── DiaryInput.tsx
│   │   │   │   └── CheckinHistoryCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-checkin.ts
│   │   │   └── store/
│   │   │       └── checkin-store.ts      # 체크인 플로우 임시 입력값 (완료 후 초기화)
│   │   │
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── RestructureCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-chat.ts
│   │   │   │   └── use-chat-sse.ts       # @microsoft/fetch-event-source SSE 스트리밍
│   │   │   └── store/
│   │   │       └── chat-store.ts         # 메시지 목록, 타이핑 상태, 재구성 제안 상태
│   │   │
│   │   ├── report/
│   │   │   ├── components/
│   │   │   │   ├── EmotionTrendChart.tsx
│   │   │   │   └── TriggerAnalysis.tsx
│   │   │   └── hooks/
│   │   │       └── use-report.ts
│   │   │
│   │   ├── mypage/
│   │   │   ├── components/
│   │   │   │   ├── PartnerCard.tsx
│   │   │   │   ├── SettingsItem.tsx
│   │   │   │   └── RestructureRecordCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-mypage.ts         # profile, partner list, settings, records, memory
│   │   │   └── store/
│   │   │       └── partner-store.ts      # 파트너 변경 임시 선택 상태
│   │   │
│   │   └── mind-explore/
│   │       ├── components/
│   │       │   ├── StageCard.tsx
│   │       │   └── ResultCard.tsx
│   │       ├── hooks/
│   │       │   └── use-mind-explore.ts
│   │       └── store/
│   │           └── mind-explore-store.ts # 탐색 세션, 스테이지 선택, 결과 (종료 후 초기화)
│   │
│   ├── components/                       # 앱 전체 공유 컴포넌트
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── external-link.tsx
│   │   │   ├── hint-row.tsx
│   │   │   └── web-badge.tsx
│   │   ├── layout/
│   │   │   ├── ScreenContainer.tsx
│   │   │   ├── SafeView.tsx
│   │   │   ├── app-tabs.tsx
│   │   │   └── app-tabs.web.tsx
│   │   ├── themed/
│   │   │   ├── themed-text.tsx
│   │   │   └── themed-view.tsx
│   │   ├── feedback/
│   │   │   ├── ErrorState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── character/
│   │   │   └── CharacterAvatar.tsx
│   │   └── emotion/
│   │       └── EmotionBadge.tsx
│   │
│   ├── api/                              # 서버 통신 레이어
│   │   ├── client.ts                     # Axios 인스턴스 + 인터셉터 (401 토큰 갱신, 403 처리)
│   │   ├── query-client.ts               # QueryClient 인스턴스 + defaultOptions
│   │   ├── query-keys.ts                 # 쿼리 키 팩토리 (전체 공유)
│   │   └── endpoints/                    # 순수 fetcher 함수 (hooks와 분리)
│   │       ├── auth.ts
│   │       ├── onboarding.ts
│   │       ├── checkin.ts
│   │       ├── chat.ts                   # SSE 스트림 연결 포함
│   │       ├── report.ts
│   │       ├── character.ts
│   │       ├── my.ts
│   │       ├── todo.ts
│   │       ├── notification.ts           # FCM 토큰 등록·갱신
│   │       └── mind-explore.ts
│   │
│   ├── store/                            # 앱 전역 클라이언트 상태 (Zustand)
│   │   └── auth-store.ts                 # 토큰, isAuthenticated, isOnboarded (앱 전역 접근)
│   │
│   ├── notifications/                    # FCM 푸시 알림 처리
│   │   ├── fcm.ts                        # 디바이스 토큰 등록/갱신
│   │   ├── handle-tap.ts                 # 알림 탭 → 딥링크 라우팅
│   │   └── types.ts                      # 알림 타입 상수 + payload 타입
│   │
│   ├── hooks/                            # 앱 전체 공유 훅
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   ├── use-theme.ts
│   │   ├── use-keyboard.ts
│   │   ├── use-debounce.ts
│   │   └── use-toast.ts
│   │
│   ├── constants/
│   │   ├── theme.ts                      # 색상, 타이포그래피, 간격 (디자인 토큰 기준)
│   │   ├── emotions.ts                   # EmotionType → 이모지·한글 라벨·색상 매핑
│   │   ├── characters.ts                 # 캐릭터 메타데이터 (mio·bau·rumi·momo·chichi)
│   │   └── config.ts                     # API BASE_URL, 앱 설정값
│   │
│   ├── types/                            # 공유 TypeScript 타입
│   │   ├── auth.ts
│   │   ├── emotion.ts                    # EmotionType (7종), EmotionMeta
│   │   ├── chat.ts                       # ChatMessage, MessageType, RestructurePrompt
│   │   ├── report.ts
│   │   ├── character.ts                  # CharacterId (5종)
│   │   └── common.ts                     # ApiResponse<T>, Pagination 등 공통 응답 타입
│   │
│   ├── utils/                            # 순수 유틸 함수
│   │   ├── date.ts                       # date-fns 래퍼
│   │   ├── storage.ts                    # expo-secure-store 래퍼
│   │   └── format.ts
│   │
│   └── global.css                        # NativeWind 전역 스타일
│
├── assets/
│   ├── images/
│   │   ├── characters/                   # 캐릭터 이미지 (5종)
│   │   └── tabIcons/
│   ├── animations/                       # Lottie JSON
│   └── fonts/
│
├── scripts/
│   └── reset-project.js
│
├── tailwind.config.js                    # NativeWind 커스텀 색상·폰트
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

## TanStack Query 파일 역할

| 파일 | 역할 |
|------|------|
| `api/query-client.ts` | QueryClient 인스턴스 생성, staleTime/retry 등 전역 옵션 |
| `api/query-keys.ts` | 쿼리 키 팩토리 — 키 중복·오타 방지, invalidate 일관성 보장 |
| `api/endpoints/*.ts` | 순수 fetcher 함수 — useQuery 없이 단독 호출 가능 |
| `features/*/hooks/use-*.ts` | useQuery / useMutation / useInfiniteQuery 래핑 훅 |
| `app/_layout.tsx` | QueryClientProvider로 앱 전체 감싸기 |

## 파일 배치 판단 기준

| 질문 | 위치 |
|------|------|
| 딱 한 기능에서만 쓰는 컴포넌트/훅? | `src/features/[기능이름]/` |
| 두 개 이상 기능에서 쓰는 컴포넌트? | `src/components/` |
| 서버 요청 순수 함수? | `src/api/endpoints/` |
| 전역으로 공유되는 상태? | `src/store/` |
| 특정 기능 안에서만 쓰는 상태? | `src/features/[기능이름]/store/` |
