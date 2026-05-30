import type { SignupStep } from '@/types/auth';

export type AuthRoute =
  | '/(auth)/signup/termsOfService'
  | '/(auth)/signup/info'
  | '/(auth)/onboarding/step1Emotion'
  | '/(main)/home';

export function routeForSignupStep(step: SignupStep): AuthRoute {
  switch (step) {
    case 'SOCIAL_AUTHENTICATED':
      return '/(auth)/signup/termsOfService';
    case 'CONSENT_AGREED':
      return '/(auth)/signup/info';
    case 'PROFILE_COMPLETED':
      return '/(auth)/onboarding/step1Emotion';
    case 'ONBOARDING_COMPLETED':
    case 'COMPLETED':
      return '/(main)/home';
  }
}
