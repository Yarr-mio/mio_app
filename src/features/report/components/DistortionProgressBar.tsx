import {
  ReportDistortionProgressClasses,
  ReportDistortionProgressColors,
  ReportDistortionProgressLayout,
} from '@/constants/theme';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface DistortionProgressBarProps {
  ratio: number;
}

export function DistortionProgressBar({ ratio }: DistortionProgressBarProps) {
  const { barHeight } = ReportDistortionProgressLayout;
  const [barWidth, setBarWidth] = useState(0);
  const clampedRatio = Math.min(Math.max(ratio, 0), 1);
  const fillWidth = barWidth * clampedRatio;
  const cornerRadius = barHeight / 2;

  return (
    <View
      className={ReportDistortionProgressClasses.barContainer}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
    >
      {barWidth > 0 ? (
        <Svg width={barWidth} height={barHeight}>
          <Rect
            x={0}
            y={0}
            width={barWidth}
            height={barHeight}
            fill={ReportDistortionProgressColors.background}
            rx={cornerRadius}
            ry={cornerRadius}
          />
          {fillWidth > 0 ? (
            <Rect
              x={0}
              y={0}
              width={fillWidth}
              height={barHeight}
              fill={ReportDistortionProgressColors.fill}
              rx={cornerRadius}
              ry={cornerRadius}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
