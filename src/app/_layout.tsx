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
import { useAuthStore } from '@/store/authStore';

ExpoSplashScreen.preventAutoHideAsync();

// 앱 전역 안전망 — 어디서든 처리되지 않은 렌더 에러가 나면 검은 화면 대신 expo-router 기본 에러
// 화면(에러 메시지 + 재시도 버튼)을 보여준다 (chat-trouble-shoot/07 참고)
export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();
  const setOnAuthInvalid = useAuthStore((s) => s.setOnAuthInvalid);
  const [fontsLoaded, fontError] = useFonts({ ...NOTO_SANS_KR_FONTS, ...NANUM_MYEONGJO_FONTS });

  useEffect(() => {
    setOnAuthInvalid(() => router.replace(AUTH_ROUTES.login));
    return () => setOnAuthInvalid(null);
  }, [router, setOnAuthInvalid]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootAppContent />
    </QueryClientProvider>
  );
}
