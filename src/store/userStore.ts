import { toOnboardingCharacterId, type OnboardingCharacterId } from '@/constants/characters';
import {
  ONBOARDING_CONCERN_OPTIONS,
  type OnboardingConcernType,
  type OnboardingStyleType,
} from '@/constants/onboarding';
import { EditNicknameLayout } from '@/constants/theme';
import type { AuthUser } from '@/types/auth';
import type { EmotionType } from '@/types/checkin';
import type { UserOnboardingSelectionResult, UserSignupInfo } from '@/types/user';
import { zustandStorage } from '@/utils/zustandStorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const USER_STORE_PERSIST_KEY = 'user-store';

interface UserState {
  signupInfo: UserSignupInfo | null;
  onboardingResult: UserOnboardingSelectionResult | null;

  setSignupInfo: (info: UserSignupInfo) => void;
  updateNickname: (nickname: string) => void;
  setOnboardingResult: (result: UserOnboardingSelectionResult) => void;
  patchOnboardingEmotion: (emotion: EmotionType, intensity: number) => void;
  patchOnboardingConcernTypes: (types: OnboardingConcernType[]) => void;
  patchOnboardingPreferredStyle: (style: OnboardingStyleType) => void;
  patchOnboardingCharacterId: (characterId: OnboardingCharacterId) => void;
  clearOnboardingEmotion: () => void;
  clearOnboardingConcernTypes: () => void;
  clearOnboardingPreferredStyle: () => void;
  clearOnboardingCharacterId: () => void;
  hydrateFromAuthUser: (user: AuthUser) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  signupInfo: null,
  onboardingResult: null,
} as const;

function createEmptyOnboardingResult(): UserOnboardingSelectionResult {
  return {
    emotionSelection: null,
    concernTypes: null,
    preferredStyle: null,
    characterId: null,
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
      setSignupInfo: (info) => set({ signupInfo: info }),
      // todo: 닉네임 수정 API 연동 후 updateNickname에서 서버 요청 추가
      updateNickname: (nickname) => {
        const normalized = nickname.trim().slice(0, EditNicknameLayout.maxLength);
        if (normalized.length === 0) {
          return;
        }

        set((state) => ({
          signupInfo: state.signupInfo
            ? { ...state.signupInfo, nickname: normalized }
            : { nickname: normalized, gender: null, ageRange: null },
        }));
      },
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
          const current = state.onboardingResult ?? createEmptyOnboardingResult();
          return {
            onboardingResult: {
              ...current,
              characterId,
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
      hydrateFromAuthUser: (user) =>
        set((state) => {
          const currentOnboarding = state.onboardingResult ?? createEmptyOnboardingResult();
          const existingNickname = state.signupInfo?.nickname?.trim() ?? '';
          const nickname = existingNickname.length > 0 ? existingNickname : user.nickname;

          return {
            signupInfo: {
              nickname,
              gender: state.signupInfo?.gender ?? null,
              ageRange: state.signupInfo?.ageRange ?? null,
            },
            onboardingResult: {
              ...currentOnboarding,
              characterId: toOnboardingCharacterId(user.preferred_character_id),
            },
          };
        }),
      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: USER_STORE_PERSIST_KEY,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        signupInfo: state.signupInfo,
        onboardingResult: state.onboardingResult,
      }),
    }
  )
);

export const userStoreUtils = {
  normalizeConcernTypes,
} as const;
