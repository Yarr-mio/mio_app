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
  backHeaderIconSize: 20,
  backButtonSize: 35,
  topInsetExtra: 12,
} as const;

/** NativeWind className — HeaderLayout.backButtonSize(35)와 함께 유지 */
export const HeaderClasses = {
  backButton:
    'h-[35px] w-[35px] items-center justify-center rounded-full border border-line bg-surface',
  row: 'relative min-h-[35px] flex-row items-center justify-between',
  wrapper: 'px-5 pb-6',
  titleOverlay: 'pointer-events-none absolute inset-0 items-center justify-center px-12',
} as const;

/** 캐릭터 선택 카드 아이콘 슬롯 */
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

// 주요 액션 색상 — className 미지원 prop(ActivityIndicator color 등)에 사용
export const PrimaryColors = {
  DEFAULT: '#7060E0', // bg-primary / text-primary
  inactive: '#7060E060', // bg-primary-inactive — 비활성 상태 (~38% opacity)
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

/** BaseCard — bg-surface + border-line + rounded-base-card */
export const BaseCardLayout = {
  borderRadius: 15,
} as const;

/** 설정(더보기) 화면 레이아웃 */
export const SettingsLayout = {
  avatarSize: 48,
  characterImageSize: 28,
  userIconSize: 21,
  chevronWidth: 27,
  chevronHeight: 14,
  bottomArrowSize: 18,
} as const;

/** 시간 선택 모달 휠 레이아웃 */
export const TimePickerLayout = {
  wheelItemHeight: 44,
  wheelVisibleCount: 5,
} as const;

/** 닉네임 수정 화면 레이아웃 */
export const EditNicknameLayout = {
  avatarSize: 107,
  userIconSize: 47,
  maxLength: 10,
  clearButtonSize: 24,
  clearIconSize: 14,
} as const;

/** 회원가입 프로필 설정 화면 */
export const SignupInfoLayout = {
  nicknameMaxLength: 13,
  nicknameMinLength: 2,
} as const;

/** 회원가입 플로우 StepIndicator */
export const SignupFlowLayout = {
  totalSteps: 4,
  termsCurrentStep: 1,
  infoCurrentStep: 2,
  characterCurrentStep: 3,
  completeCurrentStep: 4,
} as const;

/** NativeWind className — 회원가입 온보딩 공통 헤더 영역 */
export const SignupFlowClasses = {
  stepIndicatorWrap: 'pt-4 mt-2',
} as const;

/** 캐릭터 선택 플로팅 CTA */
export const CharacterSelectFloatingCtaLayout = {
  enterDurationMs: 280,
  exitDurationMs: 200,
  listBottomPadding: 24,
  scrollBottomPaddingWithCta: 120,
  bottomOffsetExtra: 8,
  horizontalInset: 32,
} as const;

/** NativeWind className — CharacterSelectFloatingCtaLayout과 함께 유지 */
export const CharacterSelectFloatingCtaClasses = {
  floatingCta: 'absolute gap-2',
  screenContainer: 'flex-1 px-8',
  titleWrap: 'mt-10',
  subtitle: 'mt-3 text-subtitle',
  listWrap: 'mt-8 gap-3',
  cardRow: 'flex-row items-center gap-3 rounded-card border-2 py-6 pl-2 pr-4',
  cardTextWrap: 'flex-1 gap-2',
} as const;

/** 약관 동의 화면 레이아웃 */
export const TermsOfServiceLayout = {
  agreementCardHeight: 64,
} as const;

/** NativeWind className — TermsOfServiceLayout px 값과 동일하게 유지 */
export const TermsOfServiceClasses = {
  agreementCardHeight: 'h-[64px]',
  termList: 'mt-4 gap-2',
  privacyPolicyLink: 'mb-6 items-center',
  footer: 'mt-auto pt-4',
  footerError: 'mb-2',
  privacyPolicyLinkText: 'text-center text-subtitle underline',
} as const;

/** 약관 및 개인정보 문서 화면 */
export const LegalDocumentClasses = {
  root: 'flex-1',
  scroll: 'flex-1',
  scrollContent: 'gap-4 px-6 pb-10',
  heading: 'mt-2 text-fg',
  body: 'text-fg-soft leading-6',
  bulletRow: 'flex-row gap-2',
  bulletText: 'flex-1 text-fg-soft leading-6',
} as const;

/** 회원가입 완료 화면 레이아웃 */
export const SignupCompleteLayout = {
  profileImageSize: 107,
  profileTop: 101,
  titleTop: 56,
  highlightsTop: 119,
} as const;

/** NativeWind className — SignupCompleteLayout px 값과 동일하게 유지 */
export const SignupCompleteClasses = {
  profileTop: 'mt-[101px]',
  titleTop: 'mt-[56px]',
  highlightsTop: 'mt-[119px]',
} as const;

/** 하단 탭바 레이아웃 */
export const TabBarLayout = {
  iconSize: 24,
} as const;

/** 닉네임 중복 확인 버튼 — SignUpInfoScreen (기존 tailwind 색상 토큰 재사용) */
export const NicknameDuplicateCheckClasses = {
  default: 'rounded-lg border border-line bg-surface px-3 py-2',
  available: 'rounded-lg border border-emotion-positive-border bg-emotion-positive-bg px-3 py-2',
  unavailable: 'rounded-lg border border-intensity-low-border bg-intensity-low-bg px-3 py-2',
  defaultText: 'text-label',
  availableText: 'text-todo-completed',
  unavailableText: 'text-intensity-low-text',
  errorHint: 'text-intensity-low-text/80',
} as const;

/** NativeWind className — EditNicknameLayout.clearButtonSize(24)와 함께 유지 */
export const EditNicknameClasses = {
  clearButton:
    'h-[24px] w-[24px] items-center justify-center rounded-full border border-line bg-surface',
} as const;

/** 설정 화면 배경 선형 그라데이션  — SVG LinearGradient stopColor prop용 */
export const SettingsGradientColors = {
  top: '#0A0A1A',
  midUpper: '#060A1A',
  midLower: '#0D0D2B',
  bottom: '#08091F',
} as const;

/** 프로필/캐릭터 원형 아바타 — SVG prop용 */
export const AvatarCircleColors = {
  gradientStart: '#2A1F5A',
  gradientEnd: '#1A1535',
  stroke: '#9D7FEE59',
  icon: '#6E4B97',
} as const;

/** ProfileAvatarCircle SVG Circle 레이아웃 */
export const AvatarCircleLayout = {
  radiusInset: 1,
  strokeWidth: 1,
} as const;

/** React Native Switch 네이티브 prop용 */
export const SwitchColors = {
  trackFalse: 'rgba(255,255,255,0.2)',
  trackTrue: '#7060E0',
  thumb: '#FFFFFF',
  iosBackgroundColor: 'rgba(255,255,255,0.2)',
} as const;

/** AppModal */
export const AppModalLayout = {
  iconCircleSize: 56,
  iconSize: 23,
  buttonHeight: 56,
} as const;

export const AppModalDefaults = {
  cancelLabel: '취소',
} as const;

/** AppModal drop shadow — className 미지원, style prop용 (#0A0B16 75%) */
export const AppModalShadowStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#0A0B16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 0,
  },
  android: {
    elevation: 12,
    shadowColor: '#0A0B16',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
  },
  default: {},
});

