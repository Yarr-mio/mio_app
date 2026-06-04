import { Chip } from '@/components/ui/Chip';
import { ONBOARDING_CHARACTERS } from '@/constants/characters';
import type { MemoryRecord } from '@/types/memory';
import { formatMemoryDate } from '@/utils/date';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed/ThemedText';
import { Pressable, View } from 'react-native';

interface MemoryCardProps {
  record: MemoryRecord;
  onLongPress: () => void;
}

const mioImage = ONBOARDING_CHARACTERS[0].image;

export function MemoryCard({ record, onLongPress }: MemoryCardProps) {
  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={300}
      className="bg-surface rounded-2xl p-4 border border-line"
    >
      <View className="flex-row justify-between items-center mb-2">
        <ThemedText type="smallMedium" className="text-fg-dim">
          {formatMemoryDate(record.created_at)}
        </ThemedText>
        <Chip label={record.category_label} />
      </View>

      <ThemedText type="smallBold" className="mb-3">
        {record.title}
      </ThemedText>

      <View className="flex-row gap-3 items-start">
        <Image
          source={mioImage}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
        />
        <ThemedText type="smallMedium" className="text-fg-dim flex-1 leading-5" numberOfLines={3}>
          {record.description}
        </ThemedText>
      </View>
    </Pressable>
  );
}
