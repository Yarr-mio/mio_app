import type { Router } from 'expo-router';

import { getAuthSignupStatus } from '@/api/auth';
import type { SignupStep } from '@/types/auth';

import { routeForSignupStep } from './routeForSignupStep';

/**
 * 로그인 성공 후 signup_step / is_new_user 기준 라우팅
 *
 * - is_new_user: false + signup_step: COMPLETED일 경우 홈
 * - is_new_user: true 또는 가입 미완료일 경우 routeForSignupStep() 호출!
 */
export async function navigateAfterLogin(
  router: Router,
  signupStep: SignupStep,
  isNewUser: boolean
): Promise<void> {
  if (!isNewUser && signupStep === 'COMPLETED') {
    router.replace('/(main)/home');
    return;
  }

  let targetStep = signupStep;
  const shouldFetchStatus =
    (isNewUser && signupStep !== 'SOCIAL_AUTHENTICATED') ||
    (!isNewUser && signupStep !== 'COMPLETED');

  if (shouldFetchStatus) {
    const status = await getAuthSignupStatus();
    targetStep = status.data.signup_step;
  }

  router.replace(routeForSignupStep(targetStep));
}
