import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { REPORT_CARD_TITLES } from '@/constants/report';
import { ReportCardClasses, ReportSectionClasses, ReportTextClasses } from '@/constants/theme';
import { View } from 'react-native';

interface ReportCoachingSectionProps {
  coachingDirection: string;
}

export function ReportCoachingSection({ coachingDirection }: ReportCoachingSectionProps) {
  return (
    <View className={ReportSectionClasses.constellationSection}>
      <ThemedText className={ReportTextClasses.cardTitle}>{REPORT_CARD_TITLES.coaching}</ThemedText>
      <BaseCard className={ReportCardClasses.body}>
        <ThemedText type="default" className="text-fg">
          {coachingDirection}
        </ThemedText>
      </BaseCard>
    </View>
  );
}
