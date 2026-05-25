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

        // 스플래시 등 항상 다크 배경을 쓰는 화면용 (Colors.dark.background) 임시로 추가!
        'background-dark': '#000000',
        kakao: '#FEE500', // bg-kakao
        'kakao-text': '#000000D9', // text-kakao
        apple: '#FFFFFF', // bg-apple
        'apple-text': '#000000', // text-apple

        // 회원가입·약관 동의 등 항상 다크 배경 화면용
        midnight: '#050508',
        primary: '#7B61FF',
      },
    },
  },
};
