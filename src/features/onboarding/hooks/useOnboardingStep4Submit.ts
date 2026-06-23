import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { OnboardingCharacterId } from '@/constants/characters';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { readApiErrorMessage } from '@/features/auth/utils/readApiError';
import { useOnboardingCharacter } from '@/features/onboarding/hooks/useOnboarding';
import { useUserStore } from '@/store/userStore';

export function useOnboardingStep4Submit() {
  const router = useRouter();
  const onboardingCharacter = useOnboardingCharacter();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const patchOnboardingCharacterId = useUserStore((state) => state.patchOnboardingCharacterId);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (characterId: OnboardingCharacterId) => {
    setError(null);

    try {
      const response = await onboardingCharacter.mutateAsync({ character_id: characterId });
      const preferredCharacterId = response.data.preferred_character_id;
      patchOnboardingCharacterId(preferredCharacterId);
      router.push(AUTH_ROUTES.onboardingComplete);
    } catch (submitError) {
      if (isSignupStepInvalidError(submitError)) {
        await handleSignupStepInvalid();
        return;
      }

      setError(readApiErrorMessage(submitError));
    }
  };

  return {
    submit,
    isPending: onboardingCharacter.isPending,
    error,
    clearError,
  };
}
