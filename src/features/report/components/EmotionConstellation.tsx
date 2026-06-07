import { EmotionConstellationChart } from '@/components/emotion/EmotionConstellationChart';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  formatCheckinCountLabel,
  REPORT_CARD_TITLES,
  REPORT_EMPTY_MESSAGE,
  type ReportPeriod,
} from '@/constants/report';
import {
  HomeCardClasses,
  ReportCardClasses,
  ReportSectionClasses,
  ReportTextClasses,
} from '@/constants/theme';
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
  isFuture: boolean;
  activeIndex: number;
}

function EmotionConstellationContent({
  period,
  points,
  isFuture,
  activeIndex,
}: EmotionConstellationContentProps) {
  if (period === 'week' && isFuture) {
    return (
      <View className={HomeCardClasses.emptyState}>
        <ThemedText type="small" className={ReportTextClasses.emptyState}>
          {REPORT_EMPTY_MESSAGE}
        </ThemedText>
      </View>
    );
  }

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
  const { points, checkinCount, isFuture } = useEmotionConstellationData(period, anchorDate);
  const activeIndex = getActiveChartIndex(period, anchorDate);

  const chart = (
    <EmotionConstellationContent
      period={period}
      points={points}
      isFuture={isFuture}
      activeIndex={activeIndex}
    />
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
        {!isFuture ? (
          <ThemedText type="small" className={ReportTextClasses.checkinCount}>
            {formatCheckinCountLabel(checkinCount)}
          </ThemedText>
        ) : null}
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
  const { points, isFuture } = useEmotionConstellationData('week', anchorDate);
  const activeIndex = getActiveChartIndex('week', anchorDate);

  return (
    <EmotionConstellationContent
      period="week"
      points={points}
      isFuture={isFuture}
      activeIndex={activeIndex}
    />
  );
}
