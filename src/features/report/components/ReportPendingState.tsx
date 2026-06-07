import { ThemedText } from '@/components/themed/ThemedText';
import { REPORT_PENDING_MESSAGE } from '@/constants/report';
import { ButtonColors, ReportPendingStateClasses, ReportTextClasses } from '@/constants/theme';
import { ActivityIndicator, View } from 'react-native';

export function ReportPendingState() {
  return (
    <View className={ReportPendingStateClasses.container}>
      <ActivityIndicator color={ButtonColors.spinnerLight} />
      <ThemedText type="small" className={ReportTextClasses.emptyState}>
        {REPORT_PENDING_MESSAGE}
      </ThemedText>
    </View>
  );
}
