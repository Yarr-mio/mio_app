import { DataWarnIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { Button } from '@/components/ui/Button';
import { getReportCharacterWarnImage } from '@/constants/characters';
import {
  REPORT_ERROR_HELP_BODY,
  REPORT_ERROR_HELP_TITLE,
  REPORT_ERROR_RETRY_LABEL,
  REPORT_ERROR_SUBTITLE,
  REPORT_ERROR_TITLE,
  REPORT_ERROR_VIEW_PREVIOUS_LABEL,
} from '@/constants/report';
import {
  ReportErrorStateClasses,
  ReportErrorStateLayout,
  ReportStateColors,
} from '@/constants/theme';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

interface ReportErrorStateProps {
  onRetry: () => void;
  onViewPrevious?: () => void;
}

export function ReportErrorState({ onRetry, onViewPrevious }: ReportErrorStateProps) {
  const characterId = useSelectedCharacterId();
  const characterImage = getReportCharacterWarnImage(characterId);
  const { characterImageSize, warnIconSize } = ReportErrorStateLayout;

  return (
    <View className={ReportErrorStateClasses.root}>
      <View className={ReportErrorStateClasses.topContent}>
        <Image
          source={characterImage}
          style={{ width: characterImageSize, height: characterImageSize }}
          contentFit="contain"
        />

        <View className={ReportErrorStateClasses.textGroup}>
          <ThemedText
            className="text-center text-2xl font-medium"
            style={{ color: ReportStateColors.title }}
          >
            {REPORT_ERROR_TITLE}
          </ThemedText>
          <ThemedText className="text-center text-lg" style={{ color: ReportStateColors.subtitle }}>
            {REPORT_ERROR_SUBTITLE}
          </ThemedText>
        </View>

        <View className={ReportErrorStateClasses.buttonArea}>
          <Button onPress={onRetry}>{REPORT_ERROR_RETRY_LABEL}</Button>
          {onViewPrevious ? (
            <Pressable
              onPress={onViewPrevious}
              accessibilityRole="button"
              accessibilityLabel={REPORT_ERROR_VIEW_PREVIOUS_LABEL}
              className={ReportErrorStateClasses.outlineButton}
              style={{ borderColor: ReportStateColors.outlineButtonBorder }}
            >
              <ThemedText
                className={ReportErrorStateClasses.outlineButtonText}
                style={{ color: ReportStateColors.outlineButtonText }}
              >
                {REPORT_ERROR_VIEW_PREVIOUS_LABEL}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View className={ReportErrorStateClasses.helpCardWrapper}>
          <BaseCard className={ReportErrorStateClasses.helpCardBody}>
            <DataWarnIcon
              width={warnIconSize}
              height={warnIconSize}
              color={ReportStateColors.subtitle}
            />
            <View className={ReportErrorStateClasses.helpTextGroup}>
              <ThemedText
                className="text-xl font-semibold"
                style={{ color: ReportStateColors.emphasis }}
              >
                {REPORT_ERROR_HELP_TITLE}
              </ThemedText>
              <ThemedText className="text-base" style={{ color: ReportStateColors.subtitle }}>
                {REPORT_ERROR_HELP_BODY}
              </ThemedText>
            </View>
          </BaseCard>
        </View>
      </View>
    </View>
  );
}
