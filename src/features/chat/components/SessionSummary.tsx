import { claimSummaryView } from '@/analytics/summaryViewGuard';
import { track } from '@/analytics/track';
import { queryKeys } from '@/api/queryKeys';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { EMOTION_META } from '@/constants/emotions';
import { BiasTypesDisplay } from '@/features/chat/components/BiasTypesDisplay';
import { KeyThoughtsList } from '@/features/chat/components/KeyThoughtsList';
import { SessionSummaryLoading } from '@/features/chat/components/SessionSummaryLoading';
import { SessionTodoList } from '@/features/chat/components/SessionTodoList';
import { useSessionSummary } from '@/features/chat/hooks/useChat';
import { releaseSessionSummaryNavigation } from '@/features/chat/services/sessionSummaryNavigation';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useBlockTabPressStackReset } from '@/hooks/useBlockTabPressStackReset';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import type { SessionSummaryResponse } from '@/types/chat';
import { storage } from '@/utils/storage';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';

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
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  // SessionEnd와 동일하게 store가 아닌 여기서 읽는다 — store의 characterId는 reset() 시 기본값으로
  // 되돌아가는데, 나가기 핸들러가 바로 그 reset()을 호출한다
  const characterId = useSelectedCharacterId();

  const { data: summary, isLoading, refetch } = useSessionSummary(sessionId);
  // 직전 세션은 화면에 그리는 대상이 아니라 감정 변화율 계산용 숫자만 필요하다. useSessionSummary로 다시
  // 부르면 GET .../summary의 부수효과로 그 세션을 "열람" 처리해버리므로, 이미 캐시된 값만 읽고
  // 없으면(예: 두 세션 사이 앱 재시작) 비교 없이 넘어간다
  const queryClient = useQueryClient();
  const previousSummary = previousSessionId
    ? queryClient.getQueryData<SessionSummaryResponse>(queryKeys.chat.session(previousSessionId))
    : undefined;

  // iOS 스와이프 백 차단 — `_layout.tsx`의 정적 옵션만으로는 적용이 누락되는 경우가 있어 동적으로도 보강
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  // 채팅 탭 재클릭으로 이 화면이 스택에서 걷혀나가는 세 번째 이탈로를 막는다 — 걷혀나가면
  // chat/index가 sessionPhase 'ended' 빈 화면으로 남는다
  useBlockTabPressStackReset();

  // Android 하드웨어 백 / router.back() 같은 프로그램적 뒤로가기(POP/GO_BACK)만 차단한다. usePreventRemove는
  // 액션 타입을 가리지 않고 모두 막아서 SessionEnd의 dismissAll()(POP_TO_TOP)까지 무효화시켰다
  // (chat-trouble-shoot/09) — beforeRemove를 직접 구독해 액션 타입으로 구분한다. sessionId가 없을 때는
  // (자가복구 redirect가 동작해야 하므로) 리스너 자체를 비활성화 — 기존 !!sessionId 게이트와 동등하게 유지
  useEffect(() => {
    if (!sessionId) return;
    return navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'POP' || e.data.action.type === 'GO_BACK') {
        e.preventDefault();
      }
    });
  }, [navigation, sessionId]);

  // sessionId 없이 마운트되는 경로가 있다면(chat-trouble-shoot/07 참고, 정확한 트리거 미확정) 검은
  // 화면으로 멈춰있지 않도록 index로 돌려보내 기존 활성 세션 판별 로직이 다시 처리하게 한다.
  // isFocused 가드 필수 — 이 화면이 블러된 채 스택에 남아있는 동안 reset()으로 sessionId가 사라지면
  // (chat-trouble-shoot/08 원인 D) 보고 있지도 않은 화면에서 추가 내비게이션이 발생해 다른 화면(홈 등)을
  // 덮어써버림
  useEffect(() => {
    if (!sessionId && isFocused) {
      router.replace('/(main)/chat');
    }
  }, [sessionId, isFocused]);

  // ⚠️ 발행을 useSessionSummary(폴링 useQuery)에 걸면 요약이 생성될 때까지 한 화면 진입에 수 건이
  // 나간다. 이 이벤트만 뒷단 중복 제거 대상이 아니라(반복 조회가 곧 값) 부푼 값이 그대로
  // Core Action 건수로 들어가므로, 화면 포커스 1회 + sessionId별 가드로 못박는다.
  // 가드는 모듈 스코프다 — 인스턴스별 ref로 두면 이 화면이 두 번 마운트될 때 각자 1건씩 발행한다
  useEffect(() => {
    if (!isFocused || !sessionId || !claimSummaryView(sessionId)) {
      return;
    }

    track('session_summary_viewed', { chat_session_id: sessionId });
  }, [isFocused, sessionId]);

  if (!sessionId) {
    return (
      <View className="flex-1 bg-midnight">
        <ChatBackground />
      </View>
    );
  }

  if (isLoading || !summary || summary.summary_status === 'pending') {
    // 요약이 오래 걸릴 때 사용자가 직접 나가는 유일한 경로. 순서를 바꾸면 안 된다:
    // ① 이동 claim을 풀어야 이 세션으로 다시 보낼 수 있고 ② 영속 가드를 지워야 채팅 탭 재진입
    // 리다이렉트가 살아나며 ③ reset()을 빠뜨리면 sessionPhase가 'ended'로 남아 chat/index가
    // 빈 배경으로 고착된다. ④⑤는 SessionEnd.handleGoHome과 같은 이유로 순서 고정 —
    // 탭을 먼저 바꾸면 dismissAll()의 타겟이 보장되지 않는다.
    // 이탈 차단 3중 로직은 그대로 둔다 — dismissAll()은 POP_TO_TOP이라 필터를 통과한다
    const handleExit = () => {
      releaseSessionSummaryNavigation(sessionId);
      void storage.chatRedirectedSessionId.delete();
      useChatStore.getState().reset();
      router.dismissAll();
      router.replace('/(main)/home');
    };

    return <SessionSummaryLoading characterId={characterId} onExit={handleExit} />;
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

  const hasCognitionCard =
    (summary.bias_types_detected !== null && summary.bias_types_detected.length > 0) ||
    summary.cbt_intervened === false ||
    (summary.key_thoughts !== null && summary.key_thoughts.length > 0);

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

          {(summary.avg_emotion_score !== null || summary.dominant_emotion !== null) && (
            <SectionCard title="주요 감정">
              <View className="gap-2">
                {summary.dominant_emotion !== null && (
                  <ThemedText type="smallBold" className="text-fg-sub">
                    {EMOTION_META[summary.dominant_emotion].label}
                  </ThemedText>
                )}
                {summary.avg_emotion_score !== null && (
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
              <View className="gap-3">
                <BiasTypesDisplay biasTypesDetected={summary.bias_types_detected} />
                {summary.cbt_intervened === false && (
                  <ThemedText type="small" className="text-fg-sub">
                    이번 대화에서는 CBT 개입이 없었어요
                  </ThemedText>
                )}
                <KeyThoughtsList keyThoughts={summary.key_thoughts} />
              </View>
            </SectionCard>
          )}

          {summary.todos.length > 0 && (
            <SectionCard title="추천 행동">
              <SessionTodoList todos={summary.todos} />
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
