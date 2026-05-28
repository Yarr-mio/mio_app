import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { ScreenSpacing } from '@/constants/theme';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';

export default function LoginScreen() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    router.push('/(auth)/signup/termsOfService');
  };

  const handleAppleLogin = () => {
    router.push('/(auth)/signup/termsOfService');
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground variant="login" />
      <ScreenContainer className="flex-1 px-6" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="flex-1 items-center justify-center">
          <ThemedText type="title" className="font-bold tracking-widest text-ink-night">
            MIO
          </ThemedText>
          <ThemedText type="default" className="mt-3 text-center text-ink-dim-night">
            마음의 이야기
          </ThemedText>
        </View>

        <View className="gap-3 pb-2">
          <SocialLoginButton provider="apple" onPress={handleAppleLogin} />
          <SocialLoginButton provider="kakao" onPress={handleKakaoLogin} />
        </View>
      </ScreenContainer>
    </View>
  );
}
