import { useRouter } from 'expo-router';

import SplashScreen from '@/features/auth/components/SplashScreen';

export default function Index() {
  const router = useRouter();

  return <SplashScreen onFinish={() => router.replace('/(auth)/login')} />;
}
