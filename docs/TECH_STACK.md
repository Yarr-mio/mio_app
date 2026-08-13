# Tech Stack

## 코어

| 분류            | 기술                            | 버전           | 비고                                    |
| --------------- | ------------------------------- | -------------- | --------------------------------------- |
| 프레임워크      | React Native + Expo SDK         | ~55.0.x        | 크로스플랫폼, 빠른 개발 사이클          |
| 언어            | TypeScript                      | ~5.9.x         | 타입 안정성                             |
| 네비게이션      | Expo Router                     | ~55.0.x        | 파일 기반 라우팅, React Navigation 래핑 |
| 상태 관리       | Zustand                         | ^5.x           | 경량, 보일러플레이트 없음               |
| 서버 통신       | TanStack Query v5               | ^5.x           | 캐싱, 낙관적 업데이트, 무한스크롤       |
| HTTP 클라이언트 | Axios                           | ^1.x           | 인터셉터로 401 토큰 갱신·403 처리       |
| 스타일링        | NativeWind                      | ^4.x           | 다크 테마 우선 UI에 적합                |
| 애니메이션      | Reanimated 4 + Lottie           | 4.2.1 / 미설치 | 상호작용·영상형 애니메이션 역할 분담    |
| 폼 관리         | React Hook Form + Zod           | 미설치         | 체크인 일기, 온보딩 입력 검증           |
| 인증 자동 갱신  | TanStack Query + Axios 인터셉터 | —              |                                         |
| 소셜 로그인     | @react-native-kakao/core + user | ^2.4.x         | Kakao 네이티브 SDK. Expo config plugin  |

> **네비게이션 참고**
> Expo Router가 파일 기반 라우팅을 담당하며, 내부적으로 React Navigation(`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/elements`)을 사용한다.
> 라우트 정의는 `src/app/` 폴더 구조로 결정된다.
> React Navigation 의존성으로 `react-native-screens`, `react-native-safe-area-context`, `react-native-gesture-handler`가 함께 설치된다.

> **애니메이션 역할 분담**
>
> - Reanimated 4 → 상호작용 애니메이션 (제스처, 전환 등)
> - Lottie → 영상형 애니메이션 (감정 별자리, 페이드인 등)

