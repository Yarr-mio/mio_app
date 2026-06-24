import { DataChatIcon, DataCheckinIcon, DataReportIcon, DataTodoIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import {
  getReportCharacterDataImage,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import {
  formatCheckinOccurrence,
  formatInsufficientDataSubtitle,
  formatRequiredCheckinSuffix,
  REPORT_INSUFFICIENT_CHECKIN_CARD_TITLE,
  REPORT_INSUFFICIENT_GUIDE_ITEMS,
  REPORT_INSUFFICIENT_GUIDE_SUBTITLE,
  REPORT_INSUFFICIENT_TITLE,
  REPORT_REQUIRED_CHECKIN_COUNT,
  type ReportInsufficientGuideItemId,
  type ReportPeriod,
} from '@/constants/report';
import {
  ReportCardClasses,
  ReportInsufficientDataClasses,
  ReportInsufficientDataLayout,
  ReportStateColors,
  ReportTextClasses,
} from '@/constants/theme';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { useState, type FC } from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

interface ReportInsufficientDataStateProps {
  period: ReportPeriod;
  checkinCount: number;
  requiredCount?: number;
  message?: string;
}

interface InsufficientDataGuideItemProps {
  icon: FC<SvgProps>;
  text: string;
}

const GUIDE_ICONS: Record<ReportInsufficientGuideItemId, FC<SvgProps>> = {
  data_checkin: DataCheckinIcon,
  data_todo: DataTodoIcon,
  data_chat: DataChatIcon,
  data_report: DataReportIcon,
};

const REPORT_CHARACTER_DATA_FALLBACK_IMAGE = getReportCharacterDataImage(
  ONBOARDING_DEFAULT_CHARACTER_ID
);

function InsufficientDataGuideItem({ icon: Icon, text }: InsufficientDataGuideItemProps) {
  const { guideIconSize } = ReportInsufficientDataLayout;

  return (
    <View className={ReportInsufficientDataClasses.guideItem}>
      <View className={ReportInsufficientDataClasses.guideIconCircle}>
        <Icon width={guideIconSize} height={guideIconSize} color={ReportStateColors.emphasis} />
      </View>
      <View className={ReportInsufficientDataClasses.guideItemText}>
        <ThemedText type="small" className={ReportTextClasses.insufficientGuideItemLabel}>
          {text}
        </ThemedText>
      </View>
    </View>
  );
}

export function ReportInsufficientDataState({
  period,
  checkinCount,
  requiredCount,
  message,
}: ReportInsufficientDataStateProps) {
  const characterId = useSelectedCharacterId();
  const characterImage = getReportCharacterDataImage(characterId);
  const [imageSource, setImageSource] = useState(characterImage);

  const resolvedRequiredCount = requiredCount ?? REPORT_REQUIRED_CHECKIN_COUNT;
  const checkinCardTitle = REPORT_INSUFFICIENT_CHECKIN_CARD_TITLE[period];
  const subtitle = message?.trim() || formatInsufficientDataSubtitle(period, resolvedRequiredCount);

  const handleCharacterImageError = () => {
    setImageSource(REPORT_CHARACTER_DATA_FALLBACK_IMAGE);
  };

  return (
    <View className={ReportInsufficientDataClasses.container}>
      <View className={ReportInsufficientDataClasses.heroSection}>
        <Image
          source={imageSource}
          onError={handleCharacterImageError}
          style={{
            width: ReportInsufficientDataLayout.characterImageSize,
            height: ReportInsufficientDataLayout.characterImageSize,
          }}
          contentFit="contain"
        />
        <ThemedText type="defaultBold" className={ReportTextClasses.insufficientTitle}>
          {REPORT_INSUFFICIENT_TITLE}
        </ThemedText>
        <ThemedText type="default" className={ReportTextClasses.insufficientSubtitle}>
          {subtitle}
        </ThemedText>
      </View>

      <View className={ReportInsufficientDataClasses.cards}>
        <BaseCard className={ReportCardClasses.body}>
          <ThemedText type="default" className={ReportTextClasses.insufficientCheckinCardTitle}>
            {checkinCardTitle}
          </ThemedText>
          <View className={ReportInsufficientDataClasses.checkinCountRow}>
            <ThemedText type="defaultBold" className={ReportTextClasses.scoreValue}>
              {formatCheckinOccurrence(checkinCount)}
            </ThemedText>
            <ThemedText type="default" className={ReportTextClasses.scoreDenominator}>
              {' '}
              {formatRequiredCheckinSuffix(resolvedRequiredCount)}
            </ThemedText>
          </View>
        </BaseCard>

        <BaseCard className={ReportCardClasses.body}>
          <ThemedText type="default" className={ReportTextClasses.insufficientGuideSubtitle}>
            {REPORT_INSUFFICIENT_GUIDE_SUBTITLE}
          </ThemedText>
          <View className={ReportInsufficientDataClasses.guideItemsRow}>
            {REPORT_INSUFFICIENT_GUIDE_ITEMS.map((item) => (
              <InsufficientDataGuideItem
                key={item.id}
                icon={GUIDE_ICONS[item.id]}
                text={item.text}
              />
            ))}
          </View>
        </BaseCard>
      </View>
    </View>
  );
}
