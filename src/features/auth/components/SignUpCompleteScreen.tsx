import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import { HTTP_STATUS } from '@/constants/config';
import { AUTH_ROUTES } from '@/constants/routes';
import { ScreenSpacing } from '@/constants/theme';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import { useSignupComplete, useSignupStatus } from '@/features/auth/hooks/useAuth';
import { handleSignupStepInvalid } from '@/features/auth/utils/handleSignupStepInvalid';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';

const SIGNUP_USER_PROFILE_IMAGE = require('@/assets/images/signup/signup_user_profile.png');

const SIGNUP_STEP_COUNT = 4;
const SIGNUP_CURRENT_STEP = 4;
const PROFILE_IMAGE_SIZE = 107;

const MOCK_SIGNUP_USER = {
  nickname: '하늘',
} as const;

interface FeatureHighlight {
  emoji: string;
  lines: [string, string];
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  { emoji: '💬', lines: ['언제든 감정을', '털어놓아요'] },
  { emoji: '📝', lines: ['감정 변화를', '함께 돌아봐요'] },
  { emoji: '✨', lines: ['나만의 패턴을', '발견해요'] },
];

function resolveNickname(param: string | string[] | undefined): string {
  const raw = Array.isArray(param) ? param[0] : param;
  const trimmed = raw?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return MOCK_SIGNUP_USER.nickname;
}

interface FeatureHighlightCardProps {
  emoji: string;
  lines: [string, string];
}

function FeatureHighlightCard({ emoji, lines }: FeatureHighlightCardProps) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-accent/10 bg-accent/5 px-2 py-6">
      <ThemedText type="default" className="text-center">
        {emoji}
      </ThemedText>
      <ThemedText type="small" className="mt-2 text-center text-fg-high">
        {lines[0]}
        {'\n'}
        {lines[1]}
      </ThemedText>
    </View>
  );
}

export default function SignUpCompleteScreen() {
  const router = useRouter();
  const { nickname: nicknameParam } = useLocalSearchParams<{ nickname?: string }>();
  const nickname = resolveNickname(nicknameParam);
  const signupComplete = useSignupComplete();
  const signupStatus = useSignupStatus();
  const isPending = signupComplete.isPending || signupStatus.isPending;

  const handleStartPartnerMatching = async () => {
    if (isPending) {
      return;
    }

    try {
      const statusResponse = await signupStatus.mutateAsync();

      if (statusResponse.data.signup_step === 'ONBOARDING_COMPLETED') {
        const response = await signupComplete.mutateAsync();

        if (response.data.signup_step !== 'COMPLETED' || response.data.status !== 'ACTIVE') {
          throw new Error('회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.');
        }

        router.replace(AUTH_ROUTES.home);
        return;
      }

      router.push(AUTH_ROUTES.onboardingStep1);
    } catch (error) {
      const status = readApiHttpStatus(error);
      const errorCode = readApiErrorCode(error);

      if (status === HTTP_STATUS.FORBIDDEN && errorCode === 'SIGNUP_STEP_INVALID') {
        await handleSignupStepInvalid(router);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : '회원가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';
      Alert.alert('회원가입 완료', message);
    }
  };

  return (
    <View className="flex-1 bg-midnight">
      <AuthBackground />
      <ScreenContainer className="flex-1 px-8" bottomInsetMin={ScreenSpacing.bottomInsetMin}>
        <View className="pt-4 mt-6">
          <StepIndicator totalSteps={SIGNUP_STEP_COUNT} currentStep={SIGNUP_CURRENT_STEP} />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow pb-4"
        >
          <View className="mt-[101px] items-center">
            <Image
              source={SIGNUP_USER_PROFILE_IMAGE}
              contentFit="contain"
              style={{ width: PROFILE_IMAGE_SIZE, height: PROFILE_IMAGE_SIZE }}
            />
          </View>

          <View className="mt-[56px] items-center">
            <ThemedText type="title" className="text-center text-fg">
              {nickname} 님,{'\n'}미오가 기다리고 있었어요
            </ThemedText>
            <ThemedText type="subtitle" className="mt-8 text-center text-subtitle">
              만나서 반가워요{'\n'}
              {nickname} 님의 소울 메이트를 찾으러 가 볼까요?
            </ThemedText>
          </View>

          <View className="mt-[119px] flex-row gap-2">
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <FeatureHighlightCard
                key={feature.emoji}
                emoji={feature.emoji}
                lines={feature.lines}
              />
            ))}
          </View>
        </ScrollView>

        <View className="pt-4">
          <Button disabled={isPending} onPress={handleStartPartnerMatching}>
            파트너 매칭 시작
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
