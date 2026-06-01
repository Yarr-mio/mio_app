# Coding Rules

> AI(Claude Code 등)가 코드를 작성할 때 반드시 따라야 하는 규칙 목록이다.
> 위반 사례(BAD)와 올바른 사례(GOOD)를 함께 제시한다.

---

## 1. 단일 책임 원칙 (SRP)

컴포넌트·훅·함수 하나는 하나의 역할만 담당한다.

- `app/` 파일: 라우트 진입점만. 컴포넌트 정의 금지.
- `api/endpoints/*.ts`: 순수 fetcher 함수만. useQuery 금지.
- `features/*/hooks/`: useQuery / useMutation 래핑만. 직접 fetch 금지.
- `features/*/components/`: UI 렌더링만. 서버 통신 금지.

```tsx
// BAD: fetch + 렌더링 + 로직이 한 컴포넌트 안에
function CheckinScreen() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/checkin').then((r) => setData(r));
  }, []);
  return <View>{data?.score * 0.8}</View>;
}

// GOOD: 레이어별 분리
// api/endpoints/checkin.ts  → fetchCheckin()
// features/checkin/hooks/useCheckin.ts  → useQuery(queryKeys.checkin.detail())
// features/checkin/components/CheckinResult.tsx  → <CheckinResult score={data.score} />
// app/(main)/checkin/index.tsx  → <CheckinResult /> 마운트만
```

---

## 2. 매직 넘버·문자열 금지

숫자·문자열 리터럴을 컴포넌트나 함수 안에 직접 작성하지 않는다.

| 종류                | 저장 위치                 |
| ------------------- | ------------------------- |
| 색상·간격·폰트 크기 | `constants/theme.ts`      |
| API URL, 앱 설정값  | `constants/config.ts`     |
| 감정 타입·라벨·색상 | `constants/emotions.ts`   |
| 캐릭터 메타데이터   | `constants/characters.ts` |
| TanStack Query 키   | `api/queryKeys.ts`        |
| HTTP 상태 코드      | `constants/config.ts`     |

```tsx
// BAD
<View style={{ borderRadius: 12, marginTop: 16 }} />;
if (statusCode === 401) {
  refreshToken();
}
queryClient.invalidateQueries({ queryKey: ['checkin', 'list'] });

// GOOD
import { RADIUS, SPACING } from '@/constants/theme';
import { HTTP_STATUS } from '@/constants/config';
import { queryKeys } from '@/api/queryKeys';

<View style={{ borderRadius: RADIUS.card, marginTop: SPACING.md }} />;
if (statusCode === HTTP_STATUS.UNAUTHORIZED) {
  refreshToken();
}
queryClient.invalidateQueries({ queryKey: queryKeys.checkin.list() });
```

---

## 3. TypeScript — `any` 금지

`any` 타입을 사용하지 않는다. `as unknown as T` 캐스팅도 최소화한다.

- `tsconfig.json`의 `"strict": true`를 유지한다.
- 공유 타입은 `src/types/` 폴더에 정의한다.
- 불가피하게 캐스팅해야 하면 한 줄 주석으로 이유를 명시한다.

```ts
// BAD
const handleResponse = (data: any) => { ... };
const result = someValue as unknown as CheckinResult;

// GOOD
import type { ApiResponse } from '@/types/common';
import type { CheckinResult } from '@/types/checkin';

const handleResponse = (data: ApiResponse<CheckinResult>) => { ... };
```

---

## 4. Props — interface로 명시적 타입 정의

컴포넌트 Props는 반드시 별도 `interface`로 선언한다. 인라인 객체 타입 금지.

```tsx
// BAD
function EmotionBadge(props: any) { ... }
function EmotionBadge({ type, size }: { type: string; size: number }) { ... }

// GOOD
interface EmotionBadgeProps {
  type: EmotionType;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}
function EmotionBadge({ type, size = 'md', onPress }: EmotionBadgeProps) { ... }
```

