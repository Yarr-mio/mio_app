import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';

import queryClient from '@/api/queryClient';
import { NANUM_MYEONGJO_FONTS, NOTO_SANS_KR_FONTS } from '@/constants/fonts';
import { AUTH_ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const setOnAuthInvalid = useAuthStore((s) => s.setOnAuthInvalid);
  const [fontsLoaded, fontError] = useFonts({ ...NOTO_SANS_KR_FONTS, ...NANUM_MYEONGJO_FONTS });

  useEffect(() => {
    setOnAuthInvalid(() => () => router.replace(AUTH_ROUTES.login));
    return () => setOnAuthInvalid(null);
  }, [router, setOnAuthInvalid]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View className="flex-1 font-sans">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="mindExplore" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
