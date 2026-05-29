import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
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
      <View className="items-center gap-6">
        <Text
          className="tracking-[0.22em] text-ink-night"
          // Custom font exception: ThemedText(type="title")의 기본 font-bold 처리로 fontFamily override가 불안정해 RN Text + style로 직접 지정
          style={{ fontFamily: 'NanumMyeongjoExtraBold', fontSize: 45 }}
        >
          MIO
        </Text>
        <ThemedText type="smallTitle" className="text-sm tracking-[0.25em]  text-fg-muted">
          마음의 이야기
        </ThemedText>
      </View>
    </View>
  );
}
