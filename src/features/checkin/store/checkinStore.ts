import type { CheckinRecord, EmotionType } from '@/types/checkin';
import { create } from 'zustand';

interface CheckinFormState {
  selectedEmotion: EmotionType | null;
  conditionScore: number;
  memo: string;
  editingCheckinId: string | null;
  setEmotion: (emotion: EmotionType) => void;
  setConditionScore: (value: number) => void;
  setMemo: (text: string) => void;
  loadForEdit: (record: CheckinRecord) => void;
  reset: () => void;
}

export const useCheckinStore = create<CheckinFormState>((set) => ({
  selectedEmotion: null,
  conditionScore: 3,
  memo: '',
  editingCheckinId: null,
  setEmotion: (emotion) => set({ selectedEmotion: emotion }),
  setConditionScore: (value) =>
    set({ conditionScore: Math.max(1, Math.min(5, Math.round(value))) }),
  setMemo: (text) => set({ memo: text }),
  loadForEdit: (record) =>
    set({
      editingCheckinId: record.checkin_id,
      selectedEmotion: record.emotion_type,
      conditionScore: record.condition_score,
      memo: record.memo ?? '',
    }),
  reset: () => set({ selectedEmotion: null, conditionScore: 3, memo: '', editingCheckinId: null }),
}));
