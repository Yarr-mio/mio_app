import { ThemedText } from '@/components/themed/ThemedText';
import {
  EMOTION_SCORE_LABELS,
  getEmotionScoreLevel,
  type EmotionScoreLevel,
} from '@/constants/report';
import { EmotionScoreBadgeClasses, EmotionScoreBadgeTextClasses } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface EmotionScoreBadgeProps {
  level: EmotionScoreLevel;
}

export function EmotionScoreBadge({ level }: EmotionScoreBadgeProps) {
  return (
    <View className={cn('rounded-full border px-2.5 py-0.5', EmotionScoreBadgeClasses[level])}>
      <ThemedText type="smallMedium" className={EmotionScoreBadgeTextClasses[level]}>
        {EMOTION_SCORE_LABELS[level]}
      </ThemedText>
    </View>
  );
}

interface EmotionScoreBadgeFromScoreProps {
  score: number;
}

export function EmotionScoreBadgeFromScore({ score }: EmotionScoreBadgeFromScoreProps) {
  return <EmotionScoreBadge level={getEmotionScoreLevel(score)} />;
}
