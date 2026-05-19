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
      },
    },
  },
};
