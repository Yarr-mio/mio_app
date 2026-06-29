import { BackHeader } from '@/components/layout/BackHeader';
import { Button } from '@/components/ui/Button';
import { EmotionIntensitySlider } from '@/components/ui/EmotionIntensitySlider';
import { DiaryInput } from '@/features/checkin/components/DiaryInput';
import { EmotionSelector } from '@/features/checkin/components/EmotionSelector';
import { useSubmitCheckin, useUpdateCheckin } from '@/features/checkin/hooks/useCheckin';
import { useCheckinStore } from '@/features/checkin/store/checkinStore';
import { formatCheckinFullDate, getCurrentTimeOfDay } from '@/utils/date';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckinFormScreen() {
  const { bottom } = useSafeAreaInsets();
  const {
    selectedEmotion,
    conditionScore,
    memo,
    editingCheckinId,
    setEmotion,
    setConditionScore,
    setMemo,
  } = useCheckinStore();
  const { mutate: submitCheckin, isPending: isSubmitting } = useSubmitCheckin();
  const { mutate: updateCheckin, isPending: isUpdating } = useUpdateCheckin();
  const isEditMode = editingCheckinId !== null;
  const isPending = isEditMode ? isUpdating : isSubmitting;

  const handleSubmit = () => {
    if (!selectedEmotion) return;

    if (editingCheckinId) {
      updateCheckin({
        checkinId: editingCheckinId,
        body: {
          emotion_type: selectedEmotion,
          condition_score: conditionScore,
          memo: memo.trim() || undefined,
        },
      });
      return;
    }

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
      <BackHeader title={isEditMode ? '체크인 수정' : '오늘의 체크인'} />

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
          <EmotionIntensitySlider value={conditionScore} onChange={setConditionScore} />
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
        <Button onPress={handleSubmit} disabled={!selectedEmotion || isPending}>
          {isPending ? '저장 중...' : isEditMode ? '수정 완료' : '완료'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
