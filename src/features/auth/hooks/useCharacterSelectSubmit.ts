import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { OnboardingCharacterId } from '@/constants/characters';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { useSignupCharacter } from '@/features/auth/hooks/useSignupCharacter';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { resolveStoredNickname, useUserStore } from '@/store/userStore';
import { readApiErrorMessage } from '@/utils/readApiError';

export function useCharacterSelectSubmit() {
  const router = useRouter();
  const signupCharacter = useSignupCharacter();
  const { handleSignupStepInvalid } = useHandleSignupStepInvalid();
  const patchOnboardingCharacterId = useUserStore((state) => state.patchOnboardingCharacterId);
  const setAuthProfile = useUserStore((state) => state.setAuthProfile);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    setError(null);
  };

  const submit = async (characterId: OnboardingCharacterId) => {
    setError(null);

    try {
      const response = await signupCharacter.mutateAsync({ character_id: characterId });
      // 응답 preferred_character_id 우선 사용
      const preferredCharacterId = response.data.preferred_character_id ?? characterId;
      patchOnboardingCharacterId(preferredCharacterId);

      // 완료 화면 캐릭터 반영용 authProfile 갱신
      const { authProfile, onboardingResult } = useUserStore.getState();
      const nickname = resolveStoredNickname(authProfile, onboardingResult);
      setAuthProfile({
        nickname: nickname ?? '',
        characterId: preferredCharacterId,
      });

      router.push(AUTH_ROUTES.signupComplete);
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
    isPending: signupCharacter.isPending,
    error,
    clearError,
  };
}
