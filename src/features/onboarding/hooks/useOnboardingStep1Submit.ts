import { useRouter } from 'expo-router';
import { useState } from 'react';

import { ONBOARDING_DEFAULT_EMOJI_SCORE, ONBOARDING_QUESTION_IDS } from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { useOnboardingStep1 } from '@/features/onboarding/hooks/useOnboarding';
import { useUserStore } from '@/store/userStore';
import type { EmotionType } from '@/types/checkin';

export function useOnboardingStep1Submit() {
  const router = useRouter();
  const onboardingStep1 = useOnboardingStep1();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const patchOnboardingEmotion = useUserStore((state) => state.patchOnboardingEmotion);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (emotionState: EmotionType, emojiScore: number | null) => {
    setError(null);

    const resolvedEmojiScore = emojiScore ?? ONBOARDING_DEFAULT_EMOJI_SCORE;

    try {
      await onboardingStep1.mutateAsync({
        emotion_state: emotionState,
        responses: [{ question_id: ONBOARDING_QUESTION_IDS.step1, answer: emotionState }],
      });
      patchOnboardingEmotion(emotionState, resolvedEmojiScore);
      router.push(AUTH_ROUTES.onboardingStep2);
      return { emojiScore: resolvedEmojiScore };
    } catch (submitError) {
      if (isSignupStepInvalidError(submitError)) {
        await handleSignupStepInvalid();
        return null;
      }

      setError(readApiErrorMessage(submitError));
      return null;
    }
  };

  return {
    submit,
    isPending: onboardingStep1.isPending,
    error,
    clearError,
  };
}
