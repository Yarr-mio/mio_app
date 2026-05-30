import { ThemedText } from '@/components/themed/ThemedText';
import {
  ONBOARDING_INTENSITY_MAX,
  ONBOARDING_INTENSITY_MIN,
  ONBOARDING_INTENSITY_SCALE_LABELS,
} from '@/constants/onboarding';
import {
  EmotionIntensitySliderClasses,
  EmotionIntensitySliderColors,
  EmotionIntensitySliderLayout,
} from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Slider } from '@miblanchard/react-native-slider';
import { View } from 'react-native';

const SCALE_VALUES = Array.from(
  { length: ONBOARDING_INTENSITY_MAX - ONBOARDING_INTENSITY_MIN + 1 },
  (_, index) => ONBOARDING_INTENSITY_MIN + index
);
const LAST_SCALE_INDEX = SCALE_VALUES.length - 1;

interface EmotionIntensitySliderProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

function EmotionIntensityThumb() {
  return (
    <View className={EmotionIntensitySliderClasses.thumbRing}>
      <View className={EmotionIntensitySliderClasses.thumbCore} />
    </View>
  );
}

export function EmotionIntensitySlider({
  value,
  onChange,
  disabled = false,
  className,
}: EmotionIntensitySliderProps) {
  const normalizedValue = Math.min(
    ONBOARDING_INTENSITY_MAX,
    Math.max(ONBOARDING_INTENSITY_MIN, Math.round(value))
  );
  const { trackHeight, thumbRingSize, thumbTouchSize, sliderAreaPaddingY } =
    EmotionIntensitySliderLayout;
  const trackRadius = trackHeight / 2;
  const sliderAreaHeight = thumbRingSize + sliderAreaPaddingY;

  return (
    <View className={cn('w-full', className)}>
      <View className={EmotionIntensitySliderClasses.sliderArea}>
        <Slider
          value={normalizedValue}
          minimumValue={ONBOARDING_INTENSITY_MIN}
          maximumValue={ONBOARDING_INTENSITY_MAX}
          step={1}
          disabled={disabled}
          onValueChange={(val) => {
            if (!disabled && onChange) {
              onChange(Array.isArray(val) ? val[0] : val);
            }
          }}
          minimumTrackTintColor={EmotionIntensitySliderColors.trackActive}
          maximumTrackTintColor={EmotionIntensitySliderColors.trackInactive}
          thumbTintColor="transparent"
          containerStyle={{
            width: '100%',
            height: sliderAreaHeight,
            justifyContent: 'center',
          }}
          trackStyle={{
            height: trackHeight,
            borderRadius: trackRadius,
          }}
          thumbTouchSize={{
            width: thumbTouchSize,
            height: thumbTouchSize,
          }}
          renderThumbComponent={() => <EmotionIntensityThumb />}
        />
      </View>

      <View className={EmotionIntensitySliderClasses.scaleGap}>
        <View className="flex-row justify-between">
          {SCALE_VALUES.map((num, index) => {
            const isSelected = num === normalizedValue;
            const isFirst = index === 0;
            const isLast = index === LAST_SCALE_INDEX;

            return (
              <ThemedText
                key={num}
                type="default"
                className={cn(
                  'font-semibold',
                  isFirst && 'text-left',
                  isLast && 'text-right',
                  !isFirst && !isLast && 'text-center',
                  isSelected ? 'text-fg-default' : 'text-label'
                )}
              >
                {num}
              </ThemedText>
            );
          })}
        </View>

        <View className="mt-1 flex-row justify-between">
          <ThemedText type="small" className="shrink text-left font-sans font-semibold text-label">
            {ONBOARDING_INTENSITY_SCALE_LABELS.weak}
          </ThemedText>
          <ThemedText type="small" className="shrink text-right font-sans font-semibold text-label">
            {ONBOARDING_INTENSITY_SCALE_LABELS.strong}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}
