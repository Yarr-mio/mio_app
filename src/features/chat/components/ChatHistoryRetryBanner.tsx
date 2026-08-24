import { ThemedText } from '@/components/themed/ThemedText';
import { Pressable, View } from 'react-native';

interface ChatHistoryRetryBannerProps {
  onRetry: () => void;
}

/**
 * 이전 대화 이력을 불러오지 못했을 때 대화창 상단에 띄우는 배너.
 *
 * "이력이 없는 것"과 "이력을 못 불러온 것"을 사용자가 구분할 수 있어야 하므로,
 * 조용히 빈 대화창을 보여주지 않고 실패를 명시한다. 세션 자체는 살아 있어 대화는 계속할 수 있다.
 */
export function ChatHistoryRetryBanner({ onRetry }: ChatHistoryRetryBannerProps) {
  return (
    <View className="mx-4 mt-2 flex-row items-center justify-between gap-3 rounded-xl border border-line-md bg-surface-md px-4 py-3">
      <ThemedText type="small" className="flex-1 text-fg-muted">
        이전 대화를 불러오지 못했어요.
      </ThemedText>
      <Pressable
        onPress={onRetry}
        className="rounded-lg border border-line-md px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel="이전 대화 다시 불러오기"
      >
        <ThemedText type="small" className="text-fg">
          다시 시도
        </ThemedText>
      </Pressable>
    </View>
  );
}
