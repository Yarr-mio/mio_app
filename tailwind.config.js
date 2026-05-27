/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
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
        accent: '#9D7FEE', // bg-accent/5, border-accent/10, bg-accent/10, border-accent/50
        badge: '#5A5490', // text-badge — [필수] / [선택]
        'btn-disabled': '#9C9C9C', // bg-btn-disabled
        //로그인 버튼 (애플/카카오)
        kakao: '#FEE500', // bg-kakao
        'kakao-text': '#000000D9', // text-kakao
        apple: '#FFFFFF', // bg-apple
        'apple-text': '#000000', // text-apple
      },
    },
  },
};
