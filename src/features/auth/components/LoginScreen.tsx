import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
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
          <SocialLoginButton provider="apple" onPress={handleAppleLogin} />
          <SocialLoginButton provider="kakao" onPress={handleKakaoLogin} />
        </View>
      </View>
    </View>
  );
}
