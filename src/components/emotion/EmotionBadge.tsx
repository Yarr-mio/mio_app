import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { EMOTION_META } from '@/constants/emotions';
import type { EmotionType } from '@/types/checkin';

interface EmotionBadgeProps {
  emotionType: EmotionType;
  conditionScore: number;
  size?: 'sm' | 'md';
}

export function EmotionBadge({ emotionType, conditionScore, size = 'md' }: EmotionBadgeProps) {
  const meta = EMOTION_META[emotionType];
  const imageSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <View className="flex-row items-center gap-2">
      <Image source={meta.image} className={imageSize} contentFit="contain" />
      <Text className={`${textSize} text-white font-medium`}>{meta.label}</Text>
      <Text className={`${textSize} text-white/60`}>강도 {conditionScore}/5</Text>
    </View>
  );
}
