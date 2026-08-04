import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import queryClient from '@/api/queryClient';
import { NANUM_MYEONGJO_FONTS, NOTO_SANS_KR_FONTS } from '@/constants/fonts';
import { AUTH_ROUTES } from '@/constants/routes';
import { RootAppContent } from '@/features/auth/components/RootAppContent';
import { NotificationDeviceBootstrap } from '@/notifications/NotificationDeviceBootstrap';
import { NotificationListenersBootstrap } from '@/notifications/NotificationListenersBootstrap';
import { useAuthStore } from '@/store/authStore';

ExpoSplashScreen.preventAutoHideAsync();

// 앱 전역 안전망 미처리 렌더 에러 시 expo-router 기본 에러 화면 노출
// chat trouble shoot 07 참고
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();
  const setOnAuthInvalid = useAuthStore((s) => s.setOnAuthInvalid);
  const [fontsLoaded, fontError] = useFonts({ ...NOTO_SANS_KR_FONTS, ...NANUM_MYEONGJO_FONTS });

  useEffect(() => {
    setOnAuthInvalid(() => router.replace(AUTH_ROUTES.login));
    return () => setOnAuthInvalid(null);
  }, [router, setOnAuthInvalid]);

  // 네이티브 스플래시 숨김 SplashScreen 레이아웃 완료 후 처리
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationListenersBootstrap />
      <NotificationDeviceBootstrap />
      <RootAppContent />
    </QueryClientProvider>
  );
}
