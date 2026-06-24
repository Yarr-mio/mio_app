import { DataWarnIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import { BaseCard } from '@/components/ui/BaseCard';
import { Button } from '@/components/ui/Button';
import {
  getReportCharacterWarnImage,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
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
  ReportTextClasses,
} from '@/constants/theme';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

interface ReportErrorStateProps {
  onRetry: () => void;
  onViewPrevious: () => void;
}

const REPORT_CHARACTER_WARN_FALLBACK_IMAGE = getReportCharacterWarnImage(
  ONBOARDING_DEFAULT_CHARACTER_ID
);

export function ReportErrorState({ onRetry, onViewPrevious }: ReportErrorStateProps) {
  const characterId = useSelectedCharacterId();
  const characterImage = getReportCharacterWarnImage(characterId);
  const [hasImageError, setHasImageError] = useState(false);
  const imageSource = hasImageError ? REPORT_CHARACTER_WARN_FALLBACK_IMAGE : characterImage;
  const { characterImageSize, warnIconSize } = ReportErrorStateLayout;

  const handleCharacterImageError = () => {
    setHasImageError(true);
  };

  useEffect(() => {
    setHasImageError(false);
  }, [characterId]);

  return (
    <View className={ReportErrorStateClasses.root}>
      <View className={ReportErrorStateClasses.topContent}>
        <View className={ReportErrorStateClasses.heroSection}>
          <Image
            source={imageSource}
            onError={handleCharacterImageError}
            style={{ width: characterImageSize, height: characterImageSize }}
            contentFit="contain"
          />

          <ThemedText type="defaultBold" className={ReportTextClasses.insufficientTitle}>
            {REPORT_ERROR_TITLE}
          </ThemedText>
          <ThemedText type="default" className={ReportTextClasses.insufficientSubtitle}>
            {REPORT_ERROR_SUBTITLE}
          </ThemedText>
        </View>

        <View className={ReportErrorStateClasses.buttonArea}>
          <Button onPress={onRetry}>{REPORT_ERROR_RETRY_LABEL}</Button>
          <Pressable
            onPress={onViewPrevious}
            accessibilityRole="button"
            accessibilityLabel={REPORT_ERROR_VIEW_PREVIOUS_LABEL}
            className={ReportErrorStateClasses.outlineButton}
          >
            <ThemedText type="defaultBold" className={ReportTextClasses.errorOutlineButtonText}>
              {REPORT_ERROR_VIEW_PREVIOUS_LABEL}
            </ThemedText>
          </Pressable>
        </View>

        <View className={ReportErrorStateClasses.helpCardWrapper}>
          <BaseCard className={ReportErrorStateClasses.helpCardBody}>
            <View
              className={ReportErrorStateClasses.helpIconCircle}
              style={{ borderColor: ReportStateColors.subtitle }}
            >
              <DataWarnIcon
                width={warnIconSize}
                height={warnIconSize}
                color={ReportStateColors.subtitle}
              />
            </View>
            <View className={ReportErrorStateClasses.helpTextGroup}>
              <ThemedText type="defaultRegular" className={ReportTextClasses.pendingReasonTitle}>
                {REPORT_ERROR_HELP_TITLE}
              </ThemedText>
              <ThemedText type="default" className={ReportTextClasses.pendingReasonBody}>
                {REPORT_ERROR_HELP_BODY}
              </ThemedText>
            </View>
          </BaseCard>
        </View>
      </View>
    </View>
  );
}
