import { ChatBackground } from '@/components/themed/ChatBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  SUMMARY_LOADING_EXIT_BUTTON_LABEL,
  SUMMARY_LOADING_EXIT_NOTICE,
} from '@/constants/chatSummaryLoading';
import {
  getCharacterNameById,
  getReportCharacterLoadingImage,
  type OnboardingCharacterId,
} from '@/constants/characters';
import {
  SUMMARY_LOADING_BREATH_DURATION_MS,
  SUMMARY_LOADING_MESSAGE_FADE_DURATION_MS,
} from '@/constants/config';
import { SummaryLoadingClasses, SummaryLoadingLayout } from '@/constants/theme';
import { useSummaryLoadingStage } from '@/features/chat/hooks/useSummaryLoadingStage';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SessionSummaryLoadingProps {
  characterId: OnboardingCharacterId;
  onExit: () => void;
}

/**
 * 요약 생성 대기 화면.
 *
 * 진행률·단계 인디케이터는 의도적으로 넣지 않는다 — 서버가 진행 단계를 주지 않아 어떤 수치도
 * 사실이 아니고, 15초를 넘겼을 때 그 거짓이 그대로 드러나기 때문이다. "멈춰 있지 않다"는 신호는
 * 순차 문구와 무한 breathing 애니메이션이 담당한다.
 * (`withRepeat`은 기본값 `ReduceMotion.System` — 시스템 "동작 줄이기" 설정이면 알아서 멈춘다)
 */
export function SessionSummaryLoading({ characterId, onExit }: SessionSummaryLoadingProps) {
  const characterName = getCharacterNameById(characterId);
  const { message, canExit } = useSummaryLoadingStage(characterName);
  const { characterImageSize, breathScaleMax } = SummaryLoadingLayout;

  const breathScale = useSharedValue(1);
  const messageOpacity = useSharedValue(1);

  useEffect(() => {
    breathScale.value = withRepeat(
      withTiming(breathScaleMax, { duration: SUMMARY_LOADING_BREATH_DURATION_MS }),
      -1,
      true
    );
  }, [breathScale, breathScaleMax]);

  // 문구가 바뀔 때마다 0에서 다시 페이드인 — 텍스트가 툭 갈리지 않게
  useEffect(() => {
    messageOpacity.value = 0;
    messageOpacity.value = withTiming(1, {
      duration: SUMMARY_LOADING_MESSAGE_FADE_DURATION_MS,
    });
  }, [message, messageOpacity]);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathScale.value }] }));
  const messageStyle = useAnimatedStyle(() => ({ opacity: messageOpacity.value }));

  return (
    <View className={SummaryLoadingClasses.root}>
      <ChatBackground />

      <View className={SummaryLoadingClasses.hero}>
        <Animated.View style={breathStyle}>
          <Image
            source={getReportCharacterLoadingImage(characterId)}
            style={{ width: characterImageSize, height: characterImageSize }}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View style={messageStyle}>
          <ThemedText type="default" className={SummaryLoadingClasses.message}>
            {message}
          </ThemedText>
        </Animated.View>
      </View>

      {canExit && (
        <View className={SummaryLoadingClasses.exitSection}>
          <ThemedText type="small" className={SummaryLoadingClasses.exitNotice}>
            {SUMMARY_LOADING_EXIT_NOTICE}
          </ThemedText>
          <Button variant="ghost" size="md" onPress={onExit}>
            {SUMMARY_LOADING_EXIT_BUTTON_LABEL}
          </Button>
        </View>
      )}
    </View>
  );
}
