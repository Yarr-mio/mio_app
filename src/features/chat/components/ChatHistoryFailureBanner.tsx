import { ThemedText } from '@/components/themed/ThemedText';
import { Pressable, View } from 'react-native';

interface ChatHistoryFailureBannerProps {
  /** 재시도가 실제로 의미 있을 때만 넘긴다 — 없으면 닫기만 제공한다 */
  onRetry?: () => void;
  onDismiss: () => void;
}

/**
 * 이전 대화 이력을 불러오지 못했을 때 대화창 상단에 띄우는 배너.
 *
 * "이력이 없는 것"과 "이력을 못 불러온 것"을 사용자가 구분할 수 있어야 하므로,
 * 실패한 뒤 사용자가 대화를 이어가더라도 이 사실을 화면에서 지우지 않는다.
 * 다만 대화가 시작되면 복원 시딩이 불가능해져 재시도가 무의미하므로, 그때는 닫기만 남긴다.
 * 세션 자체는 살아 있어 대화는 계속할 수 있다.
 */
export function ChatHistoryFailureBanner({ onRetry, onDismiss }: ChatHistoryFailureBannerProps) {
  return (
    <View className="mx-4 mt-2 flex-row items-center justify-between gap-3 rounded-xl border border-line-md bg-surface-md px-4 py-3">
      <ThemedText type="small" className="flex-1 text-fg-muted">
        이전 대화를 불러오지 못했어요.
      </ThemedText>
      <Pressable
        onPress={onRetry ?? onDismiss}
        className="rounded-lg border border-line-md px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel={onRetry ? '이전 대화 다시 불러오기' : '알림 닫기'}
      >
        <ThemedText type="small" className="text-fg">
          {onRetry ? '다시 시도' : '닫기'}
        </ThemedText>
      </Pressable>
    </View>
  );
}
