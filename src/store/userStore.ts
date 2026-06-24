import type { OnboardingCharacterId } from '@/constants/characters';
import {
  ONBOARDING_CONCERN_OPTIONS,
  type OnboardingConcernType,
  type OnboardingStyleType,
} from '@/constants/onboarding';
import type { EmotionType } from '@/types/checkin';
import type { UserOnboardingSelectionResult } from '@/types/user';
import { zustandStorage } from '@/utils/zustandStorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const USER_STORE_PERSIST_KEY = 'user-store';

export interface AuthProfile {
  nickname: string;
  characterId: string;
}

interface UserState {
  authProfile: AuthProfile | null;
  onboardingResult: UserOnboardingSelectionResult | null;

  setAuthProfile: (profile: AuthProfile) => void;
  clearAuthProfile: () => void;
  setOnboardingResult: (result: UserOnboardingSelectionResult) => void;
  patchOnboardingEmotion: (emotion: EmotionType, intensity: number) => void;
  patchOnboardingConcernTypes: (types: OnboardingConcernType[]) => void;
  patchOnboardingPreferredStyle: (style: OnboardingStyleType) => void;
  patchOnboardingCharacterId: (characterId: OnboardingCharacterId) => void;
  patchOnboardingNickname: (nickname: string) => void;
  clearOnboardingEmotion: () => void;
  clearOnboardingConcernTypes: () => void;
  clearOnboardingPreferredStyle: () => void;
  clearOnboardingCharacterId: () => void;
  clearOnboardingNickname: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  authProfile: null,
  onboardingResult: null,
} as const;

function createEmptyOnboardingResult(): UserOnboardingSelectionResult {
  return {
    emotionSelection: null,
    concernTypes: null,
    preferredStyle: null,
    characterId: null,
    nickname: null,
  };
}

function normalizeConcernTypes(types: string[] | null): OnboardingConcernType[] | null {
  if (!types || types.length === 0) {
    return null;
  }

  const validIds = new Set<string>(ONBOARDING_CONCERN_OPTIONS.map((option) => option.id));
  const normalized = types.filter((type) => validIds.has(type)) as OnboardingConcernType[];
  return normalized.length === 0 ? null : normalized;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setAuthProfile: (profile) =>
        set(() => {
          console.log('[디버그][userStore] setAuthProfile 호출', profile);
          return { authProfile: profile };
        }),
      clearAuthProfile: () => set({ authProfile: null }),
      setOnboardingResult: (result) => set({ onboardingResult: result }),
      patchOnboardingEmotion: (emotion, intensity) =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              emotionSelection: { emotion, intensity },
            },
          };
        }),
      patchOnboardingConcernTypes: (types) =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              concernTypes: normalizeConcernTypes(types),
            },
          };
        }),
      patchOnboardingPreferredStyle: (style) =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              preferredStyle: style,
            },
          };
        }),
      patchOnboardingCharacterId: (characterId) =>
        set((state) => {
          console.log('[디버그][userStore] patchOnboardingCharacterId', characterId);
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              characterId,
            },
          };
        }),
      patchOnboardingNickname: (nickname) =>
        set((state) => {
          console.log('[디버그][userStore] patchOnboardingNickname', nickname);
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              nickname,
            },
          };
        }),
      clearOnboardingEmotion: () =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              emotionSelection: null,
            },
          };
        }),
      clearOnboardingConcernTypes: () =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              concernTypes: null,
            },
          };
        }),
      clearOnboardingPreferredStyle: () =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              preferredStyle: null,
            },
          };
        }),
      clearOnboardingCharacterId: () =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              characterId: null,
            },
          };
        }),
      clearOnboardingNickname: () =>
        set((state) => {
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              nickname: null,
            },
          };
        }),
      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: USER_STORE_PERSIST_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        authProfile: state.authProfile,
        onboardingResult: state.onboardingResult,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('[디버그][userStore] rehydrate 완료, authProfile', state?.authProfile);
      },
    }
  )
);

export const userStoreUtils = {
  normalizeConcernTypes,
} as const;