/** 계정 모달(로그아웃/회원탈퇴) 아이콘 원 — SVG color / 동적 style prop용 */
export const AccountModalColors = {
  icon: '#F07878',
  iconBg: '#F078781A',
  iconBorder: '#F0787833',
};

/** 인증 화면 */
export const AuthTextClasses = {
  appTitle: 'font-NanumMyeongjoExtraBold text-[45px] tracking-[0.22em] text-ink-night',
} as const;

/** 스플래시 네이티브 JS 공통 */
export const SplashColors = {
  background: '#0D0D1A',
} as const;

export const SplashLayout = {
  logoWidth: 200,
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
  messageText: 'text-[12px] leading-[18px]',
} as const;

export const HomeCardClasses = {
  container: 'rounded-card border border-line bg-surface p-6',
  emptyState: 'min-h-[120px] items-center justify-center',
  titleRow: 'min-w-0 flex-1 flex-row items-center gap-2',
  titleCount: 'text-fg-default',
  // 추천 행동 카드 전용 최소 높이 92 기준은 todo 3개 렌더링 높이 행 20 셋과 간격 16 둘의 합
  recommendedActionsContent: 'min-h-[92px]',
  recommendedActionsEmptyState: 'min-h-[92px] items-center justify-center',
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
  intensityLabelWidth: 24,
  intensityLabelHeight: 20,
  intensityLabelFontSize: 12,
  intensityLabelBorderWidth: 1,
  emptyStrokeDasharray: '4 4',
  // 실선 구간 네이티브 strokeDasharray 잔존 방지
  solidStrokeDasharray: 'none',
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
  fullWidth: 'w-full',
  chartContainer: 'h-[72px]',
  chartContainerWithLabels: 'h-[100px]',
  weekLabelsRow: 'mt-[10px] flex-row justify-between',
} as const;

