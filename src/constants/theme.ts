import { Platform } from 'react-native';

// 다크/라이트 원시 색상값 — NativeTabs 등 className을 못 쓰는 네이티브 prop에 사용
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

// 플랫폼별 폰트 패밀리 — 커스텀 fontFamily prop이 필요한 경우 사용
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// 슬라이더 색상 — className 미지원 네이티브 prop에 사용 (checkin IntensitySlider)
export const SliderColors = {
  track: '#FFFFFF',
  trackInactive: 'rgba(255,255,255,0.2)',
  thumb: '#FFFFFF',
} as const;

// 감정 강도 선택 슬라이더 — components/ui/EmotionIntensitySlider 전용
export const EmotionIntensitySliderColors = {
  trackActive: '#7060E0',
  trackInactive: '#EEEAF8',
  thumbCore: '#EEEAF8',
  thumbRing: '#7060E0',
  thumbStroke: 'rgba(238, 234, 248, 0.3)',
} as const;

// [레이아웃] 감정 강도 슬라이더 (EmotionIntensitySlider.tsx)
export const EmotionIntensitySliderLayout = {
  trackHeight: 9,
  thumbCoreSize: 11,
  thumbRingSize: 22,
  thumbTouchSize: 44,
  trackToScaleGap: 5,
  sliderAreaPaddingY: 16,
} as const;

/** NativeWind className — EmotionIntensitySliderLayout px 값과 동일하게 유지 */
export const EmotionIntensitySliderClasses = {
  sliderArea: 'h-[38px] justify-center overflow-visible',
  thumbRing:
    'h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-fg-default/30 bg-primary',
  thumbCore: 'h-[11px] w-[11px] rounded-full border-[1.5px] border-fg-default/30 bg-fg-default',
  scaleGap: 'mt-[5px]',
} as const;

export const ScreenSpacing = {
  bottomInsetMin: 24,
} as const;

export const PressableConfig = {
  hitSlop: 8,
} as const;

export const HeaderLayout = {
  backIconSize: 22,
} as const;

export const EmotionSelectBoxLayout = {
  iconSize: 85,
} as const;

// 텍스트 입력 색상 — placeholderTextColor 등 네이티브 prop에 사용
export const InputColors = {
  placeholder: 'rgba(255,255,255,0.3)',
} as const;

// fg 계층 색상 — NativeWind className 미지원 prop(color 등)에 사용
export const FgColors = {
  default: '#FFFFFF',
  onDefault: '#EEEAF8', // text-fg-default
  muted: '#FFFFFF80', // white/50
  faint: '#FFFFFF66', // white/40
} as const;

// 버튼 로딩 스피너 색상 — ActivityIndicator color prop에 사용
export const ButtonColors = {
  spinnerLight: '#FFFFFF',
  spinnerDark: '#0D0D1A',
} as const;

// 탭바 아이콘 색상 — color prop(네이티브)으로 직접 전달
export const TabBarColors = {
  iconActive: '#FFFFFF',
  iconInactive: 'rgba(255,255,255,0.3)',
} as const;

// 탭바 하단 여백 — SafeAreaView 내부에서 style prop으로 사용
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

// 온보딩 헤더 — SVG color prop 등 네이티브 prop에 사용
export const HeaderColors = {
  backIcon: '#D9D9D9',
  stepIndicator: '#9CA3AF',
} as const;

// 온보딩 강도 슬라이더 박스 — 네이티브 prop에 사용
export const OnboardingColors = {
  boxBackground: '#131238',
  boxBorder: '#2C295F',
} as const;

export const MaxContentWidth = 800;
