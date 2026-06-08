import { ThemedText } from '@/components/themed/ThemedText';
import {
  ScoreSliderClasses,
  ScoreSliderColors,
  ScoreSliderLayout,
  ScoreSliderRange,
} from '@/constants/theme';
import { cn } from '@/utils/cn';
import { Slider } from '@miblanchard/react-native-slider';
// EAS 빌드 후 실기기 검증 시 주석 해제 필요. Expo Go에서는 expo-haptics 미지원
// import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

interface ScoreSliderProps {
  value: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
  showThumbLabel?: boolean;
  showTickLabels?: boolean;
}

function ScoreSliderThumb() {
  return <View className={ScoreSliderClasses.thumb} />;
}

function clampScore(value: number) {
  return Math.min(ScoreSliderRange.max, Math.max(ScoreSliderRange.min, Math.round(value)));
}

// EAS 빌드 후 실기기 검증 시 주석 해제 필요. Expo Go에서는 expo-haptics 미지원
// function isScoreSliderTickValue(value: number) {
//   return (ScoreSliderRange.tickValues as readonly number[]).includes(value);
// }

function getThumbCenterX(containerWidth: number, value: number, thumbSize: number) {
  const ratio = value / ScoreSliderRange.max;
  const thumbTravel = Math.max(containerWidth - thumbSize, 0);

  return thumbSize / 2 + ratio * thumbTravel;
}

export function ScoreSlider({
  value,
  readonly = false,
  onChange,
  showThumbLabel = false,
  showTickLabels = false,
}: ScoreSliderProps) {
  const normalizedValue = clampScore(value);
  const {
    trackHeight,
    thumbSize,
    thumbTouchSize,
    sliderAreaPaddingY,
    thumbLabelGap,
    thumbLabelEstimatedHeight,
  } = ScoreSliderLayout;
  const trackRadius = trackHeight / 2;
  const sliderAreaHeight = thumbSize + sliderAreaPaddingY;
  const [labelValue, setLabelValue] = useState(normalizedValue);
  const [containerWidth, setContainerWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const [labelHeight, setLabelHeight] = useState(0);
  // EAS 빌드 후 실기기 검증 시 주석 해제 필요. Expo Go에서는 expo-haptics 미지원
  // const lastHapticValue = useRef<number | null>(null);

  useEffect(() => {
    setLabelValue(normalizedValue);
  }, [normalizedValue]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleLabelLayout = (event: LayoutChangeEvent) => {
    setLabelWidth(event.nativeEvent.layout.width);
    setLabelHeight(event.nativeEvent.layout.height);
  };

  const thumbCenterX = getThumbCenterX(containerWidth, labelValue, thumbSize);
  const labelLeft = thumbCenterX - labelWidth / 2;
  const effectiveLabelHeight = labelHeight > 0 ? labelHeight : thumbLabelEstimatedHeight;
  const thumbTopY = sliderAreaHeight / 2 - thumbSize / 2;
  const labelTopInSlider = thumbTopY - thumbLabelGap - effectiveLabelHeight;
  const paddingTop = showThumbLabel ? Math.max(0, -labelTopInSlider) : 0;
  const labelTop = paddingTop + labelTopInSlider;

  return (
    <View className={ScoreSliderClasses.root}>
      <View className={ScoreSliderClasses.rootRelative} style={{ paddingTop }}>
        {/* showThumbLabel: thumb 위 별도 영역에 현재 값 라벨 표시 */}
        {showThumbLabel && containerWidth > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: labelTop,
              left: labelLeft,
            }}
            onLayout={handleLabelLayout}
          >
            <View className={ScoreSliderClasses.thumbLabel}>
              <ThemedText type="small" className={ScoreSliderClasses.thumbLabelText}>
                {String(labelValue)}
              </ThemedText>
            </View>
          </View>
        ) : null}

        {/* readonly: 슬라이더 조작 비활성화 */}
        <View className={ScoreSliderClasses.trackWrapper} onLayout={handleTrackLayout}>
          <View className={ScoreSliderClasses.sliderArea} style={{ height: sliderAreaHeight }}>
            <Slider
              value={normalizedValue}
              minimumValue={ScoreSliderRange.min}
              maximumValue={ScoreSliderRange.max}
              step={ScoreSliderRange.step}
              disabled={readonly}
              onValueChange={(nextValue) => {
                const next = clampScore(Array.isArray(nextValue) ? nextValue[0] : nextValue);

                // showThumbLabel: 드래그 중에도 라벨 값과 위치를 즉시 갱신
                if (showThumbLabel) {
                  setLabelValue(next);
                }

                // EAS 빌드 후 실기기 검증 시 주석 해제 필요. Expo Go에서는 expo-haptics 미지원
                // readonly=false일 때 눈금 값 도달 시 햅틱 피드백
                // if (!readonly) {
                //   if (isScoreSliderTickValue(next)) {
                //     if (lastHapticValue.current !== next) {
                //       lastHapticValue.current = next;
                //       void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                //     }
                //   } else {
                //     lastHapticValue.current = null;
                //   }
                // }

                if (readonly || !onChange) {
                  return;
                }

                onChange(next);
              }}
              minimumTrackTintColor={ScoreSliderColors.trackActive}
              maximumTrackTintColor={ScoreSliderColors.trackInactive}
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
              renderThumbComponent={() => <ScoreSliderThumb />}
            />
          </View>
        </View>
      </View>

      {/* showTickLabels: 슬라이더 아래 0부터 100까지 눈금 라벨 표시 */}
      {showTickLabels ? (
        <View className={ScoreSliderClasses.tickLabels}>
          {ScoreSliderRange.tickValues.map((tickValue, index) => {
            const isFirst = index === 0;
            const isLast = index === ScoreSliderRange.tickValues.length - 1;

            return (
              <ThemedText
                key={tickValue}
                type="smallRegular"
                className={cn(
                  'text-weekday',
                  isFirst && 'text-left',
                  isLast && 'text-right',
                  !isFirst && !isLast && 'text-center'
                )}
              >
                {tickValue}
              </ThemedText>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