/** CharacterAvatar xs 사이즈 (22dp) */
export const CharacterAvatarLayout = {
  xs: 22,
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
  statsBody: 'flex-1 p-6',
  inCardBody: 'mt-3',
  averageScoreEmpty: 'mt-4 min-h-[60px] items-center justify-center',
  averageScoreContent: 'mt-3 flex-row items-center gap-3',
  averageScoreValueRow: 'flex-row items-baseline',
  averageScoreSlider: 'mt-3',
} as const;

export const ReportCharacterStoryClasses = {
  header: 'flex-row items-center gap-3',
  profileImage: 'shrink-0',
  headerText: 'min-w-0 flex-1 gap-1',
  divider: 'my-3',
  storyBody: 'w-full gap-1',
  storyText: 'w-full font-medium text-fg',
} as const;

export const ReportSectionClasses = {
  screenRoot: 'flex-1 bg-midnight',
  screenContainer: 'flex-1 bg-transparent',
  scrollContent: 'grow px-8 pb-8',
  headerSection: 'pt-6',
  chatButtonContainer: 'mb-6 px-8 pt-4',
  constellationHeader: 'flex-row items-center gap-2 mb-4',
  constellationSection: 'gap-2',
  statsRow: 'flex-row items-stretch gap-1.5',
  titleToDivider: 'mt-5',
  dividerToPeriodControls: 'mt-6',
  periodControls: 'gap-6',
  reportCards: 'mt-6 gap-1.5',
} as const;

/** SVG fill — className 미지원 */
export const ReportDistortionProgressColors = {
  fill: '#A594F9',
  background: '#FFFFFF14',
} as const;

export const ReportDistortionProgressLayout = {
  barHeight: 4,
  labelWidth: 64,
  countWidth: 32,
} as const;

export const ReportDistortionProgressClasses = {
  list: 'gap-2',
  row: 'flex-row items-center gap-1',
  label: 'w-16 shrink-0 text-sm text-fg',
  count: 'w-8 shrink-0 text-right text-sm text-label',
  barContainer: 'min-w-0 flex-1',
} as const;

/** SVG stroke/fill — className 미지원 */
export const ReportTodoDonutColors = {
  completed: '#98C890',
  partial: '#F0C060',
  failed: '#D9D9D9',
  track: '#FFFFFF14',
} as const;

export const ReportTodoDonutLayout = {
  size: 55,
  strokeWidth: 4,
  centerFontSize: 10,
} as const;

