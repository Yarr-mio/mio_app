import { useRouter } from 'expo-router';

import { AUTH_ROUTES } from '@/constants/routes';
import { useSignupStatus } from '@/features/auth/hooks/useAuth';
import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';

export function useHandleSignupStepInvalid() {
  const router = useRouter();
  const signupStatus = useSignupStatus();

  const handleSignupStepInvalid = async () => {
    try {
      const response = await signupStatus.mutateAsync();
      router.replace(routeForSignupStep(response.data.signup_step));
    } catch {
      router.replace(AUTH_ROUTES.login);
    }
  };

  return { handleSignupStepInvalid };
}