> **Reanimated 4 변경사항**
>
> - `react-native-worklets`가 별도 패키지로 분리됨 (이미 설치됨)
> - Reanimated 3과 API 대부분 호환되지만, 일부 API 변경 있음
> - 코드 작성 전 [Reanimated 4 공식 문서](https://docs.swmansion.com/react-native-reanimated/) 확인 필요

> **카카오 로그인 참고**
>
> - **패키지 역할**
>   - `@react-native-kakao/core` — SDK 초기화(`initializeKakaoSDK`), Expo config plugin(URL Scheme, Info.plist, AndroidManifest 자동 설정)
>   - `@react-native-kakao/user` — 카카오 로그인(`login()`) → `accessToken` 획득
>   - `expo-build-properties` — Android Kakao Maven repository 주입 (`app.config.ts`)
> - **환경변수:** `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY` (`.env.local`, `src/constants/config.ts`에서 접근)
> - **설정 파일:** `app.config.ts` — `@react-native-kakao/core` plugin, `ios.handleKakaoOpenUrl: true`
> - **FE 구현:** `src/features/auth/utils/kakaoLogin.ts` → accessToken → `POST /v1/auth/login`
> - **빌드:** 네이티브 빌드 필수 (Expo Go 미지원) — `npx expo prebuild` 후 `npx expo run:ios` / `run:android`
> - 코드 작성·설정 전 [React Native Kakao 공식 문서](https://rnkakao.mjstudio.net) 확인 필요

---

## 기타

| 분류         | 기술                                        | 설치 여부   | 비고                                                                                             |
| ------------ | ------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| 차트         | `victory-native`                            | 미설치      | SVG 기반, Expo/RN 공식 지원                                                                      |
| 채팅 UI      | 커스텀 FlatList                             | —           | 별도 패키지 없음                                                                                 |
| 슬라이더     | `@miblanchard/react-native-slider`          | 설치됨      | `ScoreSlider`, `EmotionIntensitySlider` 등                                                       |
| 햅틱         | `expo-haptics`                              | 설치됨      | 슬라이더 눈금 도달, 버튼 피드백 등                                                               |
| SVG          | `react-native-svg`                          | 설치됨      | `assets/icons/` SVG 아이콘 렌더링                                                                |
| 아이콘       | `@expo/vector-icons` (Ionicons)             | Expo에 포함 | `expo-symbols`도 설치됨                                                                          |
| 날짜         | `date-fns` + `@date-fns/tz`                 | 설치됨      | `src/utils/date.ts`에서 KST 기준 래핑                                                            |
| 환경변수     | `expo-constants` + `.env.local`             | 설치됨      |                                                                                                  |
| Kakao 빌드   | `expo-build-properties`                     | 설치됨      | Android Kakao Maven repo — `app.config.ts` plugin                                                |
| 보안 저장소  | `expo-secure-store`                         | 설치됨      | refresh_token 영속 저장                                                                          |
| 디바이스 ID  | `expo-crypto`                               | 설치됨      | UUID v4 `deviceId` 생성 (`src/utils/deviceId.ts`)                                                |
| 폰트         | `expo-font`                                 | 설치됨      | NotoSansKR, NanumMyeongjo 등 커스텀 폰트 로드                                                    |
| 딥링크       | `expo-linking`                              | 설치됨      | Expo Router 외부 URL, 알림 딥링크 연동                                                           |
| 스플래시     | `expo-splash-screen`                        | 설치됨      | 앱 시작 스플래시 화면                                                                            |
| 웹 브라우저  | `expo-web-browser`                          | 설치됨      | 외부 링크, OAuth 등 인앱 브라우저                                                                |
| 시스템 UI    | `expo-system-ui`                            | 설치됨      | Android 네비게이션 바 등 시스템 UI 색상                                                          |
| 상태바       | `expo-status-bar`                           | 설치됨      | 상태바 스타일 제어                                                                               |
| 글래스 효과  | `expo-glass-effect`                         | 설치됨      | iOS Liquid Glass UI                                                                              |
| 웹 지원      | `react-native-web` + `react-dom`            | 설치됨      | Expo Web 빌드                                                                                    |
| 푸시 알림    | `expo-notifications` + Firebase FCM         | 미설치      | FCM 디바이스 토큰 등록·갱신                                                                      |
| SSE 스트리밍 | `@microsoft/fetch-event-source`             | 미설치      | React Native 환경에서 EventSource 대체 — fetch 기반, Authorization 헤더 지원                     |
| 로컬 저장소  | `@react-native-async-storage/async-storage` | 설치됨      | 이벤트 계측 큐 영속 버퍼 (`src/analytics/buffer.ts`) — 비밀값이 아니라 SecureStore를 쓰지 않는다 |

---

## 유틸리티

| 패키지                  | 용도                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `clsx`                  | 조건부 className 조합                                                                                               |
| `tailwind-merge`        | NativeWind 클래스 충돌 해결                                                                                         |
| `expo-image`            | 이미지 렌더링 (캐싱, 성능 최적화)                                                                                   |
| `expo-device`           | 디바이스 정보 (FCM 토큰 등록 등에 활용)                                                                             |
| `expo-application`      | 설치된 바이너리의 실제 번들 ID(`applicationId`) — OTA로 오염되지 않는 variant 판별 원천 (`src/constants/config.ts`) |
| `react-native-worklets` | Reanimated 4 의존성                                                                                                 |

---

## 테마 방향

- **기본값:** 다크 모드
- **라이트 지원:** 시스템 설정(`useColorScheme`) 또는 마이페이지 설정에서 전환 가능
- **구현 방식:** NativeWind `dark:` prefix 클래스 + `tailwind.config.js` 커스텀 색상
