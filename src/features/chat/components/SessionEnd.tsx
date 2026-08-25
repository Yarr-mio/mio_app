import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { getOnboardingCharacterById } from '@/constants/characters';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useBlockTabPressStackReset } from '@/hooks/useBlockTabPressStackReset';
import { useSelectedCharacterId } from '@/hooks/useSelectedCharacterId';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';

export function SessionEnd() {
  // SessionStart와 동일하게 store가 아닌 여기서 읽는다 — store의 characterId는 reset() 시 기본값('mio')으로
  // 돌아가는데, 이 화면은 이탈 시 reset()이 돌면서도 (수정 전) 스택에 남아 재노출될 수 있었음
  // (chat-trouble-shoot/08 원인 C). dismissAll() 수정으로 재노출 자체는 막혔지만 이중 안전망으로 유지
  const characterId = useSelectedCharacterId();
  const character = getOnboardingCharacterById(characterId);
  const navigation = useNavigation();

  // iOS 스와이프 백 차단 — `_layout.tsx`의 정적 옵션만으로는 적용이 누락되는 경우가 있어 동적으로도 보강
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  // 채팅 탭 재클릭으로 인한 스택 리셋 차단 — 종료 지점 화면의 이탈 차단 정책을 요약 화면과 맞춘다
  useBlockTabPressStackReset();

  // Android 하드웨어 백 / router.back() 같은 프로그램적 뒤로가기(POP/GO_BACK)만 차단한다. usePreventRemove는
  // 액션 타입을 가리지 않고 모두 막아서 handleGoHome의 dismissAll()(POP_TO_TOP)까지 무효화시켰다
  // (chat-trouble-shoot/09) — beforeRemove를 직접 구독해 액션 타입으로 구분한다.
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (e.data.action.type === 'POP' || e.data.action.type === 'GO_BACK') {
        e.preventDefault();
      }
    });
  }, [navigation]);

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
    // 탭 전환(JUMP_TO) 전에, 아직 chat 탭이 포커스된 상태에서 먼저 스택을 index로 비운다 — 순서를
    // 바꾸면(탭 전환 후 호출) chat이 더 이상 "현재" 스택이 아니라 dismissAll() 타겟이 보장되지 않음
    // (chat-trouble-shoot/08 원인 A). reset()은 useFocusEffect cleanup에서 처리됨
    router.dismissAll();
    router.replace('/(main)/home');
  }

  return (
    <View className="flex-1 bg-midnight">
      <ChatBackground />
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
