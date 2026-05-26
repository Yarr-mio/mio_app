# Folder Structure

> 이 문서는 AI(Claude Code 등)가 프로젝트 구조를 파악하기 위한 참고 문서다.
> `docs/` 폴더에는 이처럼 코드에서 바로 파악하기 어려운 설계 의도와 배치 기준을 기록한다.

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
│   │   │       ├── step1Emotion.tsx
│   │   │       ├── step2Concern.tsx
│   │   │       ├── step3Style.tsx
│   │   │       └── step4Character.tsx
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
│   │   └── mindExplore/                  # 모달 스택 (홈에서 presentModal, 탭 외부)
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
│   │   │       └── useAuth.ts            # 로그인/로그아웃 useMutation
│   │   │
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   │   ├── StepEmotionSelect.tsx
│   │   │   │   ├── StepConcernSelect.tsx
│   │   │   │   ├── StepStyleSelect.tsx
│   │   │   │   └── StepCharacterSelect.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useOnboarding.ts      # 온보딩 제출 useMutation
│   │   │   └── store/
│   │   │       └── onboardingStore.ts    # 스텝별 선택값 (완료 후 초기화)
│   │   │
│   │   ├── home/
│   │   │   ├── components/
│   │   │   │   ├── EmotionConstellation.tsx
│   │   │   │   ├── TodaySummaryCard.tsx
│   │   │   │   └── TodoList.tsx
│   │   │   └── hooks/
│   │   │       └── useHome.ts            # home-today, constellation, todos
│   │   │
│   │   ├── checkin/
│   │   │   ├── components/
│   │   │   │   ├── EmotionSelector.tsx
│   │   │   │   ├── IntensitySlider.tsx
│   │   │   │   ├── DiaryInput.tsx
│   │   │   │   └── CheckinHistoryCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCheckin.ts
│   │   │   └── store/
│   │   │       └── checkinStore.ts       # 체크인 플로우 임시 입력값 (완료 후 초기화)
│   │   │
│   │   ├── chat/
│   │   │   ├── components/
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── RestructureCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useChatSse.ts         # @microsoft/fetch-event-source SSE 스트리밍
│   │   │   └── store/
│   │   │       └── chatStore.ts          # 메시지 목록, 타이핑 상태, 재구성 제안 상태
│   │   │
│   │   ├── report/
│   │   │   ├── components/
│   │   │   │   ├── EmotionTrendChart.tsx
│   │   │   │   └── TriggerAnalysis.tsx
│   │   │   └── hooks/
│   │   │       └── useReport.ts
│   │   │
│   │   ├── mypage/
│   │   │   ├── components/
│   │   │   │   ├── PartnerCard.tsx
│   │   │   │   ├── SettingsItem.tsx
│   │   │   │   └── RestructureRecordCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useMypage.ts          # profile, partner list, settings, records, memory
│   │   │   └── store/
│   │   │       └── partnerStore.ts       # 파트너 변경 임시 선택 상태
│   │   │
│   │   └── mindExplore/
│   │       ├── components/
│   │       │   ├── StageCard.tsx
│   │       │   └── ResultCard.tsx
│   │       ├── hooks/
│   │       │   └── useMindExplore.ts
│   │       └── store/
│   │           └── mindExploreStore.ts   # 탐색 세션, 스테이지 선택, 결과 (종료 후 초기화)
│   │
│   ├── components/                       # 앱 전체 공유 컴포넌트
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Collapsible.tsx
│   │   │   ├── ExternalLink.tsx
│   │   │   ├── HintRow.tsx
│   │   │   └── WebBadge.tsx
│   │   ├── layout/
│   │   │   ├── ScreenContainer.tsx
│   │   │   ├── SafeView.tsx
│   │   │   ├── AppTabs.tsx
│   │   │   └── AppTabs.web.tsx
│   │   ├── themed/
│   │   │   ├── ThemedText.tsx
│   │   │   └── ThemedView.tsx
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
│   │   ├── queryClient.ts                # QueryClient 인스턴스 + defaultOptions
│   │   ├── queryKeys.ts                  # 쿼리 키 팩토리 (전체 공유)
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
│   │       └── mindExplore.ts
│   │
│   ├── store/                            # 앱 전역 클라이언트 상태 (Zustand)
│   │   └── authStore.ts                  # 토큰, isAuthenticated, isOnboarded (앱 전역 접근)
│   │
│   ├── notifications/                    # FCM 푸시 알림 처리
│   │   ├── fcm.ts                        # 디바이스 토큰 등록/갱신
│   │   ├── handleTap.ts                  # 알림 탭 → 딥링크 라우팅
│   │   └── types.ts                      # 알림 타입 상수 + payload 타입
│   │
│   ├── hooks/                            # 앱 전체 공유 훅
│   │   ├── useColorScheme.ts
│   │   ├── useColorScheme.web.ts
│   │   ├── useTheme.ts
│   │   ├── useKeyboard.ts
│   │   ├── useDebounce.ts
│   │   └── useToast.ts
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
│   ├── icons/                            # SVG 아이콘 파일 (react-native-svg-transformer로 컴포넌트 변환)
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

| 파일                       | 역할                                                       |
| -------------------------- | ---------------------------------------------------------- |
| `api/queryClient.ts`       | QueryClient 인스턴스 생성, staleTime/retry 등 전역 옵션    |
| `api/queryKeys.ts`         | 쿼리 키 팩토리 — 키 중복·오타 방지, invalidate 일관성 보장 |
| `api/endpoints/*.ts`       | 순수 fetcher 함수 — useQuery 없이 단독 호출 가능           |
| `features/*/hooks/use*.ts` | useQuery / useMutation / useInfiniteQuery 래핑 훅          |
| `app/_layout.tsx`          | QueryClientProvider로 앱 전체 감싸기                       |

## 파일 배치 판단 기준

| 질문                               | 위치                             |
| ---------------------------------- | -------------------------------- |
| 딱 한 기능에서만 쓰는 컴포넌트/훅? | `src/features/[기능이름]/`       |
| 두 개 이상 기능에서 쓰는 컴포넌트? | `src/components/`                |
| 서버 요청 순수 함수?               | `src/api/endpoints/`             |
| 전역으로 공유되는 상태?            | `src/store/`                     |
| 특정 기능 안에서만 쓰는 상태?      | `src/features/[기능이름]/store/` |