export const ReportTodoSummaryClasses = {
  content: 'flex-row items-center gap-3',
  chart: 'shrink-0',
  legend: 'min-w-0 flex-1 gap-1',
  legendItem: 'flex-row items-center gap-2',
  legendBullet: 'h-2 w-2 rounded-full',
  legendText: 'text-xs text-fg-default',
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
  bodyText: 'text-fg',
  inCardTitle: 'text-fg-default',
  checkinCount: 'text-label-muted text-sm',
  dateRange: 'text-label',
  emptyState: 'text-label text-sm',
  scoreValue: 'text-fg-default text-2xl font-semibold',
  scoreDenominator: 'text-score-denominator text-base',
  insufficientTitle: 'text-center text-xl font-semibold text-fg-default',
  insufficientSubtitle: 'text-center text-base font-normal text-weekday',
  insufficientCheckinCardTitle: 'text-base text-primary',
  insufficientGuideSubtitle: 'text-center text-base font-medium text-weekday',
  insufficientGuideItemLabel: 'shrink text-center text-xs font-medium text-weekday',
  pendingScheduleText: 'text-base font-medium text-weekday',
  pendingReasonTitle: 'text-base font-semibold text-label',
  pendingReasonBody: 'text-sm font-normal text-weekday',
  errorOutlineButtonText: 'text-xl font-bold text-fg',
  characterStoryTitle: 'text-character-story-title',
  characterStoryDate: 'text-label',
  characterStoryReadMore: 'text-weekday',
  coachingDirection: 'font-semibold text-character-story-title',
} as const;

export const ReportInsufficientDataLayout = {
  characterImageSize: 200,
  guideIconSize: 20,
} as const;

export const ReportInsufficientDataClasses = {
  container: 'mt-6 w-full items-center gap-9',
  heroSection: 'w-full items-center gap-4',
  cards: 'w-full gap-2',
  checkinCountRow: 'mt-3 flex-row items-baseline',
  guideIconCircle:
    'h-16 w-16 items-center justify-center rounded-full border border-line bg-surface',
  guideItemsRow: 'mt-5 flex-row justify-between gap-2',
  guideItem: 'min-w-0 flex-1 items-center gap-4',
  guideItemText: 'w-full shrink min-w-0 items-center',
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
  base: 'rounded-full border px-2.5 py-1',
  negative: 'border-emotion-negative-border bg-emotion-negative-bg',
  neutral: 'border-emotion-neutral-border bg-emotion-neutral-bg',
  positive: 'border-emotion-positive-border bg-emotion-positive-bg',
} as const;

export const EmotionScoreBadgeTextClasses = {
  negative: 'text-emotion-negative-text',
  neutral: 'text-emotion-neutral-text',
  positive: 'text-emotion-positive-text',
} as const;

export const IntensityLabelClasses = {
  high: 'border-intensity-high-border bg-intensity-high-bg',
  mid: 'border-intensity-mid-border bg-intensity-mid-bg',
  low: 'border-intensity-low-border bg-intensity-low-bg',
} as const;

export const IntensityLabelTextClasses = {
  high: 'text-intensity-high-text',
  mid: 'text-intensity-mid-text',
  low: 'text-intensity-low-text',
} as const;

export const IntensityLabelBaseClasses = 'rounded-full border px-2 py-0.5';

export const ReportPendingStateLayout = {
  characterImageSize: 200,
  clockIconSize: 40,
} as const;

export const ReportStateColors = {
  title: '#EEEAF8',
  subtitle: '#969696',
  emphasis: '#D9D9D9',
  outlineButtonBorder: 'rgba(255,255,255,0.30)',
  outlineButtonText: '#FFFFFF',
} as const;

export const ReportPendingStateClasses = {
  root: 'mt-6 w-full flex-1 items-center gap-8',
  topContent: 'w-full items-center',
  heroSection: 'w-full items-center gap-4',
  cardList: 'mt-9 w-full gap-2',
  scheduleCardRow: 'flex-row items-center gap-3',
  scheduleIcon: 'shrink-0 items-center justify-center',
  scheduleTextGroup: 'flex-1 gap-1',
  reasonCard: 'gap-2',
  notice: 'pb-2 text-center text-sm font-medium text-weekday',
  container: 'mt-6 min-h-[200px] items-center justify-center gap-3',
} as const;

