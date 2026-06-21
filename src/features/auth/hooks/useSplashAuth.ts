import { useRouter } from 'expo-router';

import { AUTH_ROUTES } from '@/constants/routes';
import { useRefreshToken } from '@/features/auth/hooks/useAuth';
import { resolveRouteFromSignupStatus } from '@/features/auth/utils/navigateAfterLogin';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

async function clearAuthSession(setAccessToken: (token: string | null) => void): Promise<void> {
  setAccessToken(null);
  await storage.refreshToken.delete();
}

function redirectToLogin(
  router: ReturnType<typeof useRouter>,
  onAuthInvalid: (() => void) | null
): void {
  if (onAuthInvalid) {
    onAuthInvalid();
    return;
  }

  router.replace(AUTH_ROUTES.login);
}

/**
 * 스플래시 종료 시 저장된 refresh token으로 세션 복구 후 signup_step 기준 라우팅
 */
export function useSplashAuth() {
  const router = useRouter();
  const refreshTokenMutation = useRefreshToken();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);

  const handleFinish = async () => {
    try {
      const refreshToken = await storage.refreshToken.get();
      console.log('[스플래시] 저장된 refreshToken 존재 여부:', !!refreshToken);
      if (!refreshToken) {
        redirectToLogin(router, onAuthInvalid);
        return;
      }

      await refreshTokenMutation.mutateAsync();
      console.log('[스플래시] 토큰 갱신 성공');
      const route = await resolveRouteFromSignupStatus();
      console.log('[스플래시] 이동할 라우트:', route);
      router.replace(route);
    } catch (error) {
      console.log('[스플래시] 오류 발생, 로그인으로 이동:', error);
      await clearAuthSession(setAccessToken);
      redirectToLogin(router, onAuthInvalid);
    }
  };

  return { handleFinish };
}
