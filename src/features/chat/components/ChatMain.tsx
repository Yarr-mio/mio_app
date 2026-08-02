import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useChatSse } from '@/features/chat/hooks/useChatSse';
import { useEndChatSession, useSubmitCbtEmotionScore } from '@/features/chat/hooks/useChat';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ChatInputBar } from '@/features/chat/components/ChatInputBar';
import { EmotionScorePanel } from '@/features/chat/components/EmotionScorePanel';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import type { ChatMessage } from '@/types/chat';

export function ChatMain() {
  const characterId = useChatStore((s) => s.characterId);
  const sessionId = useChatStore((s) => s.sessionId);
  const messages = useChatStore((s) => s.messages);
  const isAiTyping = useChatStore((s) => s.isAiTyping);
  const emotionScoringActive = useChatStore((s) => s.emotionScoringActive);
  const pendingEmotionScore = useChatStore((s) => s.pendingEmotionScore);
  const emotionScoreTargetId = useChatStore((s) => s.emotionScoreTargetId);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const character = getOnboardingCharacterById(characterId);
  // session_meta가 만든 빈 AI placeholder는 실제 콘텐츠가 도착하기 전까지 렌더링에서 제외 —
  // 그 사이에는 TypingIndicator(isAiTyping)만 보여준다
  const visibleMessages = messages.filter((m) => !(m.role === 'ai' && m.content === ''));

  const setPendingEmotionScore = useChatStore((s) => s.setPendingEmotionScore);

  const { sendMessage, isStreaming } = useChatSse(sessionId);
  const { mutate: endChatSession } = useEndChatSession();
  const { mutate: submitEmotionScore, mutateAsync: submitEmotionScoreAsync } =
    useSubmitCbtEmotionScore();

  // 감정 점수 패널이 떠 있는 상태로 세션이 끝나면(종료 버튼) 마지막 슬라이더 값을
  // 먼저 제출해 데이터 손실을 막는다 — 제출이 실패해도 세션 종료 자체는 막지 않음
  async function endSessionWithPendingEmotionScore(currentSessionId: string) {
    if (emotionScoringActive && emotionScoreTargetId) {
      try {
        await submitEmotionScoreAsync({
          reconstructionId: emotionScoreTargetId,
          score: pendingEmotionScore,
        });
      } catch {
        // 에러 알림/패널 정리는 useSubmitCbtEmotionScore의 onError가 처리
      }
    }
    endChatSession(currentSessionId);
  }

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
          onEnd={() => sessionId && void endSessionWithPendingEmotionScore(sessionId)}
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
                isStreaming={item.id === streamingMessageId}
              />
            )}
            ListHeaderComponent={isAiTyping ? <TypingIndicator /> : null}
            contentContainerClassName="gap-4 px-4 py-4"
          />
          {emotionScoringActive ? (
            <EmotionScorePanel
              initialScore={pendingEmotionScore}
              onConfirm={handleConfirmEmotionScore}
              onScoreChange={setPendingEmotionScore}
            />
          ) : (
            <ChatInputBar onSend={sendMessage} disabled={isStreaming} />
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
