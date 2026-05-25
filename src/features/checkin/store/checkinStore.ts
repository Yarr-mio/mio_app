import type { EmotionType } from '@/types/checkin';
import { create } from 'zustand';

interface CheckinFormState {
  selectedEmotion: EmotionType | null;
  conditionScore: number;
  memo: string;
  setEmotion: (emotion: EmotionType) => void;
  setConditionScore: (value: number) => void;
  setMemo: (text: string) => void;
  reset: () => void;
}

export const useCheckinStore = create<CheckinFormState>((set) => ({
  selectedEmotion: null,
  conditionScore: 3,
  memo: '',
  setEmotion: (emotion) => set({ selectedEmotion: emotion }),
  setConditionScore: (value) =>
    set({ conditionScore: Math.max(1, Math.min(5, Math.round(value))) }),
  setMemo: (text) => set({ memo: text }),
  reset: () => set({ selectedEmotion: null, conditionScore: 3, memo: '' }),
}));
