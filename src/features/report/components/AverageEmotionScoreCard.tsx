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
  const { avgEmotionScore, isFuture } = useEmotionConstellationData(period, anchorDate);

  return (
    <BaseCard className={ReportCardClasses.body}>
      <ThemedText type="default" className={ReportTextClasses.inCardTitle}>
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
            {/* avg_emotion_score (0~100): 리포트 집계용. avg_condition_score(1~5)와 혼용 금지 */}
            <ThemedText type="defaultBold" className={ReportTextClasses.scoreValue}>
              {avgEmotionScore}
            </ThemedText>
            <ThemedText type="default" className={ReportTextClasses.scoreDenominator}>
              {' '}
              /{EMOTION_SCORE_MAX}
            </ThemedText>
          </View>
          <EmotionScoreBadgeFromScore score={avgEmotionScore} />
        </View>
      )}
    </BaseCard>
  );
}
