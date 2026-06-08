import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  getOnboardingCharacterById,
  ONBOARDING_DEFAULT_CHARACTER_ID,
} from '@/constants/characters';
import {
  formatReportChatButtonLabel,
  REPORT_PERIOD_TO_CHARACTER_STORY_PERIOD,
  REPORT_STATUS,
  REPORT_TITLE,
  type ReportPeriod,
} from '@/constants/report';
import { MAIN_ROUTES } from '@/constants/routes';
import { ReportDividerClasses, ReportSectionClasses, ReportTextClasses } from '@/constants/theme';
import { AverageEmotionScoreCard } from '@/features/report/components/AverageEmotionScoreCard';
import { CharacterStoryCard } from '@/features/report/components/CharacterStoryCard';
import { DistortionTop3Section } from '@/features/report/components/DistortionTop3Section';
import { EmotionConstellation } from '@/features/report/components/EmotionConstellation';
import { ReportCoachingSection } from '@/features/report/components/ReportCoachingSection';
import { ReportDateNavigator } from '@/features/report/components/ReportDateNavigator';
import { ReportInsufficientDataState } from '@/features/report/components/ReportInsufficientDataState';
import { ReportNarrativeSection } from '@/features/report/components/ReportNarrativeSection';
import { ReportPendingState } from '@/features/report/components/ReportPendingState';
import { ReportPeriodTabs } from '@/features/report/components/ReportPeriodTabs';
import { TodoSummaryCard } from '@/features/report/components/TodoSummaryCard';
import { useReportMock } from '@/features/report/hooks/useReportMock';
import { useUserStore } from '@/store/userStore';
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
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

export function GrowthReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [weekAnchorDate, setWeekAnchorDate] = useState(() => toKstDate(new Date()));
  const [monthAnchorDate, setMonthAnchorDate] = useState(() =>
    toKstDate(getMonthRange(new Date()).start)
  );
  const onboardingResult = useUserStore((state) => state.onboardingResult);
  const characterId = onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const character = getOnboardingCharacterById(characterId);

  const anchorDate =
    period === 'week' ? weekAnchorDate : toKstDate(getMonthRange(monthAnchorDate).start);
  const dateRange =
    period === 'week' ? getWeekRange(weekAnchorDate) : getMonthRange(monthAnchorDate);
  const { report } = useReportMock(period, anchorDate);

  const handlePrevious = () => {
    if (period === 'week') {
      setWeekAnchorDate((current) => toKstDate(shiftWeek(current, -1)));
      return;
    }

    setMonthAnchorDate((current) => toKstDate(shiftMonth(current, -1)));
  };

  const handleNext = () => {
    if (period === 'week') {
      setWeekAnchorDate((current) => toKstDate(shiftWeek(current, 1)));
      return;
    }

    setMonthAnchorDate((current) => toKstDate(shiftMonth(current, 1)));
  };

  const handlePeriodChange = (nextPeriod: ReportPeriod) => {
    if (nextPeriod === period) {
      return;
    }

    if (nextPeriod === 'month' && period === 'week') {
      const syncedMonthAnchor = toKstDate(getMonthAnchorFromWeekEnd(weekAnchorDate));
      setMonthAnchorDate(syncedMonthAnchor);
      setPeriod('month');
      return;
    }

    setPeriod(nextPeriod);
  };

  const handleGoToChat = () => {
    router.push(MAIN_ROUTES.chat);
  };

  const renderReportContent = () => {
    if (report.status === REPORT_STATUS.PENDING) {
      return <ReportPendingState />;
    }

    if (report.status === REPORT_STATUS.INSUFFICIENT_DATA) {
      return (
        <ReportInsufficientDataState
          period={period}
          checkinCount={report.checkin_count}
          requiredCount={report.required_count}
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
        <CharacterStoryCard
          period={REPORT_PERIOD_TO_CHARACTER_STORY_PERIOD[period]}
          anchorDate={anchorDate}
          characterId={characterId}
        />
        {report.narrative ? <ReportNarrativeSection narrative={report.narrative} /> : null}
        {report.coaching_direction ? (
          <ReportCoachingSection coachingDirection={report.coaching_direction} />
        ) : null}
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

        <View className={ReportSectionClasses.chatButtonContainer}>
          <Button onPress={handleGoToChat}>{formatReportChatButtonLabel(character.name)}</Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
