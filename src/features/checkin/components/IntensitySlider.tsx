import { Slider } from '@miblanchard/react-native-slider';
import { Text, View } from 'react-native';

const INTENSITY_LABELS: Record<number, string> = {
  1: '약해요',
  2: '조금 느껴요',
  3: '보통이에요',
  4: '강해요',
  5: '매우 강해요',
};

interface IntensitySliderProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export function IntensitySlider({ value, onChange, disabled = false }: IntensitySliderProps) {
  return (
    <View className="gap-2">
      <Slider
        value={value}
        minimumValue={1}
        maximumValue={5}
        step={1}
        disabled={disabled}
        onValueChange={(val) => {
          if (!disabled && onChange) {
            onChange(Array.isArray(val) ? val[0] : val);
          }
        }}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbTintColor="#FFFFFF"
      />
      <View className="flex-row justify-between">
        <Text className="text-white/50 text-xs">약해요</Text>
        <Text className="text-white text-sm font-medium">{INTENSITY_LABELS[value]}</Text>
        <Text className="text-white/50 text-xs">매우 강해요</Text>
      </View>
    </View>
  );
}
