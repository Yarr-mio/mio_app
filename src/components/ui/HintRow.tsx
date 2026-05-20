import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed/ThemedText';
import { ThemedView } from '@/components/themed/ThemedView';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View className="flex-row justify-between">
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" className="rounded-md py-0.5 px-2">
        <ThemedText type="small" className="text-ink-dim dark:text-ink-dim-night">
          {hint}
        </ThemedText>
      </ThemedView>
    </View>
  );
}
