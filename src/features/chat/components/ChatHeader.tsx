import { ThemedText } from '@/components/themed/ThemedText';
import type { OnboardingCharacterId } from '@/constants/characters';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { Pressable, View } from 'react-native';

interface ChatHeaderProps {
  characterId: OnboardingCharacterId;
  onEnd?: () => void;
}

// TODO: 임시 테스트 버튼 — 소크라테스 질문 + 감정 강도 슬라이드 시나리오 확인용. 작업 완료 후 제거.
function TestSocraticFlowButton() {
  const handlePress = () => {
    useChatStore.getState().addMessage({
      id: `test-socratic-${Date.now()}`,
      role: 'ai',
      type: 'socratic',
      content: '지금 느끼는 그 감정이, 어떤 상황에서 가장 강하게 떠올랐나요?',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="소크라테스 질문 및 감정 강도 슬라이드 테스트"
      className="px-3 py-1.5 rounded-xl border border-line-md mr-2"
    >
      <ThemedText type="small" className="text-fg-dim">
        테스트
      </ThemedText>
    </Pressable>
  );
}

export function ChatHeader({ characterId, onEnd }: ChatHeaderProps) {
  const character = getOnboardingCharacterById(characterId);

  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-3 h-3 rounded-full bg-success" />
        <View className="flex-row items-center">
          <ThemedText type="smallTitle2" className="text-fg">
            {character.name}
          </ThemedText>
          <ThemedText type="smallTitle" className="text-fg-dim">
            {' · 함께 있어요'}
          </ThemedText>
        </View>
      </View>
      <TestSocraticFlowButton />
      {onEnd && (
        <Pressable
          onPress={onEnd}
          accessibilityRole="button"
          accessibilityLabel="대화 종료"
          className="px-3 py-1.5 rounded-xl border border-line-md"
        >
          <ThemedText type="small" className="text-fg-dim">
            종료
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}