export const ReportErrorStateLayout = {
  characterImageSize: 200,
  warnIconSize: 24,
} as const;

export const ReportErrorStateClasses = {
  root: 'mt-6 w-full flex-1 justify-between items-center',
  topContent: 'w-full items-center',
  heroSection: 'w-full items-center gap-4',
  buttonArea: 'mt-10 w-full',
  outlineButton:
    'mt-5 h-16 w-full items-center justify-center rounded-2xl border border-white/30 bg-transparent',
  helpCardWrapper: 'mt-8 w-full',
  helpCardBody: 'flex-row items-center gap-5 px-6 py-6',
  helpIconCircle: 'h-14 w-14 items-center justify-center rounded-full border bg-transparent',
  helpTextGroup: 'flex-1 gap-2',
} as const;

export const ReportFetchingOverlayClasses = {
  overlay: 'absolute inset-0 z-10 items-center justify-center bg-midnight/60',
} as const;

/** ScoreSlider 값 범위 및 눈금 */
export const ScoreSliderRange = {
  min: 0,
  max: 100,
  step: 1,
  tickValues: [0, 25, 50, 75, 100],
} as const;

/** ScoreSlider 네이티브 prop용 색상  */
export const ScoreSliderColors = {
  trackActive: '#7060E0',
  trackInactive: '#E8E8E8',
  thumb: '#7060E0',
} as const;

/** ScoreSlider 레이아웃 */
export const ScoreSliderLayout = {
  trackHeight: 9,
  thumbSize: 20,
  thumbTouchSize: 44,
  thumbLabelGap: 6,
  thumbLabelEstimatedHeight: 26,
  sliderAreaPaddingY: 12,
  tickLabelsMarginTop: 4,
} as const;

/** NativeWind className — ScoreSliderLayout px 값과 동일하게 유지 */
export const ScoreSliderClasses = {
  root: 'w-full',
  rootRelative: 'relative w-full',
  trackWrapper: 'w-full',
  sliderArea: 'relative justify-center overflow-visible',
  thumb: 'h-[20px] w-[20px] rounded-full bg-primary',
  thumbLabel: 'rounded-full border border-label-border bg-label-bg px-3 py-1',
  thumbLabelText: 'text-sm leading-5 font-medium text-label-text',
  tickLabels: 'mt-1 flex-row justify-between',
} as const;

/** Todo 화면(TodoScreen) — 날짜 네비게이터 */
export const TodoDateNavigatorLayout = {
  chevronIconWidth: 11,
  chevronIconHeight: 15,
} as const;

export const TodoDateNavigatorClasses = {
  container:
    'flex-row items-center justify-center self-center gap-3 rounded-card border border-line bg-surface',
  chevronButton: 'h-12 w-12 items-center justify-center',
  label: 'text-label',
} as const;

/** Todo 화면 — 할 일 카드 */
export const TodoCardClasses = {
  container: 'gap-3 rounded-card border border-line bg-surface p-6',
  title: 'text-fg-default',
  meta: 'text-label',
  actionsRow: 'mt-1 flex-row gap-2',
  list: 'gap-3',
} as const;

/** Todo 화면 — 상태 액션 버튼(완료/부분 완료/못함) */
export const TodoActionButtonClasses = {
  base: 'flex-1 items-center justify-center rounded-full border px-2 py-2.5',
  inactive: 'border-line bg-transparent',
  inactiveText: 'text-fg-default',
  selected: 'border-primary/40 bg-primary/20',
  selectedText: 'text-primary',
  disabled: 'opacity-40',
} as const;

export const TodoExpiredBadgeClasses = {
  container: 'items-center rounded-full border border-line bg-surface px-4 py-2.5',
  text: 'text-label',
} as const;
