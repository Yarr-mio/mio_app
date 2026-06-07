import { CharacterAvatar } from '@/components/character/CharacterAvatar';
import { useChatStore } from '@/features/chat/store/chatStore';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={{ opacity }} className="w-2 h-2 rounded-full bg-fg-dim" />;
}

export function TypingIndicator() {
  const characterId = useChatStore((s) => s.characterId);

  return (
    <View className="flex-row gap-2 pr-12">
      <CharacterAvatar characterId={characterId} size="sm" background />
      <View className="bg-surface-md rounded-2xl px-4 py-3">
        <View className="flex-row gap-1.5 items-center h-5">
          <AnimatedDot delay={0} />
          <AnimatedDot delay={200} />
          <AnimatedDot delay={400} />
        </View>
      </View>
    </View>
  );
}
