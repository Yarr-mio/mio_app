import type { OnboardingCharacterId } from '@/constants/characters';
import type { OnboardingStyleType } from '@/constants/onboarding';
import type { EmotionType } from '@/types/checkin';
import type { OnboardingCharacterRecommendation } from '@/types/onboarding';
import { create } from 'zustand';

interface OnboardingState {
  emotion_state: EmotionType | null;
  emoji_score: number | null;
  concern_types: string[] | null;
  preferred_style: OnboardingStyleType | null;
  character_id: OnboardingCharacterId | null;
  character_recommendations: OnboardingCharacterRecommendation[] | null;
  setEmotionState: (emotion: EmotionType | null) => void;
  setEmojiScore: (score: number | null) => void;
  setConcernTypes: (types: string[] | null) => void;
  setPreferredStyle: (style: OnboardingStyleType | null) => void;
  setCharacterId: (id: OnboardingCharacterId | null) => void;
  setCharacterRecommendations: (
    recommendations: OnboardingCharacterRecommendation[] | null
  ) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  emotion_state: null,
  emoji_score: null,
  concern_types: null,
  preferred_style: null,
  character_id: null,
  character_recommendations: null,
} as const;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL_STATE,
  setEmotionState: (emotion) => set({ emotion_state: emotion }),
  setEmojiScore: (score) =>
    set({
      emoji_score: score === null ? null : Math.max(1, Math.min(5, Math.round(score))),
    }),
  setConcernTypes: (types) => set({ concern_types: types }),
  setPreferredStyle: (style) => set({ preferred_style: style }),
  setCharacterId: (id) => set({ character_id: id }),
  setCharacterRecommendations: (recommendations) =>
    set({ character_recommendations: recommendations }),
  reset: () => set({ ...INITIAL_STATE }),
}));
