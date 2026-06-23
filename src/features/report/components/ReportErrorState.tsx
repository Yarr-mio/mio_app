import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { REPORT_RETRY_BUTTON_LABEL } from '@/constants/report';
import { ReportPendingStateClasses } from '@/constants/theme';
import { View } from 'react-native';

interface ReportErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ReportErrorState({ message, onRetry }: ReportErrorStateProps) {
  return (
    <View className={ReportPendingStateClasses.container}>
      <ErrorState message={message} />
      <Button onPress={onRetry}>{REPORT_RETRY_BUTTON_LABEL}</Button>
    </View>
  );
}
