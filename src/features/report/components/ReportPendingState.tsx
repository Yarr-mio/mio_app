import { DataCreationTimeIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { getReportCharacterLoadingImage } from '@/constants/characters';
import {
  REPORT_PENDING_CHECKIN_NOTICE,
  REPORT_PENDING_REASON_BODY,
  REPORT_PENDING_REASON_TITLE,
  REPORT_PENDING_SCHEDULE,
  REPORT_PENDING_SCHEDULE_LABEL,
  REPORT_PENDING_SUBTITLE,
  REPORT_PENDING_TITLE,
  type ReportPeriod,
} from '@/constants/report';
import {
  PrimaryColors,
  ReportCardClasses,
  ReportPendingStateClasses,
  ReportPendingStateLayout,
  ReportTextClasses,
} from '@/constants/theme';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { View } from 'react-native';

interface ReportPendingStateProps {
  period: ReportPeriod;
}

export function ReportPendingState({ period }: ReportPendingStateProps) {
  const characterId = useSelectedCharacterId();
  const characterImage = getReportCharacterLoadingImage(characterId);
  const { characterImageSize, clockIconSize } = ReportPendingStateLayout;

  return (
    <View className={ReportPendingStateClasses.root}>
      <View className={ReportPendingStateClasses.topContent}>
        <View className={ReportPendingStateClasses.heroSection}>
          <Image
            source={characterImage}
            style={{ width: characterImageSize, height: characterImageSize }}
            contentFit="contain"
          />

          <ThemedText type="defaultBold" className={ReportTextClasses.insufficientTitle}>
            {REPORT_PENDING_TITLE[period]}
          </ThemedText>
          <ThemedText type="default" className={ReportTextClasses.insufficientSubtitle}>
            {REPORT_PENDING_SUBTITLE}
          </ThemedText>
        </View>

        <View className={ReportPendingStateClasses.cardList}>
          <BaseCard className={ReportCardClasses.body}>
            <View className={ReportPendingStateClasses.scheduleCardRow}>
              <View className={ReportPendingStateClasses.scheduleIcon}>
                <DataCreationTimeIcon
                  width={clockIconSize}
                  height={clockIconSize}
                  color={PrimaryColors.DEFAULT}
                />
              </View>
              <View className={ReportPendingStateClasses.scheduleTextGroup}>
                <ThemedText type="defaultRegular" className={ReportTextClasses.pendingScheduleText}>
                  {REPORT_PENDING_SCHEDULE_LABEL}
                </ThemedText>
                <ThemedText type="defaultRegular" className={ReportTextClasses.pendingScheduleText}>
                  {REPORT_PENDING_SCHEDULE[period]}
                </ThemedText>
              </View>
            </View>
          </BaseCard>

          <BaseCard className={ReportCardClasses.body}>
            <View className={ReportPendingStateClasses.reasonCard}>
              <ThemedText type="defaultRegular" className={ReportTextClasses.pendingReasonTitle}>
                {REPORT_PENDING_REASON_TITLE}
              </ThemedText>
              <ThemedText type="default" className={ReportTextClasses.pendingReasonBody}>
                {REPORT_PENDING_REASON_BODY}
              </ThemedText>
            </View>
          </BaseCard>
        </View>
      </View>

      <ThemedText type="small" className={ReportPendingStateClasses.notice}>
        {REPORT_PENDING_CHECKIN_NOTICE[period]}
      </ThemedText>
    </View>
  );
}
