import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { AUTH_ROUTES } from '@/constants/routes';
import { ScreenSpacing } from '@/constants/theme';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';
import { useKakaoLogin } from '@/features/auth/hooks/useKakaoLogin';

export default function LoginScreen() {
  const router = useRouter();
  const kakaoLogin = useKakaoLogin();

  const handleAppleLogin = async () => {
    Alert.alert('애플 로그인', '애플 로그인은 준비 중입니다.');
  };

  const handleGoHome = () => {
    router.replace(AUTH_ROUTES.home);
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground variant="login" />
      <ScreenContainer className="flex-1 px-6" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="flex-1 items-center justify-center gap-6">
          <Text className="font-NanumMyeongjoExtraBold text-[45px] tracking-[0.22em] text-ink-night">
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
          <SocialLoginButton
            provider="apple"
            onPress={handleAppleLogin}
            disabled={kakaoLogin.isPending}
          />
          <SocialLoginButton
            provider="kakao"
            onPress={kakaoLogin.login}
            disabled={kakaoLogin.isPending}
          />
          {kakaoLogin.error ? (
            // ErrorState 컴포넌트 구현 후 교체할 것
            <ThemedText type="small" className="text-center text-danger">
              {kakaoLogin.error}
            </ThemedText>
          ) : null}
          {__DEV__ ? (
            <Button onPress={handleGoHome} disabled={kakaoLogin.isPending}>
              홈화면 이동
            </Button>
          ) : null}
        </View>
      </ScreenContainer>
    </View>
  );
}
