import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { getOnboardingCharacterById } from '@/constants/characters';
import { PrimaryColors } from '@/constants/theme';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useChatSse } from '@/features/chat/hooks/useChatSse';
import { useEndChatSession, useSubmitCbtEmotionScore } from '@/features/chat/hooks/useChat';
import { useSessionMessages } from '@/features/chat/hooks/useSessionMessages';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { ChatHistoryFailureBanner } from '@/features/chat/components/ChatHistoryFailureBanner';
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
  const { isRestoring, isRestoreFailed, canRetryRestore, retryRestore } = useSessionMessages();
  // 복원 실패 배너는 사용자가 직접 닫을 때까지 유지한다 — 세션이 바뀌면 ChatMain이 언마운트되며 초기화된다
  const [isRestoreFailureDismissed, setIsRestoreFailureDismissed] = useState(false);
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
          {isRestoreFailed && !isRestoreFailureDismissed ? (
            <ChatHistoryFailureBanner
              onRetry={canRetryRestore ? retryRestore : undefined}
              onDismiss={() => setIsRestoreFailureDismissed(true)}
            />
          ) : null}
          {isRestoring ? (
            // 복원 중에는 빈 목록 대신 로딩을 보여준다 — FlatList가 inverted라
            // ListEmptyComponent를 쓰면 뒤집혀 그려지므로 목록 바깥에 둔다
            <View className="flex-1 items-center justify-center gap-4">
              <ActivityIndicator color={PrimaryColors.DEFAULT} size="large" />
              <ThemedText type="small" className="text-fg-muted">
                이전 대화를 불러오는 중...
              </ThemedText>
            </View>
          ) : (
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
          )}
          {emotionScoringActive ? (
            <EmotionScorePanel
              initialScore={pendingEmotionScore}
              onConfirm={handleConfirmEmotionScore}
              onScoreChange={setPendingEmotionScore}
            />
          ) : (
            // 복원 중에는 전송을 막는다 — 이력이 도착하기 전에 보낸 메시지가 있으면
            // "전부 아니면 전무" 시딩이 성립하지 않아 그 세션은 이력을 영영 못 받는다
            <ChatInputBar onSend={sendMessage} disabled={isStreaming || isRestoring} />
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    </View>
  );
}
