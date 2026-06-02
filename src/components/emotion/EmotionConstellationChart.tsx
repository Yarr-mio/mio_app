import { ThemedText } from '@/components/themed/ThemedText';
import {
  EmotionConstellationLayout,
  EmotionConstellationTextClasses,
  FgColors,
} from '@/constants/theme';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

interface EmotionConstellationChartProps {
  values: number[];
  labels: string[];
  activeIndex?: number;
}

function normalizeValues(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => 0.5);
  }
  return values.map((v) => (v - min) / (max - min));
}

export function EmotionConstellationChart({
  values,
  labels,
  activeIndex = values.length - 1,
}: EmotionConstellationChartProps) {
  const [width, setWidth] = useState(0);

  const normalized = normalizeValues(values);
  const height = EmotionConstellationLayout.chartHeight;
  const paddingX = EmotionConstellationLayout.chartPaddingX;
  const paddingY = EmotionConstellationLayout.chartPaddingY;

  const innerWidth = Math.max(0, width - paddingX * 2);
  const innerHeight = Math.max(0, height - paddingY * 2);
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  const points = normalized.map((v, i) => {
    const x = paddingX + stepX * i;
    const y = paddingY + innerHeight * (1 - v);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} className="w-full">
      <View style={{ height }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={FgColors.default}
              strokeWidth={EmotionConstellationLayout.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <Circle
                key={`${i}-${p.x}-${p.y}`}
                cx={p.x}
                cy={p.y}
                r={
                  i === activeIndex
                    ? EmotionConstellationLayout.activeDotRadius
                    : EmotionConstellationLayout.dotRadius
                }
                fill={FgColors.default}
              />
            ))}
          </Svg>
        ) : null}
      </View>

      <View
        className="flex-row justify-between"
        style={{ marginTop: EmotionConstellationLayout.weekLabelTopGap }}
      >
        {labels.map((label, idx) => (
          <ThemedText
            key={`${label}-${idx}`}
            type="small"
            className={EmotionConstellationTextClasses.weekday}
          >
            {label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}
