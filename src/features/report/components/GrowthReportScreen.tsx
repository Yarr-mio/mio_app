import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { getOnboardingCharacterById, type OnboardingCharacterId } from '@/constants/characters';
import {
  formatReportChatButtonLabel,
  REPORT_PERIOD,
  REPORT_PERIOD_TO_CHARACTER_STORY_PERIOD,
  REPORT_STATUS,
  REPORT_TITLE,
  type ReportPeriod,
} from '@/constants/report';
import { MAIN_ROUTES } from '@/constants/routes';
import {
  ButtonColors,
  ReportDividerClasses,
  ReportFetchingOverlayClasses,
  ReportSectionClasses,
  ReportTextClasses,
} from '@/constants/theme';
import { AverageEmotionScoreCard } from '@/features/report/components/AverageEmotionScoreCard';
import { CharacterStoryCard } from '@/features/report/components/CharacterStoryCard';
import { DistortionTop3Section } from '@/features/report/components/DistortionTop3Section';
import { EmotionConstellation } from '@/features/report/components/EmotionConstellation';
import { ReportDateNavigator } from '@/features/report/components/ReportDateNavigator';
import { ReportErrorState } from '@/features/report/components/ReportErrorState';
import { ReportInsufficientDataState } from '@/features/report/components/ReportInsufficientDataState';
import { ReportPendingState } from '@/features/report/components/ReportPendingState';
import { ReportPeriodTabs } from '@/features/report/components/ReportPeriodTabs';
import { TodoSummaryCard } from '@/features/report/components/TodoSummaryCard';
import { useReport } from '@/features/report/hooks/useReport';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { cn } from '@/utils/cn';
import {
  getMonthAnchorFromWeekEnd,
  getMonthRange,
  getWeekRange,
  shiftMonth,
  shiftWeek,
  toKstDate,
} from '@/utils/date';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

interface CharacterStorySectionProps {
  period: ReportPeriod;
  anchorDate: Date;
  characterId: OnboardingCharacterId;
  narrative: string | null;
  coachingDirection: string | null;
}

function hasCharacterStoryContent(
  narrative: string | null | undefined,
  coachingDirection: string | null | undefined
): boolean {
  return Boolean(narrative?.trim() || coachingDirection?.trim());
}

function CharacterStorySection({
  period,
  anchorDate,
  characterId,
  narrative,
  coachingDirection,
}: CharacterStorySectionProps) {
  if (!hasCharacterStoryContent(narrative, coachingDirection)) {
    return null;
  }

  return (
    <CharacterStoryCard
      period={REPORT_PERIOD_TO_CHARACTER_STORY_PERIOD[period]}
      anchorDate={anchorDate}
      characterId={characterId}
      storyText={narrative?.trim() ?? ''}
      coachingDirection={coachingDirection?.trim() ?? null}
    />
  );
}

