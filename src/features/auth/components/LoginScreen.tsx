import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAuthSignupStatus } from '@/api/auth';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';
import { useSocialLogin } from '@/features/auth/hooks/useAuth';
import type { SignupStep } from '@/types/auth';

type AuthRoute =
  | '/(auth)/signup/termsOfService'
  | '/(auth)/onboarding/step1Emotion'
  | '/(main)/home';

function routeForSignupStep(step: SignupStep): AuthRoute {
  switch (step) {
    case 'SOCIAL_AUTHENTICATED':
      return '/(auth)/signup/termsOfService';
    case 'PROFILE_COMPLETED':
      return '/(auth)/onboarding/step1Emotion';
    case 'ONBOARDING_COMPLETED':
    case 'COMPLETED':
      return '/(main)/home';
  }
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const socialLogin = useSocialLogin();

  const handleLoginSuccess = async (signupStep: SignupStep, isNewUser: boolean) => {
    if (isNewUser) {
      if (signupStep !== 'SOCIAL_AUTHENTICATED') {
        const status = await getAuthSignupStatus();
        router.replace(routeForSignupStep(status.data.signup_step));
        return;
      }
      router.replace(routeForSignupStep(signupStep));
      return;
    }

    if (signupStep === 'COMPLETED') {
      router.replace('/(main)/home');
      return;
    }

    const status = await getAuthSignupStatus();
    router.replace(routeForSignupStep(status.data.signup_step));
  };

  const handleKakaoLogin = async () => {
    const res = await socialLogin.mutateAsync({
      provider: 'kakao',
      access_token: 'mock_kakao_access_token',
      id_token: null,
    });
    await handleLoginSuccess(res.data.signup_step, res.data.is_new_user);
  };

  const handleAppleLogin = async () => {
    const res = await socialLogin.mutateAsync({
      provider: 'apple',
      id_token: 'mock_apple_id_token',
      access_token: null,
    });
    await handleLoginSuccess(res.data.signup_step, res.data.is_new_user);
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground variant="login" />
      <View
        className="flex-1 px-6"
        style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="flex-1 items-center justify-center">
          <ThemedText type="title" className="font-bold tracking-widest text-ink-night">
            MIO
          </ThemedText>
          <ThemedText type="default" className="mt-3 text-center text-ink-dim-night">
            마음의 이야기
          </ThemedText>
        </View>

        <View className="gap-3 pb-2">
          <SocialLoginButton
            provider="apple"
            onPress={handleAppleLogin}
            disabled={socialLogin.isPending}
          />
          <SocialLoginButton
            provider="kakao"
            onPress={handleKakaoLogin}
            disabled={socialLogin.isPending}
          />
        </View>
      </View>
    </View>
  );
}
