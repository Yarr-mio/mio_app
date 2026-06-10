import { ChevronLeftIcon, ChevronRightIcon } from '@/assets/icons';
import { ThemedText } from '@/components/themed/ThemedText';
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
        accessibilityLabel="이전 기간"
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
        accessibilityLabel="다음 기간"
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
