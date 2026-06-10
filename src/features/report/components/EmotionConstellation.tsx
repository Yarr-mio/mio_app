import { EmotionConstellationChart } from '@/components/emotion/EmotionConstellationChart';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { formatCheckinCountLabel, REPORT_CARD_TITLES, type ReportPeriod } from '@/constants/report';
import { ReportCardClasses, ReportSectionClasses, ReportTextClasses } from '@/constants/theme';
import {
  getActiveChartIndex,
  useEmotionConstellationData,
} from '@/features/report/hooks/useEmotionConstellationData';
import type { ConstellationChartPoint } from '@/types/report';
import { View } from 'react-native';

interface EmotionConstellationProps {
  period: ReportPeriod;
  anchorDate: Date;
  showCard?: boolean;
}

interface EmotionConstellationContentProps {
  period: ReportPeriod;
  points: ConstellationChartPoint[];
  activeIndex: number;
}

function EmotionConstellationContent({
  period,
  points,
  activeIndex,
}: EmotionConstellationContentProps) {
  const isMonthly = period === 'month';

  return (
    <EmotionConstellationChart
      key={isMonthly ? 'month' : 'week'}
      points={points}
      activeIndex={activeIndex}
      showIntensityLabels={isMonthly}
    />
  );
}

export function EmotionConstellation({
  period,
  anchorDate,
  showCard = true,
}: EmotionConstellationProps) {
  const { points, checkinCount } = useEmotionConstellationData(period, anchorDate);
  const activeIndex = getActiveChartIndex(period, anchorDate);

  const chart = (
    <EmotionConstellationContent period={period} points={points} activeIndex={activeIndex} />
  );

  if (!showCard) {
    return chart;
  }

  return (
    <View className={ReportSectionClasses.constellationSection}>
      <View className={ReportSectionClasses.constellationHeader}>
        <ThemedText className={ReportTextClasses.cardTitle}>
          {REPORT_CARD_TITLES.constellation}
        </ThemedText>
        <ThemedText type="small" className={ReportTextClasses.checkinCount}>
          {formatCheckinCountLabel(checkinCount)}
        </ThemedText>
      </View>
      <BaseCard className={ReportCardClasses.body}>{chart}</BaseCard>
    </View>
  );
}

interface EmotionConstellationPreviewProps {
  anchorDate?: Date;
}

export function EmotionConstellationPreview({
  anchorDate = new Date(),
}: EmotionConstellationPreviewProps) {
  const { points } = useEmotionConstellationData('week', anchorDate);
  const activeIndex = getActiveChartIndex('week', anchorDate);

  return <EmotionConstellationContent period="week" points={points} activeIndex={activeIndex} />;
}
