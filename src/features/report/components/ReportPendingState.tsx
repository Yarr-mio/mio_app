import { DataCreationTimeIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
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
  ReportPendingStateClasses,
  ReportPendingStateLayout,
  ReportStateColors,
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
        <Image
          source={characterImage}
          style={{ width: characterImageSize, height: characterImageSize }}
          contentFit="contain"
        />

        <View className={ReportPendingStateClasses.textGroup}>
          <ThemedText
            className="text-center text-2xl font-medium"
            style={{ color: ReportStateColors.title }}
          >
            {REPORT_PENDING_TITLE[period]}
          </ThemedText>
          <ThemedText className="text-center text-lg" style={{ color: ReportStateColors.subtitle }}>
            {REPORT_PENDING_SUBTITLE}
          </ThemedText>
        </View>

        <View className={ReportPendingStateClasses.cardList}>
          <View className={ReportPendingStateClasses.card}>
            <View className={ReportPendingStateClasses.scheduleCardRow}>
              <DataCreationTimeIcon
                width={clockIconSize}
                height={clockIconSize}
                color={ReportStateColors.subtitle}
              />
              <View className={ReportPendingStateClasses.scheduleTextGroup}>
                <ThemedText className="text-sm" style={{ color: ReportStateColors.subtitle }}>
                  {REPORT_PENDING_SCHEDULE_LABEL}
                </ThemedText>
                <ThemedText
                  className="text-base font-medium"
                  style={{ color: ReportStateColors.emphasis }}
                >
                  {REPORT_PENDING_SCHEDULE[period]}
                </ThemedText>
              </View>
            </View>
          </View>

          <View className={ReportPendingStateClasses.card}>
            <View className={ReportPendingStateClasses.reasonCard}>
              <ThemedText
                className="text-xl font-semibold"
                style={{ color: ReportStateColors.emphasis }}
              >
                {REPORT_PENDING_REASON_TITLE}
              </ThemedText>
              <ThemedText className="text-base" style={{ color: ReportStateColors.subtitle }}>
                {REPORT_PENDING_REASON_BODY}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <ThemedText
        className={ReportPendingStateClasses.notice}
        style={{ color: ReportStateColors.subtitle }}
      >
        {REPORT_PENDING_CHECKIN_NOTICE[period]}
      </ThemedText>
    </View>
  );
}
