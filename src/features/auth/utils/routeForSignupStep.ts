import { AUTH_ROUTES, type AuthRoute } from '@/constants/routes';
import type { SignupStep } from '@/types/auth';

export function routeForSignupStep(step: SignupStep): AuthRoute {
  switch (step) {
    case 'SOCIAL_AUTHENTICATED':
      return AUTH_ROUTES.termsOfService;
    case 'CONSENT_AGREED':
      return AUTH_ROUTES.signupInfo;
    case 'PROFILE_COMPLETED':
      return AUTH_ROUTES.onboardingStep1;
    case 'ONBOARDING_COMPLETED':
    case 'COMPLETED':
      return AUTH_ROUTES.home;
    default: {
      const _exhaustive: never = step;
      return AUTH_ROUTES.login;
    }
  }
}
