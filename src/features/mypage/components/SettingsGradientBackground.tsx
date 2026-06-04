import { SettingsGradientColors } from '@/constants/theme';
import { useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export function SettingsGradientBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="settingsBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={SettingsGradientColors.top} />
          <Stop offset="44%" stopColor={SettingsGradientColors.midUpper} />
          <Stop offset="50%" stopColor={SettingsGradientColors.midLower} />
          <Stop offset="100%" stopColor={SettingsGradientColors.bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#settingsBg)" />
    </Svg>
  );
}
