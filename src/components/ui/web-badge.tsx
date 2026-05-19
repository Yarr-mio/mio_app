import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import React from 'react';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed/themed-text';
import { ThemedView } from '@/components/themed/themed-view';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView className="p-8 items-center gap-2">
      <ThemedText type="code" className="text-center text-ink-dim dark:text-ink-dim-night">
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        className="w-[123px]"
        style={{ aspectRatio: 123 / 24 }}
      />
    </ThemedView>
  );
}