---

## 5. 스타일링 — NativeWind className 사용, 인라인 스타일 금지

- 인라인 `style={{ }}` 금지 (렌더마다 객체 재생성).
- `StyleSheet.create` 금지 (NativeWind 도입 이후 혼용 금지).
- 동적 클래스 조합은 `clsx` + `tailwind-merge`(`cn` 유틸) 사용.

```tsx
// BAD
<View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 16 }} />;
const styles = StyleSheet.create({ container: { flex: 1 } });

// GOOD
<View className="flex-1 bg-midnight p-4" />;

// 동적 클래스
import { cn } from '@/utils/cn';
<View className={cn('rounded-xl p-4', isActive && 'bg-primary', isDisabled && 'opacity-50')} />;
```

### 5-1. 색상 — 테마 토큰 사용, 하드코딩 금지

className 및 네이티브 prop 어디서도 색상값을 직접 작성하지 않는다.

- NativeWind className: `tailwind.config.js`의 커스텀 색상 토큰을 사용한다.
- 네이티브 prop(`placeholderTextColor`, `minimumTrackTintColor` 등): `constants/theme.ts`에서 상수로 정의하고 import해서 사용한다.

**토큰 저장 위치**

| 종류                      | 저장 위치                                    |
| ------------------------- | -------------------------------------------- |
| NativeWind용 색상 토큰    | `tailwind.config.js` → `theme.extend.colors` |
| 네이티브 prop용 색상 상수 | `constants/theme.ts`                         |

```tsx
// BAD — 하드코딩
<View className="bg-[#0D0D1A] border-white/10" />
<Text className="text-white/60" />
<TextInput placeholderTextColor="rgba(255,255,255,0.3)" />
<Slider minimumTrackTintColor="#FFFFFF" />

// GOOD — 테마 토큰 사용
<View className="bg-midnight border-line" />
<Text className="text-fg-dim" />

import { InputColors, SliderColors } from '@/constants/theme';
<TextInput placeholderTextColor={InputColors.placeholder} />
<Slider minimumTrackTintColor={SliderColors.track} />
```

**현재 정의된 주요 토큰 (`tailwind.config.js`)**

| 토큰                                                                | 설명                                     |
| ------------------------------------------------------------------- | ---------------------------------------- |
| `bg-midnight`                                                       | 앱 메인 배경 (`#0D0D1A`)                 |
| `text-midnight`                                                     | 밝은 배경(예: 흰 버튼) 위 텍스트         |
| `bg-surface` / `bg-surface-md` / `bg-surface-lg`                    | 유리 질감 카드 배경 (white 5%/10%/15%)   |
| `border-line` / `border-line-md`                                    | 경계선 (white 10%/20%)                   |
| `text-fg-dim` / `text-fg-muted` / `text-fg-faint` / `text-fg-ghost` | 보조 텍스트 계층 (white 60%/50%/40%/30%) |
| `text-fg-soft` / `text-fg-sub`                                      | 보조 텍스트 계층 (white 70%/80%)         |
| `text-success` / `bg-success/20` / `border-success/40`              | 성공 상태                                |
| `text-danger` / `bg-danger/10` / `border-danger/20`                 | 오류/만료 상태                           |
| `text-link`                                                         | 링크 강조색                              |

---

## 6. Rules of Hooks 엄수

훅은 항상 컴포넌트 최상단에서 호출한다. 조건문·반복문·중첩 함수 안에서 호출 금지.

```tsx
// BAD
function Component({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (isLoggedIn) {
    const { data } = useQuery(...); // 조건문 안에서 호출 금지
  }
}

// GOOD
function Component({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { data } = useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: fetchProfile,
    enabled: isLoggedIn, // enabled 옵션으로 실행 조건 제어
  });
}
```

---

## 7. 메모이제이션 — 직접 작성 금지 (React Compiler가 자동 처리)

