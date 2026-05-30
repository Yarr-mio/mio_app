import { useRouter } from 'expo-router';

import { AUTH_ROUTES } from '@/constants/routes';
import { useRefreshToken } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

/**
 * 스플래시 종료 시 저장된 refresh token으로 세션 복구
 */
export function useSplashAuth() {
  const router = useRouter();
  const refreshTokenMutation = useRefreshToken();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const handleFinish = async () => {
    const refreshToken = await storage.refreshToken.get();
    if (!refreshToken) {
      router.replace(AUTH_ROUTES.login);
      return;
    }

    try {
      await refreshTokenMutation.mutateAsync();
      router.replace(AUTH_ROUTES.home);
    } catch {
      setAccessToken(null);
      await storage.refreshToken.delete();
      router.replace(AUTH_ROUTES.login);
    }
  };

  return { handleFinish };
}
