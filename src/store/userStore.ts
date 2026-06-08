import { ONBOARDING_CONCERN_OPTIONS, type OnboardingConcernType } from '@/constants/onboarding';
import { EditNicknameLayout } from '@/constants/theme';
import type { UserOnboardingSelectionResult, UserSignupInfo } from '@/types/user';
import { create } from 'zustand';

interface UserState {
  signupInfo: UserSignupInfo | null;
  onboardingResult: UserOnboardingSelectionResult | null;

  setSignupInfo: (info: UserSignupInfo) => void;
  updateNickname: (nickname: string) => void;
  setOnboardingResult: (result: UserOnboardingSelectionResult) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  signupInfo: null,
  onboardingResult: null,
} as const;

function normalizeConcernTypes(types: string[] | null): OnboardingConcernType[] | null {
  if (!types || types.length === 0) {
    return null;
  }

  const validIds = new Set<string>(ONBOARDING_CONCERN_OPTIONS.map((option) => option.id));
  const normalized = types.filter((type) => validIds.has(type)) as OnboardingConcernType[];
  return normalized.length === 0 ? null : normalized;
}

export const useUserStore = create<UserState>((set) => ({
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
  reset: () => set({ ...INITIAL_STATE }),
}));

export const userStoreUtils = {
  normalizeConcernTypes,
} as const;
