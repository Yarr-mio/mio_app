import { useState } from 'react';
import { View } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { EmotionIntensitySliderColors, EmotionIntensitySliderLayout } from '@/constants/theme';

interface EmotionScorePanelProps {
  initialScore: number;
  onConfirm: (score: number) => void;
  // 패널이 확인 없이 닫히는 경로(백그라운드 전환, 대화 종료 버튼)에서도 마지막 슬라이더 값을 쓸 수 있도록 실시간 보고
  onScoreChange?: (score: number) => void;
}

function ScoreThumb() {
  const { thumbRingSize } = EmotionIntensitySliderLayout;
  return (
    <View
      style={{ width: thumbRingSize, height: thumbRingSize, borderRadius: thumbRingSize / 2 }}
      className="border-2 border-primary items-center justify-center bg-midnight"
    >
      <View className="w-3 h-3 rounded-full bg-primary" />
    </View>
  );
}

export function EmotionScorePanel({
  initialScore,
  onConfirm,
  onScoreChange,
}: EmotionScorePanelProps) {
  const [score, setScore] = useState(initialScore);
  const { trackHeight, thumbRingSize, thumbTouchSize, sliderAreaPaddingY } =
    EmotionIntensitySliderLayout;
  const sliderAreaHeight = thumbRingSize + sliderAreaPaddingY;

  return (
    <View className="border-t border-line bg-midnight px-5 pt-5 pb-6 gap-5">
      <View className="gap-1">
        <ThemedText type="smallTitle" className="text-fg text-center">
          지금 내 감정 점수는?
        </ThemedText>
        <ThemedText type="small" className="text-fg-muted text-center">
          슬라이더를 움직여 현재 감정 강도를 표시해 주세요
        </ThemedText>
      </View>

      <View className="gap-2">
        <View className="items-center">
          <ThemedText type="title" className="text-primary">
            {score}
          </ThemedText>
        </View>

        <Slider
          value={score}
          minimumValue={0}
          maximumValue={100}
          step={1}
          onValueChange={(val) => {
            const next = Array.isArray(val) ? val[0] : val;
            setScore(next);
            onScoreChange?.(next);
          }}
          minimumTrackTintColor={EmotionIntensitySliderColors.trackActive}
          maximumTrackTintColor={EmotionIntensitySliderColors.trackInactive}
          thumbTintColor="transparent"
          containerStyle={{ width: '100%', height: sliderAreaHeight, justifyContent: 'center' }}
          trackStyle={{ height: trackHeight, borderRadius: trackHeight / 2 }}
          thumbTouchSize={{ width: thumbTouchSize, height: thumbTouchSize }}
          renderThumbComponent={() => <ScoreThumb />}
        />

        <View className="flex-row justify-between">
          <ThemedText type="small" className="text-fg-muted">
            최저 (0)
          </ThemedText>
          <ThemedText type="small" className="text-fg-muted">
            최고 (100)
          </ThemedText>
        </View>
      </View>

      <Button variant="primary" size="lg" onPress={() => onConfirm(score)}>
        완료
      </Button>
    </View>
  );
}
