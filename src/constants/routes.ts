export const AUTH_ROUTES = {
  login: '/(auth)/login',
  termsOfService: '/(auth)/signup/termsOfService',
  signupInfo: '/(auth)/signup/info',
  signupComplete: '/(auth)/signup/complete',
  onboardingStep1: '/(auth)/onboarding/step1Emotion',
  onboardingStep2: '/(auth)/onboarding/step2Concern',
  onboardingStep3: '/(auth)/onboarding/step3Style',
  onboardingStep4: '/(auth)/onboarding/step4Character',
  onboardingComplete: '/(auth)/onboarding/onboardingComplete',
  home: '/(main)/home',
} as const;

export const MAIN_ROUTES = {
  settings: '/(main)/explore',
  editNickname: '/(main)/explore/edit-nickname',
  partner: '/(main)/explore/partner',
  legalTerms: '/(main)/explore/legal/terms',
  legalPrivacy: '/(main)/explore/legal/privacy',
  legalSensitive: '/(main)/explore/legal/sensitive',
  chat: '/(main)/chat',
} as const;

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export type MainRoute = (typeof MAIN_ROUTES)[keyof typeof MAIN_ROUTES];

export const HOME_ROUTES = {
  checkin: '/(main)/home/checkin',
  todo: '/(main)/home/todo',
  report: '/(main)/report',
} as const;

export type HomeRoute = (typeof HOME_ROUTES)[keyof typeof HOME_ROUTES];
