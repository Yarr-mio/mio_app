import { ThemedText } from '@/components/themed/ThemedText';
import type { SessionKeyThought } from '@/types/chat';
import { View } from 'react-native';

interface KeyThoughtsListProps {
  keyThoughts: SessionKeyThought[] | null;
}

export function KeyThoughtsList({ keyThoughts }: KeyThoughtsListProps) {
  if (!keyThoughts || keyThoughts.length === 0) {
    return null;
  }

  return (
    <View className="gap-3">
      {keyThoughts.map((thought, index) => (
        <View key={index} className="gap-1.5">
          <ThemedText type="small" className="text-fg-sub">
            {thought.content}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
