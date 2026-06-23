import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { View, useColorScheme } from 'react-native';

import SplashScreen from '@/features/auth/components/SplashScreen';
import { useSplashAuth } from '@/features/auth/hooks/useSplashAuth';
import { useAuthStore } from '@/store/authStore';

export function RootAppContent() {
  const colorScheme = useColorScheme();
  const splashDone = useAuthStore((s) => s.splashDone);
  const setSplashDone = useAuthStore((s) => s.setSplashDone);
  const splashAuth = useSplashAuth();

  const handleSplashFinish = async () => {
    await splashAuth.handleFinish();
    setSplashDone(true);
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View className="flex-1 font-sans">
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="mindExplore" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        {!splashDone ? (
          <View className="absolute inset-0 z-10">
            <SplashScreen onFinish={handleSplashFinish} />
          </View>
        ) : null}
      </View>
    </ThemeProvider>
  );
}
