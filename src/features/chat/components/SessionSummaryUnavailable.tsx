import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  SUMMARY_UNAVAILABLE_CONFIRM_LABEL,
  SUMMARY_UNAVAILABLE_MESSAGE,
} from '@/constants/chatSummaryFailure';
import { SummaryFailureClasses } from '@/constants/theme';
import { View } from 'react-native';

interface SessionSummaryUnavailableProps {
  onConfirm: () => void;
}

/**
 * 요약이 영구적으로 없는 세션에 대한 안내.
 *
 * 재시도 버튼을 두지 않는다 — 서버가 이미 FAILED로 확정한 상태라 몇 번을 눌러도 같은 410이 온다.
 */
export function SessionSummaryUnavailable({ onConfirm }: SessionSummaryUnavailableProps) {
  return (
    <View className={SummaryFailureClasses.root}>
      <ChatBackground />
      <ThemedText type="default" className={SummaryFailureClasses.message}>
        {SUMMARY_UNAVAILABLE_MESSAGE}
      </ThemedText>
      <Button variant="ghost" size="md" onPress={onConfirm}>
        {SUMMARY_UNAVAILABLE_CONFIRM_LABEL}
      </Button>
    </View>
  );
}
