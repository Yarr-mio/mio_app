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
  nickname: string | null;
}

export interface MyPreferredCharacter {
  character_id: string;
  name: string;
  animal: string;
  description: string;
}

export interface MyStats {
  total_checkins: number;
  consecutive_days: number;
  todo_completed: number;
}

export interface MyEmotionDistribution {
  emotion_type: string;
  label: string;
  percentage: number;
}

export interface MyProfile {
  user_id: string;
  nickname: string;
  age_range: string | null;
  preferred_character: MyPreferredCharacter;
  stats: MyStats;
  monthly_emotion_distribution: MyEmotionDistribution[];
  signup_step: string;
  joined_at: string | null;
}

export interface MyCharacterUpdateResponse {
  character_id: string;
  name: string;
  changed: boolean;
  greeting_message: string;
}

export interface MyProfileUpdateResponse {
  user_id: string;
  nickname: string;
  age_range: string | null;
  updated_at: string;
}

export interface MyProfileUpdateParams {
  nickname?: string;
  age_range?: string | null;
}

export interface CharacterSummary {
  character_id: string;
  name: string;
  animal: string;
  description: string;
}

export interface UserCharacter {
  character_id: string;
  name: string;
  animal: string;
  description: string;
}

export interface ChangeCharacterParams {
  character_id: string;
}

export interface CheckinTime {
  morning: string;
  afternoon: string;
  evening: string;
}

export interface NotificationSettings {
  checkin_enabled: boolean;
  checkin_time: CheckinTime;
  character_enabled: boolean;
  report_enabled: boolean;
}

export interface NotificationSettingsUpdateParams {
  checkin_enabled?: boolean;
  checkin_time?: Partial<CheckinTime>;
  character_enabled?: boolean;
  report_enabled?: boolean;
}
