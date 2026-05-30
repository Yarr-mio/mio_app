import { ThemedText } from '@/components/themed/ThemedText';
import { EMOTION_META } from '@/constants/emotions';
import { ONBOARDING_EMOTION_GRID_ORDER } from '@/constants/onboarding';
import { EmotionSelectBoxLayout } from '@/constants/theme';
import type { EmotionType } from '@/types/checkin';
import { cn } from '@/utils/cn';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

interface EmotionSelectBoxProps {
  value: EmotionType | null;
  onChange: (emotion: EmotionType) => void;
}

// 감정 선택 UI
export function EmotionSelectBox({ value, onChange }: EmotionSelectBoxProps) {
  const iconSize = EmotionSelectBoxLayout.iconSize;

  return (
    <View className="flex-row flex-wrap gap-3">
      {ONBOARDING_EMOTION_GRID_ORDER.map((type) => {
        const meta = EMOTION_META[type];
        const isSelected = value === type;

        return (
          <Pressable
            key={type}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(type)}
            className={cn(
              'min-w-[30%] flex-1 items-center rounded-xl border py-3',
              isSelected ? 'border-accent/40 bg-surface-md' : 'border-transparent'
            )}
          >
            <Image
              source={meta.image}
              style={{ width: iconSize, height: iconSize }}
              contentFit="contain"
            />
            <ThemedText type="smallTitle" className="mt-2 text-fg">
              {meta.label}
            </ThemedText>
            <ThemedText type="small" className="mt-1 px-1 text-center font-normal text-fg">
              {meta.subLabel}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
