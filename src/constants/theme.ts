import { Platform, type ViewStyle } from 'react-native';

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

/** 온보딩 Step3 대화 방식 카드 */
export const OnboardingStyleCardLayout = {
  iconSlotSize: 92,
  iconRenderScale: 0.9,
} as const;

/** NativeWind className — OnboardingStyleCardLayout px 값과 동일하게 유지 */
export const OnboardingStyleCardClasses = {
  iconSlot: 'h-[92px] w-[92px] overflow-hidden items-center justify-center',
} as const;

/** 온보딩 완료(5단계) 캐릭터 아이콘 */
export const OnboardingCompleteLayout = {
  characterIconSize: 240,
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

// 페이지 서브 텍스트 — text-subtitle, SVG color prop 등
export const SubtitleColors = {
  DEFAULT: '#959595',
} as const;

// 버튼 로딩 스피너 색상 — ActivityIndicator color prop에 사용
export const ButtonColors = {
  spinnerLight: '#FFFFFF',
  spinnerDark: '#0D0D1A',
} as const;

// 탭바 아이콘/라벨/배경 — TabBar 레이아웃·NativeWind bg-tab-bar와 배경값 동일 유지 (tailwind.config.js)
export const TabBarColors = {
  background: '#04030A',
  iconActive: '#7060E0',
  iconInactive: 'rgba(255,255,255,0.3)', // white 30%
} as const;

export const TabBarLabelColors = {
  active: '#7060E0',
  inactive: 'rgba(217,217,217,0.7)', // D9D9D9 70%
} as const;

/** 탭바 상단 그림자*/
export const TabBarShadowStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#8D8D8D',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 0,
  },
  android: {
    elevation: 0,
    shadowColor: '#8D8D8D',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  default: {},
});

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

/** 인증 화면 */
export const AuthTextClasses = {
  appTitle: 'font-NanumMyeongjoExtraBold text-[45px] tracking-[0.22em] text-ink-night',
} as const;

/** (HomeScreen.tsx) */
export const HomeLayout = {
  characterImageSize: 125,
  emotionIconSize: 72,
  chevronIconWidth: 8,
  chevronIconHeight: 11,
  checkboxSize: 20,
  checkboxCheckWidth: 12,
  checkboxCheckHeight: 9,
  cardMinHeightEmpty: 120,
} as const;

/** NativeWind className — HomeLayout과 함께 유지 */
export const HomeTextClasses = {
  homeTitle: 'text-[25px] leading-8',
  supportSubtitle: 'text-label-muted',
} as const;

export const HomeSpeechBubbleClasses = {
  shell:
    'overflow-hidden rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[3px] border-2 border-speech-bubble-border bg-surface px-5 py-4',
} as const;

export const HomeCardClasses = {
  container: 'rounded-card border border-line bg-surface p-6',
  emptyState: 'min-h-[120px] items-center justify-center',
} as const;

/** NativeWind className — HomeLayout.checkboxSize(20) 등과 함께 유지 */
export const HomeActionClasses = {
  recommendedCheckbox: 'h-5 w-5',
  mindExploreCta: 'rounded-[10px] bg-mind-explore-btn px-4 py-2',
} as const;

/** 감정 별자리 (Home/Report 공용 차트) */
export const EmotionConstellationLayout = {
  chartHeight: 72,
  chartPaddingX: 10,
  chartPaddingY: 10,
  strokeWidth: 2,
  dotRadius: 4,
  activeDotRadius: 6,
  weekLabelTopGap: 10,
  intensityLabelAreaHeight: 28,
  intensityLabelOffset: 8,
  intensityLabelWidth: 28,
  intensityLabelHeight: 20,
  intensityLabelFontSize: 12,
  intensityLabelBorderWidth: 1,
  emptyStrokeDasharray: '4 4',
} as const;

/** SVG stroke/fill — className 미지원 */
export const ConstellationChartColors = {
  data: '#FFFFFF',
  empty: '#FFFFFF59',
  emptyDot: '#959595',
} as const;

/** SVG 월간 강도 라벨 — tailwind intensity-* 토큰과 동일 값 */
export const IntensityLabelSvgColors = {
  high: { bg: '#5DCAA51A', border: '#5DCAA533', text: '#5DCAA5' },
  mid: { bg: '#F0C0601A', border: '#F0C06033', text: '#F0C060' },
  low: { bg: '#E54A4D1A', border: '#E54A4D33', text: '#E54A4D' },
} as const;

/** NativeWind className — EmotionConstellationLayout과 함께 유지 */
export const EmotionConstellationClasses = {
  chartContainer: 'h-[72px]',
  chartContainerWithLabels: 'h-[100px]',
  weekLabelsRow: 'mt-[10px] flex-row justify-between',
} as const;

export const EmotionConstellationTextClasses = {
  weekday: 'text-weekday text-[12px] font-medium',
} as const;

/** 성장 리포트 (GrowthReportScreen) */
export const ReportLayout = {
  chevronIconWidth: 12,
  chevronIconHeight: 16,
} as const;

export const ReportCardClasses = {
  body: 'p-6',
  averageScoreEmpty: 'mt-4 min-h-[60px] items-center justify-center',
  averageScoreContent: 'mt-3 flex-row items-center gap-3',
} as const;

export const ReportSectionClasses = {
  constellationHeader: 'flex-row items-center gap-2 mb-4',
  constellationSection: 'gap-2',
  titleToDivider: 'mt-5',
  dividerToPeriodControls: 'mt-6',
  periodControls: 'gap-6',
  reportCards: 'mt-6 gap-5',
} as const;

export const ReportDividerClasses = {
  line: 'h-px w-full bg-line',
} as const;

export const ReportDateNavigatorClasses = {
  container: 'flex-row items-center justify-center gap-2',
  chevronButton: 'h-10 w-10 items-center justify-center',
} as const;

export const ReportTextClasses = {
  pageTitle: 'text-2xl font-semibold text-fg',
  cardTitle: 'text-xl font-semibold text-fg',
  checkinCount: 'text-label-muted text-sm',
  dateRange: 'text-label',
  emptyState: 'text-label text-sm',
  scoreValue: 'text-fg-default text-2xl font-semibold',
  scoreDenominator: 'text-score-denominator text-base',
} as const;

export const ReportTabClasses = {
  container: 'w-full flex-row gap-2',
  tab: 'flex-1 items-center rounded-report-tab border py-2',
  active: 'border-label-border bg-label-bg',
  inactive: 'border-report-tab-inactive-border bg-report-tab-inactive-bg',
  activeText: 'text-label-text',
  inactiveText: 'text-label',
} as const;

export const EmotionScoreBadgeClasses = {
  negative: 'border-emotion-negative-border bg-emotion-negative-bg',
  neutral: 'border-emotion-neutral-border bg-emotion-neutral-bg',
  positive: 'border-emotion-positive-border bg-emotion-positive-bg',
} as const;

export const EmotionScoreBadgeTextClasses = {
  negative: 'text-emotion-negative-text',
  neutral: 'text-emotion-neutral-text',
  positive: 'text-emotion-positive-text',
} as const;
