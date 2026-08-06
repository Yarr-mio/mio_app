import {
  ONBOARDING_DEFAULT_CHARACTER_ID,
  type OnboardingCharacterId,
} from '@/constants/characters';
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
  patchOnboardingCharacterId: (characterId: OnboardingCharacterId) => void;
  patchOnboardingNickname: (nickname: string) => void;
  clearOnboardingCharacterId: () => void;
  clearOnboardingNickname: () => void;
  reset: () => void;
}

const INITIAL_STATE = {
  authProfile: null,
  onboardingResult: null,
} as const;

function pickTrimmedNickname(nickname: string | null | undefined): string | null {
  const trimmed = nickname?.trim();
  return trimmed ? trimmed : null;
}

export function resolveStoredNickname(
  authProfile: AuthProfile | null,
  onboardingResult: UserOnboardingSelectionResult | null
): string | null {
  return (
    pickTrimmedNickname(authProfile?.nickname) ?? pickTrimmedNickname(onboardingResult?.nickname)
  );
}

function createEmptyOnboardingResult(): UserOnboardingSelectionResult {
  return {
    characterId: null,
    nickname: null,
  };
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setAuthProfile: (profile) => set({ authProfile: profile }),
      clearAuthProfile: () => set({ authProfile: null }),
      setOnboardingResult: (result) => set({ onboardingResult: result }),
      patchOnboardingCharacterId: (characterId) =>
        set((state) => {
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
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              nickname,
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
    }
  )
);

export function commitAuthProfileFromStoredSelection(): void {
  const { authProfile, onboardingResult, setAuthProfile } = useUserStore.getState();
  const nickname = resolveStoredNickname(authProfile, onboardingResult);
  const characterId = authProfile?.characterId ?? onboardingResult?.characterId;

  if (!nickname && !characterId) {
    return;
  }

  setAuthProfile({
    nickname: nickname ?? '',
    characterId: characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID,
  });
}
