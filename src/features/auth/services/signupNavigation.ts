import { getAuthSignupStatus } from '@/api/endpoints/auth';
import { AUTH_ROUTES, type AuthRoute } from '@/constants/routes';
import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';
import type { SignupStep } from '@/types/auth';

export function shouldFetchSignupStatus(signupStep: SignupStep, isNewUser: boolean): boolean {
  return isNewUser || signupStep !== 'COMPLETED';
}

function getScreenNameForAuthRoute(route: AuthRoute): string {
  const screenNames: Record<AuthRoute, string> = {
    [AUTH_ROUTES.login]: 'LoginScreen',
    [AUTH_ROUTES.termsOfService]: 'TermsOfServiceScreen',
    [AUTH_ROUTES.signupInfo]: 'SignupInfoScreen',
    [AUTH_ROUTES.signupComplete]: 'SignupCompleteScreen',
    [AUTH_ROUTES.onboardingStep1]: 'OnboardingStep1Screen',
    [AUTH_ROUTES.onboardingStep2]: 'OnboardingStep2Screen',
    [AUTH_ROUTES.onboardingStep3]: 'OnboardingStep3Screen',
    [AUTH_ROUTES.onboardingStep4]: 'OnboardingStep4Screen',
    [AUTH_ROUTES.onboardingComplete]: 'OnboardingCompleteScreen',
    [AUTH_ROUTES.home]: '홈 화면',
  };

  return screenNames[route];
}

function logSignupStatusNavigation(signupStep: SignupStep, route: AuthRoute): void {
  console.log(
    '[AUTH] signup status:',
    { signup_step: signupStep },
    'to',
    getScreenNameForAuthRoute(route)
  );
}

export async function resolveRouteFromSignupStatus(): Promise<AuthRoute> {
  const status = await getAuthSignupStatus();
  const signupStep = status.data.signup_step;
  const route = routeForSignupStep(signupStep);
  logSignupStatusNavigation(signupStep, route);
  return route;
}

export function resolveSignupRoute(
  signupStep: SignupStep,
  isNewUser: boolean,
  fetchedSignupStep?: SignupStep
): AuthRoute {
  console.log('[AUTH] login response:', {
    is_new_user: isNewUser,
    signup_step: signupStep,
  });

  if (!isNewUser && signupStep === 'COMPLETED') {
    return AUTH_ROUTES.home;
  }

  const needsStatusFetch = shouldFetchSignupStatus(signupStep, isNewUser);
  const targetStep = needsStatusFetch && fetchedSignupStep ? fetchedSignupStep : signupStep;
  const route = routeForSignupStep(targetStep);

  if (needsStatusFetch && fetchedSignupStep) {
    logSignupStatusNavigation(targetStep, route);
  }

  return route;
}
