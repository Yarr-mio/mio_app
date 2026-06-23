import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { getOnboardingCharacterById } from '@/constants/characters';
import { setMockStartSessionError } from '@/api/endpoints/chat';
import { USE_MOCK } from '@/constants/config';
import { useStartChatSession } from '@/features/chat/hooks/useChat';
import { useChatStore } from '@/features/chat/store/chatStore';
import type { OnboardingCharacterId } from '@/constants/characters';
import { Pressable, View } from 'react-native';

// TODO mock 전용: 10번 작업(세션 시작 에러 분기) 수동 확인용 임시 버튼. 11번 작업(실제 SSE 연동)에서 제거
function MockStartSessionErrorButtons({
  characterId,
  onStart,
}: {
  characterId: OnboardingCharacterId;
  onStart: (characterId: OnboardingCharacterId) => void;
}) {
  if (!USE_MOCK) return null;

  const triggers = [
    { label: '온보딩 필요', code: 'ONBOARDING_REQUIRED' as const },
    { label: '이미 진행중', code: 'SESSION_ALREADY_ACTIVE' as const },
    { label: '기타 에러', code: 'OTHER' as const },
  ];

  return (
    <View className="flex-row justify-center gap-2">
      {triggers.map((trigger) => (
        <Pressable
          key={trigger.code}
          onPress={() => {
            setMockStartSessionError(trigger.code);
            onStart(characterId);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${trigger.label} 에러 테스트`}
          className="px-3 py-1.5 rounded-xl border border-line-md"
        >
          <ThemedText type="small" className="text-fg-dim">
            {trigger.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export function SessionStart() {
  // TODO: useCharacter() 훅으로 서버에서 수신 후 대체 (현재 store 기본값 'mio' 사용)
  const characterId = useChatStore((s) => s.characterId);
  const character = getOnboardingCharacterById(characterId);
  const { mutate: startSession, isPending } = useStartChatSession();

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <View className="items-center pt-8">
          <ThemedText type="title" className="text-center text-fg">
            {character.name}와 대화하기
          </ThemedText>
        </View>
        <View className="flex-1 items-center justify-center gap-8 px-8">
          <ThemedText className="text-center text-fg text-2xl font-bold leading-9">
            {character.name}와 함께{'\n'}이야기를 시작해 볼까요?
          </ThemedText>
          <CharacterAvatar characterId={characterId} size="lg" />
          <ThemedText type="defaultRegular" className="text-center text-fg-soft">
            지금부터 편안하게 마음을 이야기해 보세요{'\n'}
            {character.name}가 곁에서 함께할게요 😊
          </ThemedText>
        </View>
        <View className="px-8 pb-6 gap-3">
          <MockStartSessionErrorButtons characterId={characterId} onStart={startSession} />
          <Button
            variant="primary"
            size="lg"
            loading={isPending}
            onPress={() => {
              setMockStartSessionError(null);
              startSession(characterId);
            }}
          >
            대화 시작하기
          </Button>
          <ThemedText type="small" className="text-center text-fg-muted">
            감정 체크는 홈에서 언제든 다시 할 수 있어요
          </ThemedText>
        </View>
      </ScreenContainer>
    </View>
  );
}
