import { FgColors, ReportTodoDonutColors, ReportTodoDonutLayout } from '@/constants/theme';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface TodoDonutSegment {
  value: number;
  color: string;
}

interface TodoDonutChartProps {
  segments: TodoDonutSegment[];
  total: number;
  centerLabel: string;
}

export function TodoDonutChart({ segments, total, centerLabel }: TodoDonutChartProps) {
  const { size, strokeWidth, centerFontSize } = ReportTodoDonutLayout;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentTotal = total > 0 ? total : 1;

  let cumulativeRatio = 0;

  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={ReportTodoDonutColors.track}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {segments.map((segment, index) => {
        if (segment.value <= 0) {
          return null;
        }

        const ratio = segment.value / segmentTotal;
        const strokeDasharray = `${circumference * ratio} ${circumference}`;
        const rotation = -90 + cumulativeRatio * 360;
        cumulativeRatio += ratio;

        return (
          <G
            key={`todo-donut-segment-${index}`}
            rotation={rotation}
            origin={`${center}, ${center}`}
          >
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeLinecap="butt"
            />
          </G>
        );
      })}
      <SvgText
        x={center}
        y={center + centerFontSize / 3}
        fill={FgColors.onDefault}
        fontSize={centerFontSize}
        fontWeight="600"
        textAnchor="middle"
      >
        {centerLabel}
      </SvgText>
    </Svg>
  );
}