이 프로젝트는 `app.json`의 `experiments.reactCompiler: true`로 React Compiler가 활성화되어 있다.
React Compiler는 빌드 타임에 `useMemo`·`useCallback`·`React.memo`를 자동으로 삽입한다.
개발자가 직접 작성하면 컴파일러의 최적화를 방해하거나 중복 적용된다.

**규칙: `useMemo`, `useCallback`, `React.memo`를 직접 작성하지 않는다.**

```tsx
// BAD: 개발자가 직접 작성 (React Compiler와 충돌)
const chartData = useMemo(() => rawLogs.map(transformToChartPoint), [rawLogs]);
const handleSelect = useCallback((id: string) => setSelected(id), []);
const MemoizedCard = React.memo(Card);

// GOOD: 그냥 작성하면 컴파일러가 알아서 최적화
const chartData = rawLogs.map(transformToChartPoint);
const handleSelect = (id: string) => setSelected(id);
export function Card(...) { ... }
```

**예외:** React Compiler가 처리하지 못하는 케이스에만 수동 작성을 허용하며,
반드시 한 줄 주석으로 이유를 명시한다.

```tsx
// React Compiler opt-out: 외부 라이브러리가 참조 동일성을 요구함
const stableOptions = useMemo(() => ({ threshold: 0.5 }), []);
```

---

## 8. 절대 경로 임포트

상대 경로(`../../../`) 사용 금지. `@/` 절대 경로를 사용한다.

```ts
// BAD
import { useAuth } from '../../../features/auth/hooks/useAuth';
import type { EmotionType } from '../../types/emotion';

// GOOD
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EmotionType } from '@/types/emotion';
```

---

## 9. 환경변수 — `constants/config.ts`에서만 접근

`process.env.EXPO_PUBLIC_*`를 컴포넌트나 훅에서 직접 읽지 않는다.

```ts
// BAD
const url = process.env.EXPO_PUBLIC_API_BASE_URL + '/checkin';

// GOOD
// constants/config.ts 에서 한 번만 읽고 export
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

// 사용처
import { API_BASE_URL } from '@/constants/config';
const url = `${API_BASE_URL}/checkin`;
```

---

## 10. Expo / React Native 특화 규칙

### 10-1. useEffect 클린업 필수

구독·이벤트 리스너 등록 시 반드시 클린업 함수를 반환한다.

```tsx
// BAD
useEffect(() => {
  const sub = AppState.addEventListener('change', handler);
}, []);

// GOOD
useEffect(() => {
  const sub = AppState.addEventListener('change', handler);
  return () => sub.remove();
}, []);
```

### 10-2. FlatList — keyExtractor는 id 기반, 절대 index 금지

```tsx
// BAD
<FlatList keyExtractor={(_, index) => String(index)} />

// GOOD
<FlatList
  keyExtractor={(item) => item.id}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 10-3. 이미지는 반드시 `expo-image`

React Native 기본 `Image` 컴포넌트 사용 금지.

```tsx
// BAD
import { Image } from 'react-native';
<Image source={{ uri }} />;

// GOOD
import { Image } from 'expo-image';
<Image source={uri} contentFit="cover" cachePolicy="memory-disk" />;
```

### 10-4. `expo-image`의 `Image`에는 크기를 `style` prop으로 지정

NativeWind의 `className`은 서드파티 컴포넌트에 변환이 적용되지 않아 크기가 0이 되고 이미지가 렌더링되지 않는다.
레이아웃 관련 클래스(`w-*`, `h-*`, `flex`, `m-*`, `p-*` 등)도 동일하게 `style` prop으로 작성한다.

```tsx
// BAD
<Image source={meta.image} className="w-8 h-8" contentFit="contain" />;

