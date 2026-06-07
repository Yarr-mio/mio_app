import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  EMOTION_SCORE_MAX,
  REPORT_CARD_TITLES,
  REPORT_EMPTY_MESSAGE,
  type ReportPeriod,
} from '@/constants/report';
import { ReportCardClasses, ReportTextClasses } from '@/constants/theme';
import { EmotionScoreBadgeFromScore } from '@/features/report/components/EmotionScoreBadge';
import { useEmotionConstellationData } from '@/features/report/hooks/useEmotionConstellationData';
import { View } from 'react-native';

interface AverageEmotionScoreCardProps {
  period: ReportPeriod;
  anchorDate: Date;
}

export function AverageEmotionScoreCard({ period, anchorDate }: AverageEmotionScoreCardProps) {
  const { averageScore, isFuture } = useEmotionConstellationData(period, anchorDate);

  return (
    <BaseCard className={ReportCardClasses.body}>
      <ThemedText type="default" className="text-fg">
        {REPORT_CARD_TITLES.averageScore}
      </ThemedText>

      {isFuture ? (
        <View className={ReportCardClasses.averageScoreEmpty}>
          <ThemedText type="small" className={ReportTextClasses.emptyState}>
            {REPORT_EMPTY_MESSAGE}
          </ThemedText>
        </View>
      ) : (
        <View className={ReportCardClasses.averageScoreContent}>
          <View className="flex-row items-baseline">
            <ThemedText type="defaultBold" className={ReportTextClasses.scoreValue}>
              {averageScore}
            </ThemedText>
            <ThemedText type="default" className={ReportTextClasses.scoreDenominator}>
              {' '}
              /{EMOTION_SCORE_MAX}
            </ThemedText>
          </View>
          <EmotionScoreBadgeFromScore score={averageScore} />
        </View>
      )}
    </BaseCard>
  );
}
