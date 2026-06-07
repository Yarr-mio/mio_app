import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  formatDistortionCount,
  REPORT_CARD_TITLES,
  REPORT_DISTORTION_EMPTY_MESSAGE,
} from '@/constants/report';
import {
  ReportCardClasses,
  ReportDistortionProgressClasses,
  ReportTextClasses,
} from '@/constants/theme';
import { DistortionProgressBar } from '@/features/report/components/DistortionProgressBar';
import type { DistortionTop3Item } from '@/types/report';
import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface DistortionTop3SectionProps {
  distortionTop3: DistortionTop3Item[];
}

function getMaxDistortionCount(items: DistortionTop3Item[]): number {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => item.count), 1);
}

export function DistortionTop3Section({ distortionTop3 }: DistortionTop3SectionProps) {
  const isEmpty = distortionTop3.length === 0;
  const maxCount = getMaxDistortionCount(distortionTop3);

  return (
    <BaseCard className={ReportCardClasses.statsBody}>
      <ThemedText type="default" className={ReportTextClasses.inCardTitle}>
        {REPORT_CARD_TITLES.distortion}
      </ThemedText>
      {isEmpty ? (
        <View className={ReportCardClasses.inCardBody}>
          <ThemedText type="small" className={ReportTextClasses.emptyState}>
            {REPORT_DISTORTION_EMPTY_MESSAGE}
          </ThemedText>
        </View>
      ) : (
        <View className={cn(ReportCardClasses.inCardBody, ReportDistortionProgressClasses.list)}>
          {distortionTop3.map((item) => (
            <View key={item.type} className={ReportDistortionProgressClasses.row}>
              <ThemedText type="small" className={ReportDistortionProgressClasses.label}>
                {item.label}
              </ThemedText>
              <DistortionProgressBar ratio={item.count / maxCount} />
              <ThemedText type="small" className={ReportDistortionProgressClasses.count}>
                {formatDistortionCount(item.count)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </BaseCard>
  );
}
