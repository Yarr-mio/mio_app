import { ThemedText } from '@/components/themed/ThemedText';
import {
  CHECKIN_CONDITION_SCORE_MAX,
  CHECKIN_CONDITION_SCORE_MIN,
  formatIntensityLabelValue,
  getIntensityLabelLevel,
  type IntensityLabelLevel,
} from '@/constants/report';
import {
  ConstellationChartColors,
  EmotionConstellationClasses,
  EmotionConstellationLayout,
  EmotionConstellationTextClasses,
  IntensityLabelSvgColors,
} from '@/constants/theme';
import type { ConstellationChartPoint } from '@/types/report';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Polyline, Rect, Text as SvgText } from 'react-native-svg';

interface EmotionConstellationChartProps {
  points: ConstellationChartPoint[];
  activeIndex?: number;
  showIntensityLabels?: boolean;
}

interface ChartIntensityLabelProps {
  x: number;
  y: number;
  intensity: number;
}

interface ChartPoint {
  x: number;
  y: number;
  hasData: boolean;
}

function hasPointData(intensity: number | null | undefined): boolean {
  return intensity != null;
}

function intensityToNormalized(intensity: number | null | undefined): number {
  if (intensity == null) {
    return 0;
  }

  return (
    (intensity - CHECKIN_CONDITION_SCORE_MIN) /
    (CHECKIN_CONDITION_SCORE_MAX - CHECKIN_CONDITION_SCORE_MIN)
  );
}

function isSolidSegment(fromHasData: boolean, toHasData: boolean): boolean {
  return fromHasData && toHasData;
}

function ChartIntensityLabel({ x, y, intensity }: ChartIntensityLabelProps) {
  const level: IntensityLabelLevel = getIntensityLabelLevel(intensity);
  const colors = IntensityLabelSvgColors[level];
  const {
    intensityLabelWidth,
    intensityLabelHeight,
    intensityLabelAreaHeight,
    intensityLabelOffset,
    intensityLabelFontSize,
    intensityLabelBorderWidth,
  } = EmotionConstellationLayout;

  const rectX = x - intensityLabelWidth / 2;
  const rectY = y - intensityLabelOffset - intensityLabelAreaHeight;
  const textY = rectY + intensityLabelHeight / 2;

  return (
    <G>
      <Rect
        x={rectX}
        y={rectY}
        width={intensityLabelWidth}
        height={intensityLabelHeight}
        rx={intensityLabelHeight / 2}
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={intensityLabelBorderWidth}
      />
      <SvgText
        x={x}
        y={textY}
        fill={colors.text}
        fontSize={intensityLabelFontSize}
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {formatIntensityLabelValue(intensity)}
      </SvgText>
    </G>
  );
}

export function EmotionConstellationChart({
  points,
  activeIndex = points.length - 1,
  showIntensityLabels = false,
}: EmotionConstellationChartProps) {
  const [width, setWidth] = useState(0);

  const {
    chartHeight,
    chartPaddingX,
    chartPaddingY,
    intensityLabelAreaHeight,
    strokeWidth,
    dotRadius,
    activeDotRadius,
    emptyStrokeDasharray,
  } = EmotionConstellationLayout;

  const labelAreaHeight = showIntensityLabels ? intensityLabelAreaHeight : 0;
  const svgHeight = labelAreaHeight + chartHeight;
  const chartTop = labelAreaHeight;

  const normalized = points.map((point) => intensityToNormalized(point.intensity));
  const innerWidth = Math.max(0, width - chartPaddingX * 2);
  const innerHeight = Math.max(0, chartHeight - chartPaddingY * 2);
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const chartPoints: ChartPoint[] = normalized.map((value, index) => {
    const x = chartPaddingX + stepX * index;
    const y = chartTop + chartPaddingY + innerHeight * (1 - value);
    return { x, y, hasData: hasPointData(points[index].intensity) };
  });

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} className="w-full">
      <View
        className={
          showIntensityLabels
            ? EmotionConstellationClasses.chartContainerWithLabels
            : EmotionConstellationClasses.chartContainer
        }
      >
        {width > 0 ? (
          <Svg width={width} height={svgHeight}>
            {showIntensityLabels
              ? chartPoints.map((point, index) => {
                  const intensity = points[index].intensity;
                  if (intensity == null) {
                    return null;
                  }

                  return (
                    <ChartIntensityLabel
                      key={`intensity-label-${points[index].label}`}
                      x={point.x}
                      y={point.y}
                      intensity={intensity}
                    />
                  );
                })
              : null}

            {chartPoints.slice(0, -1).map((fromPoint, index) => {
              const toPoint = chartPoints[index + 1];
              const solid = isSolidSegment(fromPoint.hasData, toPoint.hasData);

              return (
                <Polyline
                  key={`segment-${index}`}
                  points={`${fromPoint.x},${fromPoint.y} ${toPoint.x},${toPoint.y}`}
                  fill="none"
                  stroke={solid ? ConstellationChartColors.data : ConstellationChartColors.empty}
                  strokeWidth={strokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={solid ? undefined : emptyStrokeDasharray}
                />
              );
            })}

            {chartPoints.map((point, index) => {
              const radius = index === activeIndex ? activeDotRadius : dotRadius;

              if (point.hasData) {
                return (
                  <Circle
                    key={`dot-${points[index].label}`}
                    cx={point.x}
                    cy={point.y}
                    r={radius}
                    fill={ConstellationChartColors.data}
                  />
                );
              }

              return (
                <Circle
                  key={`dot-${points[index].label}`}
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={ConstellationChartColors.emptyDot}
                />
              );
            })}
          </Svg>
        ) : null}
      </View>

      <View className={EmotionConstellationClasses.weekLabelsRow}>
        {points.map((point) => (
          <ThemedText
            key={point.label}
            type="small"
            className={EmotionConstellationTextClasses.weekday}
          >
            {point.label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}
