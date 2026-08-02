import { EMOTION_META } from '@/constants/emotions';
import type { EmotionType } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

const EMOTION_TYPES: EmotionType[] = [
  'sad',
  'ashamed',
  'numb',
  'anxious',
  'tired',
  'happy',
  'angry',
  'calm',
  'confused',
];

interface EmotionSelectorProps {
  value: EmotionType | null;
  onChange: (emotion: EmotionType) => void;
}

export function EmotionSelector({ value, onChange }: EmotionSelectorProps) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {EMOTION_TYPES.map((type) => {
        const meta = EMOTION_META[type];
        const isSelected = value === type;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            className={cn(
              'flex-1 min-w-[28%] items-center py-4 rounded-2xl border',
              isSelected ? 'bg-surface-md' : 'border-transparent'
            )}
          >
            <Image source={meta.image} style={{ width: 72, height: 72 }} contentFit="contain" />
            <Text className="text-fg text-sm font-medium mt-2">{meta.label}</Text>
            <Text className="text-fg-muted text-xs mt-0.5 text-center px-1">{meta.subLabel}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
