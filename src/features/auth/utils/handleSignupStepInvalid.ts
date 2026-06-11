import type { Router } from 'expo-router';

import { getAuthSignupStatus } from '@/api/endpoints/auth';
import { AUTH_ROUTES } from '@/constants/routes';
import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';

export async function handleSignupStepInvalid(router: Router): Promise<void> {
  console.error('SIGNUP_STEP_INVALID');

  try {
    const response = await getAuthSignupStatus();
    router.replace(routeForSignupStep(response.data.signup_step));
  } catch {
    router.replace(AUTH_ROUTES.login);
  }
}
