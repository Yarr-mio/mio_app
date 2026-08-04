import { EmotionConstellationChart } from '@/components/emotion/EmotionConstellationChart';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { formatCheckinCountLabel, REPORT_CARD_TITLES, type ReportPeriod } from '@/constants/report';
import {
  ButtonColors,
  ReportCardClasses,
  ReportPendingStateClasses,
  ReportSectionClasses,
  ReportTextClasses,
} from '@/constants/theme';
import { useEmotionConstellationData } from '@/features/report/hooks/useEmotionConstellationData';
import type { ConstellationChartPoint } from '@/types/report';
import { toKstDate } from '@/utils/date';
import { getActiveChartIndex } from '@/utils/report';
import { ActivityIndicator, View } from 'react-native';

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
  const { points, checkinCount, isLoading } = useEmotionConstellationData(period, anchorDate, {
    enabled: true,
  });
  const activeIndex = getActiveChartIndex(period, anchorDate);

  const chart = isLoading ? (
    <View className={ReportPendingStateClasses.container}>
      <ActivityIndicator color={ButtonColors.spinnerLight} />
    </View>
  ) : (
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

export function EmotionConstellationPreview({ anchorDate }: EmotionConstellationPreviewProps) {
  // 리포트 화면과 동일 KST 앵커 사용 로컬 Date 기본값 주간 경계 차이 방지
  const resolvedAnchorDate = toKstDate(anchorDate ?? new Date());
  const { points } = useEmotionConstellationData('week', resolvedAnchorDate);
  const activeIndex = getActiveChartIndex('week', resolvedAnchorDate);

  return <EmotionConstellationContent period="week" points={points} activeIndex={activeIndex} />;
}
