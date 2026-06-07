import { ThemedText } from '@/components/themed/ThemedText';
import {
  formatIntensityLabelValue,
  getIntensityLabelLevel,
  type IntensityLabelLevel,
} from '@/constants/report';
import {
  IntensityLabelBaseClasses,
  IntensityLabelClasses,
  IntensityLabelTextClasses,
} from '@/constants/theme';
import { cn } from '@/utils/cn';
import { View } from 'react-native';

interface IntensityLabelProps {
  intensity: number;
}

export function IntensityLabel({ intensity }: IntensityLabelProps) {
  const level: IntensityLabelLevel = getIntensityLabelLevel(intensity);

  return (
    <View className={cn(IntensityLabelBaseClasses, IntensityLabelClasses[level])}>
      <ThemedText type="smallMedium" className={IntensityLabelTextClasses[level]}>
        {formatIntensityLabelValue(intensity)}
      </ThemedText>
    </View>
  );
}
