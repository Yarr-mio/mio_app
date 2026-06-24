import { ThemedText } from '@/components/themed/ThemedText';
import { REPORT_PERIOD_LIST, REPORT_PERIOD_TABS, type ReportPeriod } from '@/constants/report';
import { PressableConfig, ReportTabClasses } from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Pressable, View } from 'react-native';

interface ReportPeriodTabsProps {
  period: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

const PERIOD_OPTIONS = REPORT_PERIOD_LIST;

export function ReportPeriodTabs({ period, onChange }: ReportPeriodTabsProps) {
  return (
    <View className={ReportTabClasses.container}>
      {PERIOD_OPTIONS.map((option) => {
        const isActive = period === option;

        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={REPORT_PERIOD_TABS[option]}
            hitSlop={PressableConfig.hitSlop}
            className={cn(
              ReportTabClasses.tab,
              isActive ? ReportTabClasses.active : ReportTabClasses.inactive
            )}
          >
            <ThemedText
              type="default"
              className={isActive ? ReportTabClasses.activeText : ReportTabClasses.inactiveText}
            >
              {REPORT_PERIOD_TABS[option]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
