import { DiaryInput } from '@/features/checkin/components/DiaryInput';
import { EmotionSelector } from '@/features/checkin/components/EmotionSelector';
import { IntensitySlider } from '@/features/checkin/components/IntensitySlider';
import { useSubmitCheckin } from '@/features/checkin/hooks/useCheckin';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import type { TimeOfDay } from '@/types/checkin';
import { formatCheckinFullDate } from '@/utils/date';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export default function CheckinFormScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { selectedEmotion, conditionScore, memo, setEmotion, setConditionScore, setMemo } =
    useCheckinStore();
  const { mutate: submitCheckin, isPending } = useSubmitCheckin();

  const handleSubmit = () => {
    if (!selectedEmotion) return;
    submitCheckin({
      time_of_day: getCurrentTimeOfDay(),
      emotion_type: selectedEmotion,
      condition_score: conditionScore,
      memo: memo.trim() || undefined,
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-midnight"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-row items-center px-5" style={{ paddingTop: top + 8 }}>
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-white text-base">←</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">오늘의 체크인</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-10 gap-6"
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-fg-dim text-sm mt-1">
            {formatCheckinFullDate(new Date().toISOString())}
          </Text>
          <Text className="text-white text-xl font-bold">지금 어떤 감정이 느껴지나요?</Text>
        </View>

        <EmotionSelector value={selectedEmotion} onChange={setEmotion} />

        <View className="gap-2">
          <Text className="text-white font-medium">감정의 강도는 어떤가요?</Text>
          <Text className="text-fg-muted text-sm">슬라이더를 움직여 강도를 조절해 보세요</Text>
          <IntensitySlider value={conditionScore} onChange={setConditionScore} />
        </View>

        <View className="gap-2">
          <Text className="text-white font-medium">
            한 줄로 지금 기분을 적어볼까요?{' '}
            <Text className="text-fg-faint font-normal">(선택)</Text>
          </Text>
          <DiaryInput value={memo} onChange={setMemo} />
        </View>
      </ScrollView>

      <View className="px-5" style={{ paddingBottom: bottom }}>
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedEmotion || isPending}
          className="bg-white rounded-2xl py-4 items-center disabled:opacity-40"
        >
          <Text className="text-midnight font-semibold text-base">
            {isPending ? '저장 중...' : '완료'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
