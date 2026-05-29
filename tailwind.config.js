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

        // 유리 질감 서피스 (어두운 배경 위의 반투명 흰색 레이어)
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

        // 상태 색상 (opacity modifier와 함께 사용: bg-success/20, border-success/40)
        success: '#4ade80', // text-success, bg-success/20, border-success/40
        danger: '#f87171', // text-danger, text-danger/70, bg-danger/10, border-danger/20

        // 링크 / 강조색
        link: '#3c87f7', // text-link

        // 주요 액션 색상
        primary: '#7060E0', // bg-primary / text-primary

        // 회원가입 페이지
        subtitle: '#959595', // text-subtitle — 페이지 서브 텍스트
        accent: '#9D7FEE', // 강조색 (서브 탭 선택 시 base)

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
