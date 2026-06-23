import type { AuthRoute } from '@/constants/routes';
import type { AuthLoginResponse, AuthSignupStatusResponse, SignupStep } from '@/types/auth';

import {
  resolveSignupRoute,
  shouldFetchSignupStatus,
} from '@/features/auth/services/signupNavigation';
import { signInWithApple } from '@/features/auth/utils/appleLogin';

interface AppleLoginFlowInput {
  socialLogin: (input: {
    provider: 'apple';
    id_token: string;
    access_token: null;
  }) => Promise<AuthLoginResponse>;
  fetchSignupStatus: () => Promise<AuthSignupStatusResponse>;
  replaceRoute: (route: AuthRoute) => void;
}

export async function runAppleLoginFlow({
  socialLogin,
  fetchSignupStatus,
  replaceRoute,
}: AppleLoginFlowInput): Promise<void> {
  const result = await signInWithApple();

  if (result.cancelled) {
    return;
  }

  const res = await socialLogin({
    provider: 'apple',
    id_token: result.identityToken,
    access_token: null,
  });

  const { signup_step, is_new_user } = res.data;
  let fetchedSignupStep: SignupStep | undefined;

  if (shouldFetchSignupStatus(signup_step, is_new_user)) {
    const status = await fetchSignupStatus();
    fetchedSignupStep = status.data.signup_step;
  }

  const route = resolveSignupRoute(signup_step, is_new_user, fetchedSignupStep);
  replaceRoute(route);
}
