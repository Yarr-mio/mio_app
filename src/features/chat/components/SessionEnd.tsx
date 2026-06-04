import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';

export function SessionEnd() {
  const characterId = useChatStore((s) => s.characterId);
  const character = getOnboardingCharacterById(characterId);

  useFocusEffect(
    useCallback(() => {
      // 이 화면에 포커스될 때 sessionPhase가 'ended'가 아니면 (reset 후 재진입)
      // chat 스택을 루트(index)로 되돌린다
      if (useChatStore.getState().sessionPhase !== 'ended') {
        router.dismissAll();
      }

      return () => {
        // 어떤 방식으로 이 화면을 나가든 (버튼, 하단 탭 등) 세션 상태 초기화
        useChatStore.getState().reset();
      };
    }, [])
  );

  function handleGoHome() {
    // reset은 useFocusEffect cleanup에서 처리되므로 navigation만 호출
    router.replace('/(main)/home');
  }

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 bg-transparent">
        <View className="flex-1 items-center justify-center gap-6 px-8">
          {/* TODO: variant="planet" 에셋 추가 후 variant prop 전달 */}
          <CharacterAvatar characterId={characterId} size="lg" variant="planet" />
          <View className="items-center gap-3">
            <ThemedText type="title" className="text-center text-fg">
              오늘도 잘 하셨어요
            </ThemedText>
            <ThemedText type="default" className="text-center text-fg-soft leading-6">
              {character.name}와 나눈 오늘의 대화가{'\n'}
              마음속에 작은 씨앗이 되길 바라요.{'\n'}
              내일도 함께해요.
            </ThemedText>
          </View>
        </View>
        <View className="px-8 pb-6">
          <Button variant="primary" size="lg" onPress={handleGoHome}>
            홈으로 돌아가기
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
