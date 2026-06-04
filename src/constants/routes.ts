export const AUTH_ROUTES = {
  login: '/(auth)/login',
  termsOfService: '/(auth)/signup/termsOfService',
  signupInfo: '/(auth)/signup/info',
  signupComplete: '/(auth)/signup/complete',
  onboardingStep1: '/(auth)/onboarding/step1Emotion',
  onboardingComplete: '/(auth)/onboarding/onboardingComplete',
  home: '/(main)/home',
} as const;

export const MAIN_ROUTES = {
  profileEdit: '/(main)/explore/edit',
  partner: '/(main)/my/partner',
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export type MainRoute = (typeof MAIN_ROUTES)[keyof typeof MAIN_ROUTES];
