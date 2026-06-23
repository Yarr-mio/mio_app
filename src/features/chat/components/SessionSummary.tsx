import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { PrimaryColors } from '@/constants/theme';
import { BiasTypesDisplay } from '@/features/chat/components/BiasTypesDisplay';
import { useSessionSummary } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="rounded-card border border-line bg-surface p-6">
      <ThemedText type="smallTitle2" className="text-fg-default mb-3">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

export function SessionSummary() {
  // 라우트 파라미터(05번 작업의 재진입 리다이렉트)가 있으면 우선 사용, 없으면 방금 종료한 세션
  const { sessionId: routeSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const storeSessionId = useChatStore((s) => s.sessionId);
  const previousSessionId = useChatStore((s) => s.previousSessionId);
  const sessionId = routeSessionId ?? storeSessionId;

  const { data: summary, isLoading, refetch } = useSessionSummary(sessionId);
  const { data: previousSummary } = useSessionSummary(previousSessionId);

  if (!sessionId) {
    return null;
  }

  if (isLoading || !summary || summary.summary_status === 'pending') {
    return (
      <View className="flex-1 bg-midnight items-center justify-center">
        <ChatBackground />
        <ActivityIndicator color={PrimaryColors.DEFAULT} size="large" />
        <ThemedText type="small" className="text-fg-muted mt-4">
          대화 요약을 불러오는 중...
        </ThemedText>
      </View>
    );
  }

  if (summary.summary_status === 'failed') {
    return (
      <View className="flex-1 bg-midnight items-center justify-center px-8 gap-4">
        <ChatBackground />
        <ThemedText type="default" className="text-fg-muted text-center">
          대화 요약을 만드는 데 문제가 생겼어요.{'\n'}다시 시도해 주세요.
        </ThemedText>
        <Button variant="ghost" size="md" onPress={() => refetch()}>
          다시 시도
        </Button>
      </View>
    );
  }

  const previousEmotionScore = previousSummary?.avg_emotion_score;
  const percentChange =
    summary.avg_emotion_score !== null && previousEmotionScore != null && previousEmotionScore !== 0
      ? Math.round(
          ((summary.avg_emotion_score - previousEmotionScore) / previousEmotionScore) * 100
        )
      : null;

  const hasCognitionCard = summary.bias_types_detected !== null || summary.cbt_intervened !== null;

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <ScrollView
          contentContainerClassName="px-5 pb-8 gap-4"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" className="text-center text-fg py-5">
            오늘 대화 요약
          </ThemedText>

          {summary.avg_emotion_score !== null && (
            <SectionCard title="주요 감정">
              <View className="flex-row items-end gap-2">
                <ThemedText type="title" className="text-primary">
                  {summary.avg_emotion_score}
                </ThemedText>
                <ThemedText type="small" className="text-chat-subtext mb-1">
                  / 100
                </ThemedText>
                {percentChange !== null && (
                  <ThemedText type="small" className="text-chat-subtext mb-1 ml-auto">
                    {percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`}
                  </ThemedText>
                )}
              </View>
            </SectionCard>
          )}

          {summary.summary && (
            <SectionCard title="대화 요약">
              <ThemedText type="default" className="text-fg-sub">
                {summary.summary}
              </ThemedText>
            </SectionCard>
          )}

          {hasCognitionCard && (
            <SectionCard title="인지·CBT">
              <View className="gap-2">
                <BiasTypesDisplay biasTypesDetected={summary.bias_types_detected} />
                {summary.cbt_intervened !== null && (
                  <ThemedText type="small" className="text-fg-sub">
                    {summary.cbt_intervened
                      ? 'CBT 기법을 활용한 개입이 있었어요'
                      : '이번 대화에서는 CBT 개입이 없었어요'}
                  </ThemedText>
                )}
              </View>
            </SectionCard>
          )}

          <Button variant="primary" size="lg" onPress={() => router.push('/(main)/chat/end')}>
            기록 저장하기
          </Button>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
