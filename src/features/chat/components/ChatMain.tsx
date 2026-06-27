import { useEffect } from 'react';
import { AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { getOnboardingCharacterById } from '@/constants/characters';
import { USE_MOCK } from '@/constants/config';
import {
  setMockEndSessionErrorCode,
  setMockActiveSessionEndedOnNextFetch,
  setMockSendMessageErrorCode,
} from '@/api/endpoints/chat';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useChatSse } from '@/features/chat/hooks/useChatSse';
import { useEndChatSession, useSubmitCbtEmotionScore } from '@/features/chat/hooks/useChat';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ChatInputBar } from '@/features/chat/components/ChatInputBar';
import { EmotionScorePanel } from '@/features/chat/components/EmotionScorePanel';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import type { ChatMessage } from '@/types/chat';

// TODO mock 전용: 30분 자동종료(2026-06-27 plan) 수동 확인용 임시 버튼. 검증 끝나면 제거
function MockSessionEndedButtons({
  sessionId,
  onSend,
  onEnd,
}: {
  sessionId: string;
  onSend: (content: string) => void;
  onEnd: (sessionId: string) => void;
}) {
  if (!USE_MOCK) return null;

  return (
    <View className="flex-row justify-center gap-2 pb-2">
      <Pressable
        onPress={() => {
          setMockSendMessageErrorCode('GONE');
          onSend('mock 트리거');
        }}
        accessibilityRole="button"
        accessibilityLabel="세션 만료(410) 에러 테스트"
        className="px-3 py-1.5 rounded-xl border border-line-md"
      >
        <ThemedText type="small" className="text-fg-dim">
          세션만료 테스트
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => {
          setMockEndSessionErrorCode('GONE');
          onEnd(sessionId);
        }}
        accessibilityRole="button"
        accessibilityLabel="이미 종료된 세션 종료 시도 테스트"
        className="px-3 py-1.5 rounded-xl border border-line-md"
      >
        <ThemedText type="small" className="text-fg-dim">
          중복종료 테스트
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => setMockActiveSessionEndedOnNextFetch(sessionId)}
        accessibilityRole="button"
        accessibilityLabel="포그라운드 복귀 시 세션 종료 감지 테스트 준비"
        className="px-3 py-1.5 rounded-xl border border-line-md"
      >
        <ThemedText type="small" className="text-fg-dim">
          포그라운드 테스트 준비
        </ThemedText>
      </Pressable>
    </View>
  );
}

export function ChatMain() {
  const characterId = useChatStore((s) => s.characterId);
  const sessionId = useChatStore((s) => s.sessionId);
  const messages = useChatStore((s) => s.messages);
  const isAiTyping = useChatStore((s) => s.isAiTyping);
  const emotionScoringActive = useChatStore((s) => s.emotionScoringActive);
  const pendingEmotionScore = useChatStore((s) => s.pendingEmotionScore);
  const emotionScoreTargetId = useChatStore((s) => s.emotionScoreTargetId);
  const character = getOnboardingCharacterById(characterId);
  // session_meta가 만든 빈 AI placeholder는 실제 콘텐츠가 도착하기 전까지 렌더링에서 제외 —
  // 그 사이에는 TypingIndicator(isAiTyping)만 보여준다
  const visibleMessages = messages.filter((m) => !(m.role === 'ai' && m.content === ''));

  const { sendMessage, isStreaming } = useChatSse(sessionId);
  const { mutate: endChatSession } = useEndChatSession();
  const { mutate: submitEmotionScore } = useSubmitCbtEmotionScore();

  // 앱이 백그라운드로 전환되면(홈으로 나가기, 강제 종료 직전 단계 등) 대화 화면 이탈로 간주해 세션 종료 —
  // 'inactive'는 제어 센터/알림 등 일시적 전환이라 제외, 완전한 백그라운드 진입만 트리거로 사용
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' && sessionId) {
        endChatSession(sessionId);
      }
    });

    return () => subscription.remove();
  }, [sessionId, endChatSession]);

  function handleConfirmEmotionScore(score: number) {
    if (!emotionScoreTargetId) return;
    submitEmotionScore({ reconstructionId: emotionScoreTargetId, score });
  }

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <ChatHeader
          characterId={characterId}
          onEnd={() => sessionId && endChatSession(sessionId)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <FlatList<ChatMessage>
            data={[...visibleMessages].reverse()}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                characterId={characterId}
                characterName={character.name}
              />
            )}
            ListHeaderComponent={isAiTyping ? <TypingIndicator /> : null}
            contentContainerClassName="gap-4 px-4 py-4"
          />
          {sessionId && (
            <MockSessionEndedButtons
              sessionId={sessionId}
              onSend={sendMessage}
              onEnd={endChatSession}
            />
          )}
          {emotionScoringActive ? (
            <EmotionScorePanel
              initialScore={pendingEmotionScore}
              onConfirm={handleConfirmEmotionScore}
            />
          ) : (
            <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
