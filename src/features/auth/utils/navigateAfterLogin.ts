import { getAuthSignupStatus } from '@/api/endpoints/auth';
import { AUTH_ROUTES, type AuthRoute } from '@/constants/routes';
import type { SignupStep } from '@/types/auth';

import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';

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
    [AUTH_ROUTES.onboardingComplete]: 'OnboardingCompleteScreen',
    [AUTH_ROUTES.home]: '홈 화면',
  };

  return screenNames[route];
}

function logSignupStatusNavigation(signupStep: SignupStep, route: AuthRoute): void {
  console.log(
    '[AUTH] signup status:',
    { signup_step: signupStep },
    '→',
    getScreenNameForAuthRoute(route)
  );
}

/**
 * 세션 복구 시 signup_step 기준 라우팅 (스플래시, 포그라운드 복귀)
 */
export async function resolveRouteFromSignupStatus(): Promise<AuthRoute> {
  const status = await getAuthSignupStatus();
  const signupStep = status.data.signup_step;
  const route = routeForSignupStep(signupStep);
  logSignupStatusNavigation(signupStep, route);
  return route;
}

/**
 * 로그인 성공 후 signup_step / is_new_user 기준 라우팅
 *
 * - is_new_user: false + signup_step: COMPLETED일 경우 홈
 * - is_new_user: true 또는 signup_step이 COMPLETED가 아닐 경우 GET /v1/auth/signup/status 후 분기
 */
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
