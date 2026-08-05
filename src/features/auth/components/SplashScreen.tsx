import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { SPLASH_DURATION_MS } from '@/constants/config';
import { AuthTextClasses, SplashColors } from '@/constants/theme';

// 정적 번들 배경 이미지 prefetch 불필요
const SPLASH_BACKGROUND = require('@/assets/images/background/splash_background.png');

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export default function SplashScreen({
  onFinish,
  durationMs = SPLASH_DURATION_MS,
}: SplashScreenProps) {
  const hasHiddenNativeRef = useRef(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);

  const isSplashReady = isLayoutReady && isImageReady;

  useEffect(() => {
    if (!isSplashReady || hasHiddenNativeRef.current) {
      return;
    }

    hasHiddenNativeRef.current = true;
    // 레이아웃 준비 후 네이티브 스플래시 숨김
    void ExpoSplashScreen.hideAsync();
  }, [isSplashReady]);

  useEffect(() => {
    if (!isSplashReady) {
      return undefined;
    }

    const timerId = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(timerId);
    };
  }, [isSplashReady, onFinish, durationMs]);

  return (
    <View className="flex-1" style={{ backgroundColor: SplashColors.background }}>
      <ImageBackground
        source={SPLASH_BACKGROUND}
        style={{ flex: 1 }}
        imageStyle={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onLayout={() => {
          setIsLayoutReady(true);
        }}
        onLoad={() => {
          setIsImageReady(true);
        }}
        onError={() => {
          // 로드 실패 시 네이티브 스플래시 정체 방지
          setIsImageReady(true);
        }}
      >
        {isImageReady ? (
          <View className="flex-1 items-center justify-center">
            <View className="items-center gap-6">
              <Text className={AuthTextClasses.appTitle}>MIO</Text>
              <ThemedText type="smallTitle" className="text-sm tracking-[0.25em] text-fg-muted">
                마음의 이야기
              </ThemedText>
            </View>
          </View>
        ) : null}
      </ImageBackground>
    </View>
  );
}
