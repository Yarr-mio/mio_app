import { ONBOARDING_DEFAULT_CHARACTER_ID } from '@/constants/characters';
import { useUserStore } from '@/store/userStore';

export function useSelectedCharacterId() {
  return useUserStore(
    (state) => state.onboardingResult?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID
  );
}
