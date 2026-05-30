export const AUTH_ROUTES = {
  termsOfService: '/(auth)/signup/termsOfService',
  signupInfo: '/(auth)/signup/info',
  onboardingStep1: '/(auth)/onboarding/step1Emotion',
  home: '/(main)/home',
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
