import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { SPLASH_DURATION_MS } from '@/constants/config';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export default function SplashScreen({
  onFinish,
  durationMs = SPLASH_DURATION_MS,
}: SplashScreenProps) {
  useEffect(() => {
    const timerId = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [onFinish, durationMs]);

  return (
    <View className="flex-1 items-center justify-center bg-background-dark">
      <View className="items-center">
        <Text className="text-5xl font-bold tracking-widest text-ink-night">MIO</Text>
        <Text className="mt-3 text-base text-ink-dim-night">마음의 이야기</Text>
      </View>
    </View>
  );
}
