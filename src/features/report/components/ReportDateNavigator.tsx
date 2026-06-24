import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
import {
  REPORT_DATE_NAVIGATOR_A11Y_NEXT,
  REPORT_DATE_NAVIGATOR_A11Y_PREV,
} from '@/constants/report';
import {
  FgColors,
  PressableConfig,
  ReportDateNavigatorClasses,
  ReportLayout,
  ReportTextClasses,
} from '@/constants/theme';
import { Pressable, View } from 'react-native';

interface ReportDateNavigatorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function ReportDateNavigator({ label, onPrevious, onNext }: ReportDateNavigatorProps) {
  return (
    <View className={ReportDateNavigatorClasses.container}>
      <Pressable
        onPress={onPrevious}
        accessibilityRole="button"
        accessibilityLabel={REPORT_DATE_NAVIGATOR_A11Y_PREV}
        hitSlop={PressableConfig.hitSlop}
        className={ReportDateNavigatorClasses.chevronButton}
      >
        <ChevronLeftIcon
          width={ReportLayout.chevronIconWidth}
          height={ReportLayout.chevronIconHeight}
          color={FgColors.onDefault}
        />
      </Pressable>

      <ThemedText type="small" className={ReportTextClasses.dateRange}>
        {label}
      </ThemedText>

      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel={REPORT_DATE_NAVIGATOR_A11Y_NEXT}
        hitSlop={PressableConfig.hitSlop}
        className={ReportDateNavigatorClasses.chevronButton}
      >
        <ChevronRightIcon
          width={ReportLayout.chevronIconWidth}
          height={ReportLayout.chevronIconHeight}
          color={FgColors.onDefault}
        />
      </Pressable>
    </View>
  );
}
