/** @type {import('tailwindcss').Config} */
const NOTO_WEIGHT_CLASSES = [
  ['thin', 'thin'],
  ['extralight', 'extralight'],
  ['light', 'light'],
  ['normal', 'sans'],
  ['medium', 'medium'],
  ['semibold', 'semibold'],
  ['bold', 'bold'],
  ['extrabold', 'extrabold'],
  ['black', 'black'],
];

/** font-medium 등을 fontWeight 대신 NotoSansKR fontFamily로 매핑 */
function notoFontWeightPlugin({ addUtilities, theme }) {
  const utilities = {};
  for (const [weightClass, familyKey] of NOTO_WEIGHT_CLASSES) {
    const fontFamily = theme(`fontFamily.${familyKey}`);
    if (!fontFamily) continue;
    const name = Array.isArray(fontFamily) ? fontFamily[0] : fontFamily;
    utilities[`.font-${weightClass}`] = { fontFamily: name };
  }
  addUtilities(utilities, { respectImportant: true });
}

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['NotoSansKR-Regular'], // font-sans
        thin: ['NotoSansKR-Thin'], // font-thin
        extralight: ['NotoSansKR-ExtraLight'], // font-extralight
        light: ['NotoSansKR-Light'], // font-light
        medium: ['NotoSansKR-Medium'], // font-medium
        semibold: ['NotoSansKR-SemiBold'], // font-semibold
        bold: ['NotoSansKR-Bold'], // font-bold
        extrabold: ['NotoSansKR-ExtraBold'], // font-extrabold
        black: ['NotoSansKR-Black'], // font-black
        mono: ['NotoSansKR-Regular'], // font-mono
        NanumMyeongjoExtraBold: ['NanumMyeongjoExtraBold'], // font-NanumMyeongjoExtraBold
      },
      borderRadius: {
        card: '20px', // rounded-card — 온보딩 선택/소개 박스
        'base-card': '20px', // rounded-base-card — BaseCard 컨테이너
        'report-tab': '10px', // rounded-report-tab — 성장 리포트 주간/월간 탭
      },
      colors: {
        // Light 기본값 / dark: 접두사로 다크모드 적용
        // 배경 계열
        canvas: '#ffffff', // bg-canvas          (background)
        'canvas-night': '#000000', // dark:bg-canvas-night
        panel: '#F0F0F3', // bg-panel            (backgroundElement)
        'panel-night': '#212225', // dark:bg-panel-night
        chip: '#E0E1E6', // bg-chip             (backgroundSelected)
        'chip-night': '#2E3135', // dark:bg-chip-night
        // 텍스트 계열
        ink: '#000000', // text-ink            (text)
        'ink-night': '#ffffff', // dark:text-ink-night
        'ink-dim': '#60646C', // text-ink-dim        (textSecondary)
        'ink-dim-night': '#B0B4BA', // dark:text-ink-dim-night

        // ── 다크 스페이스 테마 ──────────────────────────────────────
        // 앱 메인 배경
        midnight: '#0D0D1A', // bg-midnight / text-midnight
        'tab-bar': '#04030A', // bg-tab-bar — 하단 탭바 (constants/theme TabBarColors.background와 동일 유지)

        // 기본 카드 배경 (말풍선 및 페이지별 카드/박스 배경)
        surface: '#FFFFFF0D', // bg-surface      (white/5)
        'surface-md': '#FFFFFF1A', // bg-surface-md  (white/10)
        'surface-lg': '#FFFFFF26', // bg-surface-lg  (white/15)

        // 경계선
        line: '#FFFFFF1A', // border-line    (white/10)
        'line-md': '#FFFFFF33', // border-line-md (white/20)

        // 텍스트 계층 (어두운 배경 위 흰색 계열)
        fg: {
          DEFAULT: '#FFFFFF', // text-fg        (white)
          default: '#EEEAF8', // text-fg-default — 앱 디폴트 텍스트
          high: '#FFFFFFE6', // text-fg-high   (white/90)
          sub: '#FFFFFFCC', // text-fg-sub    (white/80)
          soft: '#FFFFFFB3', // text-fg-soft   (white/70)
          dim: '#FFFFFF99', // text-fg-dim    (white/60)
          muted: '#FFFFFF80', // text-fg-muted  (white/50)
          faint: '#FFFFFF66', // text-fg-faint  (white/40)
          ghost: '#FFFFFF4D', // text-fg-ghost  (white/30)
        },

        // 폼 라벨/비활성 칩 등 기본 보조 텍스트
        label: '#D9D9D9', // text-label
        'label-muted': '#D9D9D9B3', // text-label-muted — label 70% (TabBarLabelColors.inactive과 동일)

        // 홈 캐릭터 말풍선 (glass + fallback)
        'speech-bubble-bg': '#FFFFFF0F', // bg-speech-bubble-bg — white 6%
        'speech-bubble-border': '#BABABA1A', // border-speech-bubble-border — #BABABA 10%

        // 상태 색상 (opacity modifier와 함께 사용: bg-success/20, border-success/40)
        success: '#4ade80', // text-success, bg-success/20, border-success/40
        danger: '#f87171', // text-danger, text-danger/70, bg-danger/10, border-danger/20

        // 링크 / 강조색
        link: '#3c87f7', // text-link

        // 주요 액션 색상
        primary: '#7060E0', // bg-primary / text-primary

        subtitle: '#959595', // text-subtitle — 페이지 서브 텍스트
        accent: '#9D7FEE', // 강조색 (서브 탭 선택 시 base)

        // 홈화면: 감정 별자리 요일 라벨
        weekday: '#969696', // text-weekday

        // 홈화면: 마음 탐색 CTA 버튼
        'mind-explore-btn': '#3D2875', // bg-mind-explore-btn

        // ── 서브 버튼 탭 (선택형 칩) ─────────────────
        // 선택됨: #9D7FEE 10% 배경 + 50% stroke = bg-sub-tab-selected-bg, border-sub-tab-selected-border
        'sub-tab-selected-bg': '#9D7FEE1A',
        'sub-tab-selected-border': '#9D7FEE80',
        // 비활성 (step2Concern 제외 공통): #FFFFFF 5% 배경 + 10% stroke
        // = bg-sub-tab-inactive-bg, border-sub-tab-inactive-border
        'sub-tab-inactive-bg': '#FFFFFF0D',
        'sub-tab-inactive-border': '#FFFFFF1A',
        // 비활성 (step2Concern 전용): #E4E4E4 stroke, 배경 없음 = border-sub-tab-concern-inactive-border
        'sub-tab-concern-inactive-border': '#E4E4E4',

        // 온보딩
        'progress-inactive': '#E9E9E9', // bg-progress-inactive — 진행 바 미완료
        'step-muted': '#9CA3AF', // text-step-muted — 단계 표시 (n/3)
        'onboarding-surface': '#131238', // bg-onboarding-surface — 강도 슬라이더 박스
        'onboarding-border': '#2C295F', // border-onboarding-border
        badge: '#5A5490', // text-badge — [필수] / [선택]
        'btn-disabled': '#9C9C9C', // bg-btn-disabled

        // Label (components/ui/Label.tsx)
        'label-bg': '#9D7FEE33', // bg-label-bg — #9D7FEE 20%
        'label-border': '#D8D0F833', // border-label-border — #D8D0F8 20%
        'label-text': '#9F92F3', // text-label-text

        // 성장 리포트 — 기간 탭 (비활성)
        'report-tab-inactive-bg': '#FFFFFF1A', // bg-report-tab-inactive-bg — white 10%
        'report-tab-inactive-border': '#FFFFFF33', // border-report-tab-inactive-border — white 20%

        // 성장 리포트 — 월간 감정 강도 라벨
        'intensity-high-bg': '#5DCAA51A',
        'intensity-high-border': '#5DCAA533',
        'intensity-high-text': '#5DCAA5',
        'intensity-mid-bg': '#F0C0601A',
        'intensity-mid-border': '#F0C06033',
        'intensity-mid-text': '#F0C060',
        'intensity-low-bg': '#E54A4D1A',
        'intensity-low-border': '#E54A4D33',
        'intensity-low-text': '#E54A4D',

        // 성장 리포트 — 평균 감정 점수 뱃지
        'emotion-negative-bg': '#E54A4D1A',
        'emotion-negative-border': '#E54A4D33',
        'emotion-negative-text': '#E54A4DE5',
        'emotion-neutral-bg': '#F0C0601A',
        'emotion-neutral-border': '#F0C06033',
        'emotion-neutral-text': '#F0C060E5',
        'emotion-positive-bg': '#98C8901A',
        'emotion-positive-border': '#98C89033',
        'emotion-positive-text': '#98C890E5',

        // 성장 리포트 — 점수 보조 텍스트
        'score-denominator': '#969696', // text-score-denominator — /100

        // 성장 리포트 — 인지 왜곡 프로그레스 바
        'distortion-progress-fill': '#A594F9', // bg-distortion-progress-fill
        'distortion-progress-bg': '#FFFFFF14', // bg-distortion-progress-bg — white 8%

        // 성장 리포트 — TO-DO 도넛 차트
        'todo-completed': '#98C890',
        'todo-partial': '#F0C060',
        'todo-failed': '#D9D9D9',

        //로그인 버튼 (애플/카카오)
        kakao: '#FEE500', // bg-kakao
        'kakao-text': '#000000D9', // text-kakao
        apple: '#FFFFFF', // bg-apple
        'apple-text': '#000000', // text-apple
      },
    },
  },
  plugins: [notoFontWeightPlugin],
};