// GOOD
<Image source={meta.image} style={{ width: 32, height: 32 }} contentFit="contain" />;
```

Tailwind 단위 환산: `1 unit = 4dp` (예: `w-8 = 32dp`, `w-6 = 24dp`)

### 10-5. 스택 뒤로가기 헤더 — `BackHeader` 컴포넌트 사용

스택이 쌓여 뒤로가기 헤더가 필요한 화면에서는 직접 구현하지 않고 `src/components/layout/BackHeader.tsx`를 사용한다.
`BackHeader`는 안전 영역(Safe Area) 처리와 `router.back()` 연결이 내장되어 있다.

| Prop          | 타입        | 필수 여부 | 설명                           |
| ------------- | ----------- | --------- | ------------------------------ |
| `title`       | `string`    | 필수      | 헤더 중앙에 표시되는 제목      |
| `rightAction` | `ReactNode` | 선택      | 헤더 우측 영역에 렌더링할 요소 |

```tsx
// BAD: 뒤로가기 헤더를 직접 구현
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { top } = useSafeAreaInsets();
<View style={{ paddingTop: top + 12 }} className="flex-row items-center px-5 pb-3">
  <Pressable onPress={() => router.back()}>
    <Text className="text-white text-xl">←</Text>
  </Pressable>
  <Text className="text-white text-lg font-semibold">설정</Text>
</View>

// GOOD: BackHeader 사용
import { BackHeader } from '@/components/layout/BackHeader';
<BackHeader title="설정" />

// 우측 액션이 필요한 경우
<BackHeader title="체크인" rightAction={<SaveButton />} />
```

### 10-6. 안전 영역(Safe Area) 하드코딩 금지

기기별 노치·홈바 높이를 숫자로 하드코딩하지 않는다.

```tsx
// BAD
<View style={{ paddingTop: 44 }} />;

// GOOD
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { top } = useSafeAreaInsets();
<View style={{ paddingTop: top }} />;

