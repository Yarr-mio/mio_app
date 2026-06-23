import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { AuthBackground } from '@/components/themed/AuthBackground';
import { ThemedText } from '@/components/themed/ThemedText';
import { Button } from '@/components/ui/Button';
import {
  ScreenSpacing,
  SignupCompleteClasses,
  SignupCompleteLayout,
  SignupFlowLayout,
} from '@/constants/theme';
import { StepIndicator } from '@/features/auth/components/StepIndicator';
import { useSignupCompleteSubmit } from '@/features/auth/hooks/useSignupCompleteSubmit';
import { cn } from '@/utils/cn';

const SIGNUP_USER_PROFILE_IMAGE = require('@/assets/images/signup/signup_user_profile.png');

const SIGNUP_STEP_COUNT = SignupFlowLayout.totalSteps;
const SIGNUP_CURRENT_STEP = SignupFlowLayout.completeCurrentStep;
const PROFILE_IMAGE_SIZE = SignupCompleteLayout.profileImageSize;

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
  const { nickname: nicknameParam } = useLocalSearchParams<{ nickname?: string }>();
  const nickname = resolveNickname(nicknameParam);
  const { submit, isPending, error, clearError } = useSignupCompleteSubmit();

  const handleStartPartnerMatching = () => {
    if (isPending) {
      return;
    }

    clearError();
    void submit();
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
          <View className={cn('items-center', SignupCompleteClasses.profileTop)}>
            <Image
              source={SIGNUP_USER_PROFILE_IMAGE}
              contentFit="contain"
              style={{ width: PROFILE_IMAGE_SIZE, height: PROFILE_IMAGE_SIZE }}
            />
          </View>

          <View className={cn('items-center', SignupCompleteClasses.titleTop)}>
            <ThemedText type="title" className="text-center text-fg">
              {nickname} 님,{'\n'}미오가 기다리고 있었어요
            </ThemedText>
            <ThemedText type="subtitle" className="mt-8 text-center text-subtitle">
              만나서 반가워요{'\n'}
              {nickname} 님의 소울 메이트를 찾으러 가 볼까요?
            </ThemedText>
          </View>

          <View className={cn('flex-row gap-2', SignupCompleteClasses.highlightsTop)}>
            {FEATURE_HIGHLIGHTS.map((feature) => (
              <FeatureHighlightCard
                key={feature.emoji}
                emoji={feature.emoji}
                lines={feature.lines}
              />
            ))}
          </View>
        </ScrollView>

        <View className="pt-4 gap-2">
          {error ? <ErrorState message={error} /> : null}
          <Button disabled={isPending} onPress={handleStartPartnerMatching}>
            파트너 매칭 시작
          </Button>
        </View>
      </ScreenContainer>
    </View>
  );
}
