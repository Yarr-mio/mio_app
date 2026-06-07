import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { HomeReportBackground } from '@/components/themed/HomeReportBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { REPORT_TITLE, type ReportPeriod } from '@/constants/report';
import { ReportDividerClasses, ReportSectionClasses, ReportTextClasses } from '@/constants/theme';
import { AverageEmotionScoreCard } from '@/features/report/components/AverageEmotionScoreCard';
import { EmotionConstellation } from '@/features/report/components/EmotionConstellation';
import { ReportDateNavigator } from '@/features/report/components/ReportDateNavigator';
import { ReportPeriodTabs } from '@/features/report/components/ReportPeriodTabs';
import { cn } from '@/utils/cn';
import { getMonthRange, getWeekRange, shiftMonth, shiftWeek, toKstDate } from '@/utils/date';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

export function GrowthReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [anchorDate, setAnchorDate] = useState(() => toKstDate(new Date()));

  const dateRange = period === 'week' ? getWeekRange(anchorDate) : getMonthRange(anchorDate);

  const handlePrevious = () => {
    setAnchorDate((current) =>
      toKstDate(period === 'week' ? shiftWeek(current, -1) : shiftMonth(current, -1))
    );
  };

  const handleNext = () => {
    setAnchorDate((current) =>
      toKstDate(period === 'week' ? shiftWeek(current, 1) : shiftMonth(current, 1))
    );
  };

  const handlePeriodChange = (nextPeriod: ReportPeriod) => {
    setPeriod(nextPeriod);
    setAnchorDate(toKstDate(new Date()));
  };

  return (
    <View className="flex-1 bg-midnight">
      <HomeReportBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <ScrollView
          className="flex-1 bg-transparent"
          contentContainerClassName="grow px-8 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-6">
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

          <View className={ReportSectionClasses.reportCards}>
            <EmotionConstellation period={period} anchorDate={anchorDate} />
            <AverageEmotionScoreCard period={period} anchorDate={anchorDate} />
          </View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
