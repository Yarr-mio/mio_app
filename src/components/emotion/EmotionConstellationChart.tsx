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
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

interface EmotionConstellationChartProps {
  points: ConstellationChartPoint[];
  activeIndex?: number;
  showIntensityLabels?: boolean;
}

interface IntensityLabelLayout {
  rectX: number;
  rectY: number;
  textX: number;
  textY: number;
}

interface ChartIntensityLabelProps {
  x: number;
  y: number;
  svgWidth: number;
  avgConditionScore: number;
}

function getIntensityLabelLayout(x: number, y: number, svgWidth: number): IntensityLabelLayout {
  const {
    intensityLabelWidth,
    intensityLabelHeight,
    intensityLabelAreaHeight,
    intensityLabelOffset,
  } = EmotionConstellationLayout;

  const halfWidth = intensityLabelWidth / 2;
  const clampedX = Math.min(Math.max(x, halfWidth), svgWidth - halfWidth);
  const rectX = clampedX - halfWidth;
  const rectY = y - intensityLabelOffset - intensityLabelAreaHeight;

  return {
    rectX,
    rectY,
    textX: clampedX,
    textY: rectY + intensityLabelHeight / 2,
  };
}

interface ChartPoint {
  x: number;
  y: number;
  hasData: boolean;
}

function hasPointData(avgConditionScore: number | null | undefined): boolean {
  // 점선 실선 판단은 avg_condition_score null 여부만 사용
  return avgConditionScore != null;
}

// avg_condition_score 1-5는 감정 별자리 차트 전용. avg_emotion_score 0-100와 혼용 금지
function conditionScoreToNormalized(avgConditionScore: number | null | undefined): number {
  if (avgConditionScore == null) {
    return 0;
  }

  const clampedScore = Math.min(
    CHECKIN_CONDITION_SCORE_MAX,
    Math.max(CHECKIN_CONDITION_SCORE_MIN, avgConditionScore)
  );

  return (
    (clampedScore - CHECKIN_CONDITION_SCORE_MIN) /
    (CHECKIN_CONDITION_SCORE_MAX - CHECKIN_CONDITION_SCORE_MIN)
  );
}

function isSolidSegment(fromHasData: boolean, toHasData: boolean): boolean {
  return fromHasData && toHasData;
}

function getSegmentStrokeDasharray(solid: boolean): string {
  return solid
    ? EmotionConstellationLayout.solidStrokeDasharray
    : EmotionConstellationLayout.emptyStrokeDasharray;
}

function ChartIntensityLabel({ x, y, svgWidth, avgConditionScore }: ChartIntensityLabelProps) {
  const level: IntensityLabelLevel = getIntensityLabelLevel(avgConditionScore);
  const colors = IntensityLabelSvgColors[level];
  const {
    intensityLabelWidth,
    intensityLabelHeight,
    intensityLabelFontSize,
    intensityLabelBorderWidth,
  } = EmotionConstellationLayout;

  const { rectX, rectY, textX, textY } = getIntensityLabelLayout(x, y, svgWidth);

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
        x={textX}
        y={textY}
        fill={colors.text}
        fontSize={intensityLabelFontSize}
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {formatIntensityLabelValue(avgConditionScore)}
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
  } = EmotionConstellationLayout;

  const labelAreaHeight = showIntensityLabels ? intensityLabelAreaHeight : 0;
  const svgHeight = labelAreaHeight + chartHeight;
  const chartTop = labelAreaHeight;

  const normalized = points.map((point) => conditionScoreToNormalized(point.avg_condition_score));
  const innerWidth = Math.max(0, width - chartPaddingX * 2);
  const innerHeight = Math.max(0, chartHeight - chartPaddingY * 2);
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const chartPoints: ChartPoint[] = normalized.map((value, index) => {
    const x = chartPaddingX + stepX * index;
    const y = chartTop + chartPaddingY + innerHeight * (1 - value);
    return { x, y, hasData: hasPointData(points[index].avg_condition_score) };
  });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={EmotionConstellationClasses.fullWidth}
    >
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
                  const avgConditionScore = points[index].avg_condition_score;
                  if (avgConditionScore == null) {
                    return null;
                  }

                  return (
                    <ChartIntensityLabel
                      key={`intensity-label-${points[index].label}`}
                      x={point.x}
                      y={point.y}
                      svgWidth={width}
                      avgConditionScore={avgConditionScore}
                    />
                  );
                })
              : null}

            {chartPoints.slice(0, -1).map((fromPoint, index) => {
              const toPoint = chartPoints[index + 1];
              const solid = isSolidSegment(fromPoint.hasData, toPoint.hasData);

              return (
                <Line
                  key={`segment-${index}`}
                  x1={fromPoint.x}
                  y1={fromPoint.y}
                  x2={toPoint.x}
                  y2={toPoint.y}
                  stroke={solid ? ConstellationChartColors.data : ConstellationChartColors.empty}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={getSegmentStrokeDasharray(solid)}
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
