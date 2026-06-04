import { Image } from 'expo-image';
import { useWindowDimensions } from 'react-native';

const HOME_REPORT_BACKGROUND = require('@/assets/images/background/home_report_background.png');

export function HomeReportBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <Image
      source={HOME_REPORT_BACKGROUND}
      contentFit="cover"
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
    />
  );
}
