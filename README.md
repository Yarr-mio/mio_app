# mio_app

Expo SDK 55 + Expo Router + TanStack Query 기반 React Native 앱.

---

## 개발 환경

- Node.js 20+
- Expo CLI
- iOS: Xcode + iOS Simulator
- Android: Android Studio + Emulator 또는 실기기

---

## 시작하기

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 실제 값으로 채운다

# 3. 앱 실행
npx expo start
```

실행 후 터미널에서 `a` (Android), `i` (iOS), `w` (Web) 를 눌러 열 수 있다.

---

## 프로젝트 구조

```
mio_app/
├── src/
│   ├── app/          # Expo Router 라우트 파일 (컴포넌트 금지)
│   ├── features/     # 기능별 모듈 (components, hooks, store)
│   ├── components/   # 앱 전체 공유 컴포넌트
│   ├── api/          # Axios 인스턴스, QueryClient, 쿼리 키, fetcher
│   ├── store/        # Zustand 전역 상태
│   ├── hooks/        # 앱 전체 공유 훅
│   ├── constants/    # 디자인 토큰, 상수값
│   ├── types/        # 공유 TypeScript 타입
│   └── utils/        # 순수 유틸 함수
├── docs/             # AI 참고용 프로젝트 문서
├── .env.example      # 환경 변수 템플릿
└── ...
```

전체 구조는 [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md) 참고.

---

## docs 폴더

`docs/` 폴더는 AI(Claude Code 등)가 프로젝트를 이해하는 데 활용하는 문서를 관리한다.
코드에서 바로 파악하기 어려운 설계 의도, 폴더 배치 기준, 기술 선택 근거 등을 여기에 기록한다.

| 파일                  | 내용                             |
| --------------------- | -------------------------------- |
| `FOLDER_STRUCTURE.md` | 전체 폴더 구조 및 각 파일의 역할 |

---

## 환경 변수

| 변수                       | 설명                 |
| -------------------------- | -------------------- |
| `EXPO_PUBLIC_API_BASE_URL` | 백엔드 API 서버 주소 |

`EXPO_PUBLIC_` 접두어가 붙은 변수만 클라이언트(앱)에 노출된다.

---

## 브랜치 전략

### 브랜치 명명 규칙

```
{브랜치폴더명}/{이슈번호}-{PR명}
```

예시: `feature/12-login`

### 브랜치 폴더명

| 이름       | 용도                                     |
| ---------- | ---------------------------------------- |
| `main`     | 배포용                                   |
| `develop`  | 개발용                                   |
| `feature`  | 기능 추가                                |
| `refactor` | 기능 변경 없이 개선                      |
| `fix`      | 느긋한 버그 수정                         |
| `hotfix`   | 급한 버그 수정                           |
| `chore`    | 기타 환경 설정 (문서 추가, 파일 이동 등) |

---

## Commit Convention

### Commit Type

| 타입       | 설명                                   |
| ---------- | -------------------------------------- |
| `feature`  | 기능 추가                              |
| `refactor` | 기능 변경 없이 개선                    |
| `fix`      | 느긋한 버그 수정                       |
| `hotfix`   | 급한 버그 수정                         |
| `chore`    | 환경 설정 (문서 추가, 파일 이동 등)    |
| `style`    | 스타일 관련 작업 (CSS, 코드 포맷팅 등) |
| `remove`   | 파일 & 폴더 제거                       |

### Commit 양식

```
{type}: commit명

- ...
- ...

related to: #{이슈번호}
```

---

## Issue Convention

태스크는 **1 Issue - 1 PR** 단위로 관리한다.

```
에픽 > 스토리 > 태스크
```

예시:

- 에픽: **사용자 인증**
  - 스토리: **사용자가 로그인을 한다**
    - 태스크: `[FE] 로그인 페이지 퍼블리싱`
    - 태스크: `[BE] 로그인 API 구현`

---

## PR Convention

### PR 명명 규칙

```
이슈 제목
```

### Merge 전략

- **단순 merge** 사용 (Squash, Rebase 금지)

### PR 템플릿

`.github/PULL_REQUEST_TEMPLATE.md` 참고.

---

## 이름 명명 규칙

| 대상                       | 규칙         |
| -------------------------- | ------------ |
| 파일명 / 폴더명            | `camelCase`  |
| 클래스 / 인터페이스 / ENUM | `PascalCase` |
| 리액트 컴포넌트 파일       | `PascalCase` |
| 함수명 / 변수명 / 메서드명 | `camelCase`  |
| CSS 클래스 / id            | `kebab-case` |
