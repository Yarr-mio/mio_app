import type { AuthRoute } from '@/constants/routes';
import type { AuthRefreshResponse } from '@/types/auth';

interface RestoreSessionInput {
  getRefreshToken: () => Promise<string | null>;
  refreshToken: () => Promise<AuthRefreshResponse>;
  resolveRoute: () => Promise<AuthRoute>;
  replaceRoute: (route: AuthRoute) => void;
  redirectToLogin: () => void;
  clearAuthSession: () => Promise<void>;
}

export async function restoreSession({
  getRefreshToken,
  refreshToken,
  resolveRoute,
  replaceRoute,
  redirectToLogin,
  clearAuthSession,
}: RestoreSessionInput): Promise<void> {
  try {
    const storedRefreshToken = await getRefreshToken();
    console.log('[스플래시] 저장된 refreshToken 존재 여부:', !!storedRefreshToken);

    if (!storedRefreshToken) {
      redirectToLogin();
      return;
    }

    await refreshToken();
    console.log('[스플래시] 토큰 갱신 성공');

    const route = await resolveRoute();
    console.log('[스플래시] 이동할 라우트:', route);
    replaceRoute(route);
  } catch {
    console.log('[스플래시] 오류 발생, 로그인으로 이동');
    await clearAuthSession();
    redirectToLogin();
  }
}
