import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Label } from '@/components/ui/Label';
import { EMOTION_META } from '@/constants/emotions';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useEndChatSession, useSaveChatSession } from '@/features/chat/hooks/useChat';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-surface rounded-card p-4 gap-3">
      <ThemedText type="small" className="text-white/50">
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
        <ActivityIndicator color="#7060E0" size="large" />
        <ThemedText type="small" className="text-white/50 mt-4">
          대화 요약을 불러오는 중...
        </ThemedText>
      </View>
    );
  }

  const emotionMeta = EMOTION_META[summary.primaryEmotion.emotionType];
  const changeSign = summary.primaryEmotion.percentChange >= 0 ? '+' : '';

  return (
    <View className="flex-1 bg-midnight">
      <ScreenContainer className="flex-1 bg-transparent">
        <ScrollView
          contentContainerClassName="px-5 pb-8 gap-4"
          showsVerticalScrollIndicator={false}
        >
          <ThemedText type="title" className="text-white pt-4">
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
                <ThemedText type="defaultBold" className="text-white">
                  {emotionMeta.label}
                </ThemedText>
                <Label label={`강도 ${summary.primaryEmotion.intensity}/10`} />
              </View>
              <ThemedText type="small" className="text-white/50 ml-auto">
                {changeSign}
                {summary.primaryEmotion.percentChange}%
              </ThemedText>
            </View>
          </SectionCard>

          <SectionCard title="핵심 내용">
            <View className="gap-2">
              {summary.keyPoints.map((point, i) => (
                <ThemedText key={i} type="default" className="text-white/80">
                  • {point}
                </ThemedText>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="새로운 생각">
            <View className="gap-2">
              {summary.newThoughts.map((thought, i) => (
                <ThemedText key={i} type="default" className="text-white/80">
                  • {thought}
                </ThemedText>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="오늘의 적절 행동">
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
            onPress={() => saveSession(sessionId ?? '')}
          >
            기록 저장하기
          </Button>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
}