// 또는 src/components/layout/SafeView.tsx, ScreenContainer.tsx 사용
```

---

## 11. 에러 처리 레이어 원칙

에러 처리 책임을 레이어별로 명확히 분리한다. 중복 처리 금지.

| 레이어                     | 책임                                              |
| -------------------------- | ------------------------------------------------- |
| `api/client.ts` (인터셉터) | 401 → 토큰 갱신 재시도, 403 → 강제 로그아웃       |
| `api/endpoints/*.ts`       | HTTP 에러를 그대로 throw (catch 금지)             |
| `features/*/hooks/use*.ts` | `onError` 콜백, `throwOnError` 설정               |
| `features/*/components/`   | 에러 UI 렌더링만 (`<ErrorState />` 컴포넌트 사용) |

```tsx
// BAD: endpoint에서 catch해서 삼키기
async function fetchCheckin() {
  try {
    return await client.get('/checkin');
  } catch (e) {
    console.error(e); // 에러를 삼키면 상위 레이어가 감지 불가
    return null;
  }
}

// GOOD: endpoint는 그냥 throw
async function fetchCheckin(): Promise<CheckinResult> {
  const { data } = await client.get<ApiResponse<CheckinResult>>('/checkin');
  return data.result;
}
```

---

## 12. Zustand 스토어 — 클라이언트 상태만

서버에서 받아온 데이터를 Zustand에 저장하지 않는다. 서버 상태는 TanStack Query가 담당한다.

| 저장소         | 담당                                                     |
| -------------- | -------------------------------------------------------- |
| TanStack Query | 서버 데이터 (프로필, 채팅, 리포트 등)                    |
| Zustand        | 클라이언트 전용 상태 (토큰, UI 임시 입력값, 플로우 상태) |

```ts
// BAD: 서버 데이터를 Zustand에 저장
const useAuthStore = create(() => ({
  userProfile: null as UserProfile | null, // 서버 데이터 → TanStack Query로
  accessToken: null as string | null,
}));

// GOOD: 클라이언트 전용 상태만
const useAuthStore = create(() => ({
  accessToken: null as string | null,
  isAuthenticated: false,
  isOnboarded: false,
}));
```

---

## 13. 컴포넌트 파일 배치 기준

새 파일을 만들기 전에 아래 기준으로 위치를 결정한다.

| 질문                               | 위치                                              |
| ---------------------------------- | ------------------------------------------------- |
| 딱 한 기능에서만 쓰는 컴포넌트/훅? | `src/features/[기능명]/components/` 또는 `hooks/` |
| 두 개 이상 기능에서 쓰는 컴포넌트? | `src/components/`                                 |
| 앱 전역에서 쓰는 훅?               | `src/hooks/`                                      |
| 서버 요청 순수 함수?               | `src/api/endpoints/`                              |
| 앱 전역 클라이언트 상태?           | `src/store/`                                      |
| 특정 기능 안에서만 쓰는 상태?      | `src/features/[기능명]/store/`                    |
| 순수 유틸 함수?                    | `src/utils/`                                      |
| 공유 TypeScript 타입?              | `src/types/`                                      |

---

## 15. 공통 컴포넌트 의무 사용

`src/components/layout`, `src/components/themed`, `src/components/ui` 안의 공통 컴포넌트를 우선 사용한다.
동일한 기능을 직접 구현하거나 raw 프리미티브(`Pressable`, `Text`, `View`)로 대체하는 것을 금지한다.

### 15-1. ScreenContainer — Safe Area 처리

Safe Area 처리가 필요한 화면·모달 최상위에서는 `useSafeAreaInsets`를 직접 쓰지 않고
`src/components/layout/ScreenContainer.tsx`를 사용한다.

| Prop              | 기본값 | 설명                                       |
| ----------------- | ------ | ------------------------------------------ |
| `withTopInset`    | `true` | 노치·다이나믹 아일랜드 상단 패딩 자동 처리 |
| `withBottomInset` | `true` | 홈바 하단 패딩 자동 처리                   |
| `bottomInsetMin`  | `24`   | 홈바가 없는 기기에서의 최소 하단 여백 (dp) |
| `className`       | —      | 배경색·flex 등 추가 스타일                 |

```tsx
// BAD: useSafeAreaInsets 직접 사용
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { top } = useSafeAreaInsets();
<View style={{ paddingTop: top }} className="flex-1 bg-midnight">...</View>

// GOOD: ScreenContainer 사용
import { ScreenContainer } from '@/components/layout/ScreenContainer';
<ScreenContainer className="bg-midnight">...</ScreenContainer>

// 모달처럼 KeyboardAvoidingView와 함께 쓸 때 (하단 inset은 KAV에 위임)
<KeyboardAvoidingView className="flex-1" behavior={...}>
  <ScreenContainer className="bg-midnight" withBottomInset={false}>
    ...
  </ScreenContainer>
</KeyboardAvoidingView>
```

### 15-2. Button — 액션 버튼

클릭 가능한 주요 액션 버튼은 raw `Pressable` 대신 `src/components/ui/Button.tsx`를 사용한다.
로딩 스피너·비활성화·variant별 스타일이 내장되어 있다.

| Prop      | 타입                              | 기본값      | 설명                                            |
| --------- | --------------------------------- | ----------- | ----------------------------------------------- |
| `variant` | `'primary' \| 'ghost' \| 'white'` | `'primary'` | 버튼 색상 스타일                                |
| `size`    | `'md' \| 'lg'`                    | `'lg'`      | `md` = h-12 rounded-xl, `lg` = h-16 rounded-2xl |
| `loading` | `boolean`                         | `false`     | 로딩 중 스피너 표시 + 비활성화                  |

```tsx
// BAD: Pressable + ActivityIndicator + Text 직접 조합
<Pressable
  disabled={isLoading}
  className="w-full h-16 rounded-2xl bg-white items-center justify-center"
>
  {isLoading ? <ActivityIndicator color="#0D0D1A" /> : <Text className="text-midnight font-bold">저장</Text>}
</Pressable>

// GOOD: Button 컴포넌트 사용
import { Button } from '@/components/ui/Button';
<Button variant="white" loading={isLoading} onPress={onSave}>저장</Button>
<Button variant="ghost" size="md" onPress={onCancel}>취소</Button>
```

### 15-3. Chip / Label — 뱃지

카테고리·감정 라벨 표시에 raw `View + Text` 조합 대신 공통 컴포넌트를 사용한다.

| 컴포넌트 | 위치                      | 용도                                      |
| -------- | ------------------------- | ----------------------------------------- |
| `Chip`   | `src/components/ui/Chip`  | 기록 카드 메타 정보 (카테고리 등)         |
| `Label`  | `src/components/ui/Label` | 감정 강도·캐릭터 전문 분야 등 보라색 라벨 |

```tsx
// BAD
<View className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
  <Text className="text-fg-sub text-xs">{label}</Text>
</View>;

// GOOD
import { Chip } from '@/components/ui/Chip';
<Chip label={record.category_label} />;
```

### 15-4. ThemedText — 타입별 텍스트

반복되는 텍스트 스타일 조합은 `src/components/themed/ThemedText.tsx`의 `type` 프리셋을 활용한다.

| type          | 클래스                               |
| ------------- | ------------------------------------ |
| `title`       | `text-3xl font-bold leading-[37px]`  |
| `subtitle`    | `text-lg font-medium leading-[20px]` |
| `small`       | `text-sm leading-5 font-medium`      |
| `smallBold`   | `text-sm leading-5 font-semibold`    |
| `smallMedium` | `text-xs leading-4 font-medium`      |

```tsx
// BAD
<Text className="text-3xl font-bold">나의 기억</Text>
<Text className="text-sm font-medium text-fg-dim">설명 텍스트</Text>

// GOOD
import { ThemedText } from '@/components/themed/ThemedText';
<ThemedText type="title">나의 기억</ThemedText>
<ThemedText type="small" className="text-fg-dim">설명 텍스트</ThemedText>
```

---

## 14. SVG 아이콘

SVG 파일은 `react-native-svg` + `react-native-svg-transformer`를 통해 React 컴포넌트로 import한다.

### 저장 위치

`assets/icons/` 폴더에 저장한다.

### 설정 원리

`metro.config.js`가 `.svg` 파일을 `react-native-svg-transformer/expo`로 변환한다.
`src/types/svg.d.ts`가 `*.svg` import의 타입을 `React.FC<SvgProps>`로 선언한다.

### 사용 패턴

```tsx
// BAD: react-native-svg 컴포넌트를 직접 조립
import Svg, { Path } from 'react-native-svg';
<Svg width={24} height={24}>
  <Path d="M5 12h14..." />
</Svg>;

// GOOD: SVG 파일을 컴포넌트로 import
import HomeIcon from '@/assets/icons/home.svg';
<HomeIcon width={24} height={24} color={COLORS.primary} />;
```

### 크기·색상

- `width` / `height` prop으로 크기를 지정한다. 기본값을 넣으면 props 없이도 사용 가능하다.
  단, SVG 파일 내부의 `fill`이나 `stroke`가 하드코딩되어 있으면 `color` prop이 반영되지 않는다.
  색상을 동적으로 바꾸려면 SVG 파일의 `fill`/`stroke` 속성 값을 `currentColor`로 변경한다.

```svg
<!-- BAD: 하드코딩 색상 -->
<path fill="#FFFFFF" d="..." />

<!-- GOOD: currentColor로 교체 → color prop 반영 -->
<path fill="currentColor" d="..." />
```

```tsx
// currentColor 적용 후
<HomeIcon width={24} height={24} color="white" />
<HomeIcon width={20} height={20} color={COLORS.primary} />
```

### 경로 alias

`tsconfig.json`의 `@/assets/*` alias가 `./assets/*`를 가리키므로 아래처럼 절대 경로로 import한다.

```tsx
import HomeIcon from '@/assets/icons/home.svg';
import BackIcon from '@/assets/icons/back.svg';
```
