import { Platform, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { AuthTextClasses, ScreenSpacing } from '@/constants/theme';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';
import { useAppleLogin } from '@/features/auth/hooks/useAppleLogin';
import { useKakaoLogin } from '@/features/auth/hooks/useKakaoLogin';

export default function LoginScreen() {
  const kakaoLogin = useKakaoLogin();
  const appleLogin = useAppleLogin();

  const isLoginPending = kakaoLogin.isPending || appleLogin.isPending;

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground variant="login" />
      <ScreenContainer className="flex-1 px-6" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="flex-1 items-center justify-center gap-6">
          <Text className={AuthTextClasses.appTitle}>MIO</Text>
          <ThemedText
            type="smallTitle"
            className="text-center text-sm tracking-[0.25em] text-fg-muted"
          >
            마음의 이야기
          </ThemedText>
        </View>

        <View className="gap-3 pb-2">
          {Platform.OS === 'ios' ? (
            <SocialLoginButton
              provider="apple"
              onPress={appleLogin.login}
              disabled={isLoginPending}
            />
          ) : null}
          <SocialLoginButton
            provider="kakao"
            onPress={kakaoLogin.login}
            disabled={isLoginPending}
          />
          {appleLogin.error ? (
            <ThemedText type="small" className="text-center text-danger">
              {appleLogin.error}
            </ThemedText>
          ) : null}
          {kakaoLogin.error ? (
            // ErrorState 컴포넌트 구현 후 교체할 것
            <ThemedText type="small" className="text-center text-danger">
              {kakaoLogin.error}
            </ThemedText>
          ) : null}
        </View>
      </ScreenContainer>
    </View>
  );
}
