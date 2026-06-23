import { useRouter } from 'expo-router';

import { AUTH_ROUTES } from '@/constants/routes';
import { useRefreshToken } from '@/features/auth/hooks/useAuth';
import { restoreSession } from '@/features/auth/services/restoreSession';
import { resolveRouteFromSignupStatus } from '@/features/auth/services/signupNavigation';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

export function useSplashAuth() {
  const router = useRouter();
  const refreshTokenMutation = useRefreshToken();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);

  const handleFinish = async () => {
    await restoreSession({
      getRefreshToken: () => storage.refreshToken.get(),
      refreshToken: () => refreshTokenMutation.mutateAsync(),
      resolveRoute: () => resolveRouteFromSignupStatus(),
      replaceRoute: (route) => router.replace(route),
      redirectToLogin: () => {
        if (onAuthInvalid) {
          onAuthInvalid();
          return;
        }
        router.replace(AUTH_ROUTES.login);
      },
      clearAuthSession: async () => {
        setAccessToken(null);
        await storage.refreshToken.delete();
      },
    });
  };

  return { handleFinish };
}
