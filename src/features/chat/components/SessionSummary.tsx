import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EMOTION_META } from '@/constants/emotions';
import { PrimaryColors } from '@/constants/theme';
import { useSaveChatSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { Image } from 'expo-image';
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
  const summary = useChatStore((s) => s.summary);
  const sessionId = useChatStore((s) => s.sessionId);
  const { mutate: saveSession, isPending } = useSaveChatSession();

  if (!summary) {
    // TODO: Memory 도메인 폴링 전략 미결 — summary_status 'pending' 처리 필요
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

  const emotionMeta = EMOTION_META[summary.primaryEmotion.emotionType];

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

          <SectionCard title="주요 감정">
            <View className="flex-row items-center gap-3">
              <Image
                source={emotionMeta.image}
                style={{ width: 48, height: 48 }}
                contentFit="contain"
              />
              <View className="gap-1">
                <ThemedText type="defaultBold" className="text-fg">
                  {emotionMeta.label}
                </ThemedText>
                <ThemedText type="small" className="text-chat-subtext">
                  {`강도 ${summary.primaryEmotion.intensity}/10`}
                </ThemedText>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="핵심 내용">
            <View className="gap-2">
              {summary.keyPoints.map((point, i) => (
                <ThemedText key={i} type="default" className="text-fg-sub">
                  • {point}
                </ThemedText>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="새로운 생각">
            <View className="gap-2">
              {summary.newThoughts.map((thought, i) => (
                <ThemedText key={i} type="default" className="text-fg-sub">
                  • {thought}
                </ThemedText>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="오늘의 작은 행동">
            <View className="flex-row flex-wrap gap-2">
              {summary.recommendedActions.map((action) => (
                <Chip key={action} label={action} />
              ))}
            </View>
          </SectionCard>

          <Button
            variant="primary"
            size="lg"
            loading={isPending}
            onPress={() => {
              if (!sessionId || isPending) return;
              saveSession(sessionId);
            }}
          >
            기록 저장하기
          </Button>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
