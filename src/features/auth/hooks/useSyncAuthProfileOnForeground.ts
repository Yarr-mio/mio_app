import { useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncAuthProfileCharacterFromServer } from '@/features/auth/services/syncAuthProfileCharacter';
import { useAuthStore } from '@/store/authStore';

// 로그인 회원가입 온보딩 화면은 auth 그룹에 속함
const AUTH_SEGMENT = '(auth)';

export function useSyncAuthProfileOnForeground() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const splashDone = useAuthStore((state) => state.splashDone);
  const segments = useSegments();
  const isAuthRoute = segments[0] === AUTH_SEGMENT;

  useEffect(() => {
    if (!splashDone || !accessToken || isAuthRoute) {
      return;
    }

    void syncAuthProfileCharacterFromServer();
  }, [accessToken, splashDone, isAuthRoute]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      const { splashDone: isSplashDone } = useAuthStore.getState();
      if (!isSplashDone || isAuthRoute) {
        return;
      }

      void syncAuthProfileCharacterFromServer();
    });

    return () => subscription.remove();
  }, [accessToken, isAuthRoute]);
}
