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
import { useAuthStore } from '@/store/authStore';

ExpoSplashScreen.preventAutoHideAsync();

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
      <NotificationDeviceBootstrap />
      <RootAppContent />
    </QueryClientProvider>
  );
}
