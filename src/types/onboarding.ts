import type { ApiResponse } from '@/types/common';

export type OnboardingCharacterId = 'mio' | 'bau' | 'rumi' | 'momo' | 'chichi';

export interface OnboardingCharacterRequest {
  character_id: OnboardingCharacterId;
}

export interface OnboardingCharacterData {
  preferred_character_id: OnboardingCharacterId;
  signup_step: 'ONBOARDING_COMPLETED';
}

export type OnboardingCharacterResponse = ApiResponse<OnboardingCharacterData>;
