import type { ApiResponse } from '@/types/common';

export type SocialProvider = 'apple' | 'kakao';

export type SignupStep =
  | 'SOCIAL_AUTHENTICATED'
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

// 로그인 요청
export interface AuthLoginRequest {
  provider: SocialProvider;
  id_token: string | null; //애플 전용!
  access_token: string | null; //카카오
  device_id: string;
}

// 로그인 성공
export interface AuthLoginData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  is_new_user: boolean; //신규
  is_new_device: boolean;
  signup_step: SignupStep;
  onboarding_step: number;
  user?: AuthUser;
}

export type AuthLoginResponse = ApiResponse<AuthLoginData>;

export interface AuthSignupStatusData {
  signup_step: SignupStep;
  onboarding_step: number;
}

export type AuthSignupStatusResponse = ApiResponse<AuthSignupStatusData>;

export type ConsentType = 'terms' | 'privacy' | 'marketing';

export interface SignupConsent {
  type: ConsentType;
  agreed: boolean;
  version: string;
}

export type AgeRange = '10대' | '20대' | '30대' | '40대' | '50대+';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface AuthSignupCompleteRequest {
  nickname: string;
  age_range?: AgeRange;
  gender?: Gender;
  consents: SignupConsent[];
}

export interface AuthSignupCompleteData {
  signup_step: 'PROFILE_COMPLETED';
  onboarding_step: number;
  nickname: string;
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
