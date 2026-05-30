import { useRouter } from 'expo-router';

import { postAuthRefresh } from '@/api/auth';
import SplashScreen from '@/features/auth/components/SplashScreen';
import { useAuthStore } from '@/store/authStore';
import { storage } from '@/utils/storage';

export default function Index() {
  const router = useRouter();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  const handleFinish = async () => {
    const refreshToken = await storage.refreshToken.get();
    if (!refreshToken) {
      router.replace('/(auth)/login');
      return;
    }

    try {
      const res = await postAuthRefresh({ refresh_token: refreshToken });
      setAccessToken(res.data.access_token);
      router.replace('/(main)/home');
    } catch {
      setAccessToken(null);

      //refresh 실패 = 토큰 만료 / 무효
      await storage.refreshToken.delete();
      router.replace('/(auth)/login');
    }
  };

  return <SplashScreen onFinish={handleFinish} />;
}
