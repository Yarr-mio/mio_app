import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { ScreenSpacing } from '@/constants/theme';
import SocialLoginButton from '@/features/auth/components/SocialLoginButton';
import { useSocialLogin } from '@/features/auth/hooks/useAuth';
import { signInWithKakao } from '@/features/auth/utils/kakaoLogin';
import { navigateAfterLogin } from '@/features/auth/utils/navigateAfterLogin';

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function LoginScreen() {
  const router = useRouter();
  const socialLogin = useSocialLogin();

  const handleKakaoLogin = async () => {
    try {
      const accessToken = await signInWithKakao();
      const res = await socialLogin.mutateAsync({
        provider: 'kakao',
        accessToken,
        idToken: null,
      });
      await navigateAfterLogin(router, res.data.signup_step, res.data.is_new_user);
    } catch (error) {
      Alert.alert('카카오 로그인', getLoginErrorMessage(error));
    }
  };

  const handleAppleLogin = async () => {
    Alert.alert('애플 로그인', '애플 로그인은 준비 중입니다.');
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
      </ScreenContainer>
    </View>
  );
}
