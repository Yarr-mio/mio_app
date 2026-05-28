import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

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
        <View className="flex-1 items-center justify-center gap-6">
          <Text
            className="tracking-[0.22em] text-ink-night"
            // Custom font exception: ThemedText(type="title")의 기본 font-bold 처리로 fontFamily override가 불안정해 RN Text + style로 직접 지정
            style={{ fontFamily: 'NanumMyeongjoExtraBold', fontSize: 45 }}
          >
            MIO
          </Text>
          <ThemedText
            type="smallTitle"
            className="text-center text-sm tracking-[0.25em] text-fg-muted"
          >
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
