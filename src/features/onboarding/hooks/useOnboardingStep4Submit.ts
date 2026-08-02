import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { OnboardingCharacterId } from '@/constants/characters';
import { AUTH_ROUTES } from '@/constants/routes';
import { useHandleSignupStepInvalid } from '@/features/auth/hooks/useHandleSignupStepInvalid';
import { isSignupStepInvalidError } from '@/features/auth/utils/isSignupStepInvalidError';
import { useOnboardingCharacter } from '@/features/onboarding/hooks/useOnboarding';
import { resolveStoredNickname, useUserStore } from '@/store/userStore';
import { readApiErrorMessage } from '@/utils/readApiError';

export function useOnboardingStep4Submit() {
  const router = useRouter();
  const onboardingCharacter = useOnboardingCharacter();
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
      const response = await onboardingCharacter.mutateAsync({ character_id: characterId });
      // 응답의 preferred_character_id 우선, 없으면 요청한 characterId 사용
      const preferredCharacterId = response.data.preferred_character_id ?? characterId;
      patchOnboardingCharacterId(preferredCharacterId);

      // authProfile.characterId가 useSelectedCharacterId에서 우선순위가 높으므로
      // 선택한 캐릭터로 함께 갱신해 완료 화면에 정확히 반영되도록
      const { authProfile, onboardingResult } = useUserStore.getState();
      const nickname = resolveStoredNickname(authProfile, onboardingResult);
      setAuthProfile({
        nickname: nickname ?? '',
        characterId: preferredCharacterId,
      });

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
