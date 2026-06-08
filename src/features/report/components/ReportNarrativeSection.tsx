import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { REPORT_CARD_TITLES } from '@/constants/report';
import { ReportCardClasses, ReportSectionClasses, ReportTextClasses } from '@/constants/theme';
import { View } from 'react-native';

interface ReportNarrativeSectionProps {
  narrative: string;
}

export function ReportNarrativeSection({ narrative }: ReportNarrativeSectionProps) {
  return (
    <View className={ReportSectionClasses.constellationSection}>
      <ThemedText className={ReportTextClasses.cardTitle}>
        {REPORT_CARD_TITLES.narrative}
      </ThemedText>
      <BaseCard className={ReportCardClasses.body}>
        <ThemedText type="default" className={ReportTextClasses.bodyText}>
          {narrative}
        </ThemedText>
      </BaseCard>
    </View>
  );
}
