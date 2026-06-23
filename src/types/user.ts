import type { OnboardingCharacterId } from '@/constants/characters';
import type { OnboardingConcernType, OnboardingStyleType } from '@/constants/onboarding';
import type { EmotionType } from '@/types/checkin';

export type UserGender = 'female' | 'male';
export type UserAgeRange = '10s' | '20s' | '30s' | '40s';

export interface UserSignupInfo {
  nickname: string;
  gender: UserGender | null;
  ageRange: UserAgeRange | null;
}

export interface UserOnboardingEmotionSelection {
  emotion: EmotionType;
  intensity: number;
}

export interface UserOnboardingSelectionResult {
  emotionSelection: UserOnboardingEmotionSelection | null;
  concernTypes: OnboardingConcernType[] | null;
  preferredStyle: OnboardingStyleType | null;
  characterId: OnboardingCharacterId | null;
}
