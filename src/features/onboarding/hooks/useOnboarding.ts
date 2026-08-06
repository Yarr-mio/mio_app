import { postOnboardingCharacter } from '@/api/endpoints/onboarding';
import type { OnboardingCharacterRequest, OnboardingCharacterResponse } from '@/types/onboarding';
import { useMutation } from '@tanstack/react-query';

export function useOnboardingCharacter() {
  return useMutation<OnboardingCharacterResponse, Error, OnboardingCharacterRequest>({
    mutationFn: (body) => postOnboardingCharacter(body),
  });
}
