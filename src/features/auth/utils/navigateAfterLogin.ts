import type { AuthRoute } from '@/features/auth/constants/routes';
import { AUTH_ROUTES } from '@/features/auth/constants/routes';
import type { SignupStep } from '@/types/auth';

import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';

export function shouldFetchSignupStatus(signupStep: SignupStep, isNewUser: boolean): boolean {
  return (
    (isNewUser && signupStep !== 'SOCIAL_AUTHENTICATED') ||
    (!isNewUser && signupStep !== 'COMPLETED')
  );
}

/**
 * 로그인 성공 후 signup_step / is_new_user 기준 라우팅
 *
 * - is_new_user: false + signup_step: COMPLETED일 경우 홈
 * - is_new_user: true 또는 가입 미완료일 경우 routeForSignupStep() 호출!
 */
export function resolveSignupRoute(
  signupStep: SignupStep,
  isNewUser: boolean,
  fetchedSignupStep?: SignupStep
): AuthRoute {
  if (!isNewUser && signupStep === 'COMPLETED') {
    return AUTH_ROUTES.home;
  }

  const targetStep =
    shouldFetchSignupStatus(signupStep, isNewUser) && fetchedSignupStep
      ? fetchedSignupStep
      : signupStep;

  return routeForSignupStep(targetStep);
}
