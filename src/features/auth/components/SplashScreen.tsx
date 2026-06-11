import { useEffect } from 'react';
import { ImageBackground, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { SPLASH_DURATION_MS } from '@/constants/config';
import { AuthTextClasses } from '@/constants/theme';

const SPLASH_BACKGROUND = require('@/assets/images/background/splash_background.png');

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
    <ImageBackground
      source={SPLASH_BACKGROUND}
      style={{ flex: 1 }}
      imageStyle={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View className="flex-1 items-center justify-center">
        <View className="items-center gap-6">
          <Text className={AuthTextClasses.appTitle}>MIO</Text>
          <ThemedText type="smallTitle" className="text-sm tracking-[0.25em]  text-fg-muted">
            마음의 이야기
          </ThemedText>
        </View>
      </View>
    </ImageBackground>
  );
}
