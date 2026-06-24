import { usePathname, useRouter, useSegments } from 'expo-router';
import { useRef } from 'react';

import { AUTH_ROUTES, type AuthRoute } from '@/constants/routes';
import { useRefreshToken } from '@/features/auth/hooks/useAuth';
import { restoreSession } from '@/features/auth/services/restoreSession';
import { resolveRouteFromSignupStatus } from '@/features/auth/services/signupNavigation';
import { isCurrentAuthRoute } from '@/features/auth/utils/isCurrentAuthRoute';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

export function useSplashAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const pathnameRef = useRef(pathname);
  const segmentsRef = useRef(segments);
  pathnameRef.current = pathname;
  segmentsRef.current = segments;

  const refreshTokenMutation = useRefreshToken();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const onAuthInvalid = useAuthStore((s) => s.onAuthInvalid);
  const hasRunRef = useRef(false);

  const replaceRouteIfNeeded = (route: AuthRoute) => {
    if (isCurrentAuthRoute(segmentsRef.current, pathnameRef.current, route)) {
      return;
    }

    router.replace(route);
  };

  const redirectToLoginIfNeeded = () => {
    if (isCurrentAuthRoute(segmentsRef.current, pathnameRef.current, AUTH_ROUTES.login)) {
      return;
    }

    if (onAuthInvalid) {
      onAuthInvalid();
      return;
    }

    router.replace(AUTH_ROUTES.login);
  };

  const handleFinish = async () => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    await restoreSession({
      getRefreshToken: () => storage.refreshToken.get(),
      refreshToken: () => refreshTokenMutation.mutateAsync(),
      resolveRoute: () => resolveRouteFromSignupStatus(),
      replaceRoute: replaceRouteIfNeeded,
      redirectToLogin: redirectToLoginIfNeeded,
      clearAuthSession: async () => {
        setAccessToken(null);
        await storage.refreshToken.delete();
      },
    });
  };

  return { handleFinish };
}
