import SplashScreen from '@/features/auth/components/SplashScreen';
import { useSplashAuth } from '@/features/auth/hooks/useSplashAuth';

export default function Index() {
  const splashAuth = useSplashAuth();

  return <SplashScreen onFinish={splashAuth.handleFinish} />;
}