export function GrowthReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>(REPORT_PERIOD.week);
  const [weekAnchorDate, setWeekAnchorDate] = useState(() => toKstDate(new Date()));
  const [monthAnchorDate, setMonthAnchorDate] = useState(() =>
    toKstDate(getMonthRange(new Date()).start)
  );
  const characterId = useSelectedCharacterId();
  const character = getOnboardingCharacterById(characterId);

  const anchorDate =
    period === REPORT_PERIOD.week
      ? weekAnchorDate
      : toKstDate(getMonthRange(monthAnchorDate).start);
  const dateRange =
    period === REPORT_PERIOD.week ? getWeekRange(weekAnchorDate) : getMonthRange(monthAnchorDate);
  const {
    report,
    isPending,
    isFetching,
    isPlaceholderData,
    isError,
    isServerError,
    isPollingTimedOut,
    error,
    refetch,
  } = useReport({
    period,
    anchorDate,
  });

  useEffect(() => {
    if (isError && !isServerError && !isPollingTimedOut) {
      console.error('[GrowthReportScreen]', error);
    }
  }, [isError, isServerError, isPollingTimedOut, error]);

  const showFetchingOverlay = !isPending && isFetching && isPlaceholderData;

  const showChatButton =
    !isPending &&
    !isError &&
    !isPollingTimedOut &&
    report != null &&
    report.status !== REPORT_STATUS.PENDING;

  const handlePrevious = () => {
    if (period === REPORT_PERIOD.week) {
      setWeekAnchorDate((current) => toKstDate(shiftWeek(current, -1)));
      return;
    }

    setMonthAnchorDate((current) => toKstDate(shiftMonth(current, -1)));
  };

  const handleNext = () => {
    if (period === REPORT_PERIOD.week) {
      setWeekAnchorDate((current) => toKstDate(shiftWeek(current, 1)));
      return;
    }

    setMonthAnchorDate((current) => toKstDate(shiftMonth(current, 1)));
  };

  const handlePeriodChange = (nextPeriod: ReportPeriod) => {
    if (nextPeriod === period) {
      return;
    }

    if (nextPeriod === REPORT_PERIOD.month && period === REPORT_PERIOD.week) {
      const syncedMonthAnchor = toKstDate(getMonthAnchorFromWeekEnd(weekAnchorDate));
      setMonthAnchorDate(syncedMonthAnchor);
      setPeriod(REPORT_PERIOD.month);
      return;
    }

    setPeriod(nextPeriod);
  };

  const handleViewPrevious = () => {
    if (period === REPORT_PERIOD.week) {
      setWeekAnchorDate((current) => toKstDate(shiftWeek(current, -1)));
      return;
    }

    setMonthAnchorDate((current) => toKstDate(shiftMonth(current, -1)));
  };

  const handleGoToChat = () => {
    router.push(MAIN_ROUTES.chat);
  };

  const renderReportContent = () => {
    if (isPending) {
      return <ReportPendingState period={period} />;
    }

    if (isServerError || isPollingTimedOut) {
      return <ReportErrorState onRetry={refetch} onViewPrevious={handleViewPrevious} />;
    }

    if (isError && !report) {
      return <ReportPendingState period={period} />;
    }

    if (!report) {
      return <ReportPendingState period={period} />;
    }

    if (isPollingTimedOut) {
      return <ReportErrorState onRetry={refetch} onViewPrevious={handleViewPrevious} />;
    }

    if (report.status === REPORT_STATUS.PENDING) {
      return <ReportPendingState period={period} />;
    }

    if (report.status === REPORT_STATUS.INSUFFICIENT_DATA) {
      return (
        <ReportInsufficientDataState
          period={period}
          checkinCount={report.checkin_count}
          requiredCount={report.required_count}
          message={report.message}
        />
      );
    }

    return (
      <View className={ReportSectionClasses.reportCards}>
        <EmotionConstellation
          key={`${period}-${anchorDate.getTime()}`}
          period={period}
          anchorDate={anchorDate}
        />
        <AverageEmotionScoreCard period={period} anchorDate={anchorDate} />
        <View className={ReportSectionClasses.statsRow}>
          <DistortionTop3Section distortionTop3={report.distortion_top3} />
          <TodoSummaryCard period={period} todoSummary={report.todo_summary} />
        </View>
        <CharacterStorySection
          period={period}
          anchorDate={anchorDate}
          characterId={characterId}
          narrative={report.narrative}
          coachingDirection={report.coaching_direction}
        />
      </View>
    );
  };

  return (
    <View className={ReportSectionClasses.screenRoot}>
      <HomeReportBackground />
      <ScreenContainer className={ReportSectionClasses.screenContainer}>
        <ScrollView
          className={ReportSectionClasses.screenContainer}
          contentContainerClassName={ReportSectionClasses.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View className={ReportSectionClasses.headerSection}>
            <ThemedText
              type="defaultBold"
              className={cn('text-center', ReportTextClasses.pageTitle)}
            >
              {REPORT_TITLE}
            </ThemedText>

            <View className={cn(ReportDividerClasses.line, ReportSectionClasses.titleToDivider)} />

            <View
              className={cn(
                ReportSectionClasses.dividerToPeriodControls,
                ReportSectionClasses.periodControls
              )}
            >
              <ReportPeriodTabs period={period} onChange={handlePeriodChange} />

              <ReportDateNavigator
                label={dateRange.label}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            </View>
          </View>

          {renderReportContent()}
        </ScrollView>

        {showChatButton ? (
          <View className={ReportSectionClasses.chatButtonContainer}>
            <Button onPress={handleGoToChat}>{formatReportChatButtonLabel(character.name)}</Button>
          </View>
        ) : null}
      </ScreenContainer>
      {showFetchingOverlay ? (
        <View className={ReportFetchingOverlayClasses.overlay}>
          <ActivityIndicator color={ButtonColors.spinnerLight} />
        </View>
      ) : null}
    </View>
  );
}
