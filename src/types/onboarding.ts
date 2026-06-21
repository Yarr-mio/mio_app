import type { SignupStep } from '@/types/auth';
import type { EmotionType } from '@/types/checkin';
import type { ApiResponse } from '@/types/common';

export type OnboardingEmotionState = EmotionType;

export type OnboardingConcernType =
  | 'relationship'
  | 'career'
  | 'workload'
  | 'financial'
  | 'family'
  | 'romance'
  | 'lifestyle'
  | 'health'
  | 'other';

export type OnboardingPreferredStyle = 'empathetic' | 'analytical' | 'solution' | 'balanced';

export type OnboardingCharacterId = 'mio' | 'bau' | 'rumi' | 'momo' | 'chichi';

export type OnboardingProgressStep = 0 | 1 | 2 | 3;

export interface OnboardingResponseItem {
  question_id: string;
  answer: string;
}

export interface OnboardingStep1Request {
  emotion_state: OnboardingEmotionState;
  responses?: OnboardingResponseItem[];
}

export interface OnboardingStep1Data {
  onboarding_step: 1;
}

export type OnboardingStep1Response = ApiResponse<OnboardingStep1Data>;

export interface OnboardingStep2Request {
  concern_types: OnboardingConcernType[];
  responses?: OnboardingResponseItem[];
}

export interface OnboardingStep2Data {
  onboarding_step: 2;
}

export type OnboardingStep2Response = ApiResponse<OnboardingStep2Data>;

export interface OnboardingStep3Request {
  preferred_style: OnboardingPreferredStyle;
  responses?: OnboardingResponseItem[];
}

export interface OnboardingCharacterRecommendation {
  character_id: OnboardingCharacterId;
  name: string;
  match_score: number;
  reason: string;
}

export interface OnboardingStep3Data {
  onboarding_step: 3;
  character_recommendations: OnboardingCharacterRecommendation[];
}

export type OnboardingStep3Response = ApiResponse<OnboardingStep3Data>;

export interface OnboardingCharacterRequest {
  character_id: OnboardingCharacterId;
}

export interface OnboardingCharacterData {
  preferred_character_id: OnboardingCharacterId;
  signup_step: 'ONBOARDING_COMPLETED';
}

export type OnboardingCharacterResponse = ApiResponse<OnboardingCharacterData>;

export interface OnboardingStatusData {
  onboarding_step: OnboardingProgressStep;
  signup_step: SignupStep;
  character_recommendations: OnboardingCharacterRecommendation[] | null;
}

export type OnboardingStatusResponse = ApiResponse<OnboardingStatusData>;
