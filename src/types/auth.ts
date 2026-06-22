import type { ApiResponse } from '@/types/common';

export type SocialProvider = 'apple' | 'kakao';

export type SignupStep =
  | 'SOCIAL_AUTHENTICATED'
  | 'CONSENT_AGREED'
  | 'PROFILE_COMPLETED'
  | 'ONBOARDING_COMPLETED'
  | 'COMPLETED';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface AuthUser {
  id: string;
  nickname: string;
  preferred_character_id: string;
  is_minor: boolean;
  is_premium: boolean;
  status: UserStatus;
}

export interface AuthLoginRequest {
  provider: SocialProvider;
  id_token: string | null;
  access_token: string | null;
  device_id: string;
}

export interface AuthLoginData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user: boolean;
  is_new_device: boolean;
  signup_step: SignupStep;
  onboarding_step: number;
  user: AuthUser | null;
}

export type AuthLoginResponse = ApiResponse<AuthLoginData>;

export interface AuthSignupStatusData {
  signup_step: SignupStep;
  onboarding_step: number;
}

export type AuthSignupStatusResponse = ApiResponse<AuthSignupStatusData>;

export type ConsentType = 'terms' | 'privacy' | 'age_verification' | 'sensitive_info' | 'marketing';

export interface SignupConsent {
  type: ConsentType;
  agreed: boolean;
  version: string;
}

export interface AuthSignupConsentRequest {
  consents: SignupConsent[];
}

export interface AuthSignupConsentData {
  signup_step: 'CONSENT_AGREED';
}

export type AuthSignupConsentResponse = ApiResponse<AuthSignupConsentData>;

export type AgeRange = '10대' | '20대' | '30대' | '40대' | '50대+';
export type Gender = 'male' | 'female' | 'other';

export interface AuthSignupProfileRequest {
  nickname: string;
  age_range?: AgeRange;
  gender?: Gender;
}

export interface AuthSignupProfileData {
  signup_step: 'PROFILE_COMPLETED';
  onboarding_step: number;
  nickname: string;
}

export type AuthSignupProfileResponse = ApiResponse<AuthSignupProfileData>;

export interface AuthSignupCompleteData {
  signup_step: 'COMPLETED';
  status: 'ACTIVE';
}

export type AuthSignupCompleteResponse = ApiResponse<AuthSignupCompleteData>;

export interface AuthNicknameDuplicateCheckData {
  duplicate: boolean;
}

export type AuthNicknameDuplicateCheckResponse = ApiResponse<AuthNicknameDuplicateCheckData>;

export interface AuthRefreshRequest {
  refresh_token: string;
}

export interface AuthRefreshData {
  access_token: string;
  expires_in: number;
}

export type AuthRefreshResponse = ApiResponse<AuthRefreshData>;

export interface AuthLogoutRequest {
  device_id: string;
}

export interface AuthLogoutData {
  success: true;
}

export type AuthLogoutResponse = ApiResponse<AuthLogoutData>;
