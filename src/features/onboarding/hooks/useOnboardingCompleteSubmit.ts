import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { OnboardingCharacterId } from '@/constants/characters';
import type { OnboardingStyleType } from '@/constants/onboarding';
import { AUTH_ROUTES } from '@/constants/routes';
import { useSignupComplete } from '@/features/auth/hooks/useAuth';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import type { EmotionType } from '@/types/checkin';

const ONBOARDING_COMPLETE_ERROR_MESSAGE = '가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';

export interface OnboardingCompleteSubmitInput {
  emotionState: EmotionType | null;
  emojiScore: number | null;
  concernTypes: string[] | null;
  preferredStyle: OnboardingStyleType | null;
  characterId: OnboardingCharacterId;
  onBeforeNavigate: () => void;
}

export function useOnboardingCompleteSubmit() {
  const router = useRouter();
  const signupComplete = useSignupComplete();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (input: OnboardingCompleteSubmitInput) => {
    setError(null);

    input.onBeforeNavigate();

    try {
      await signupComplete.mutateAsync();
      router.replace(AUTH_ROUTES.home);
    } catch (submitError) {
      setError(readApiErrorMessage(submitError, ONBOARDING_COMPLETE_ERROR_MESSAGE));
    }
  };

  return {
    submit,
    isPending: signupComplete.isPending,
    error,
    clearError,
  };
}
