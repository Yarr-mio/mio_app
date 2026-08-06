import type { OnboardingCharacterId } from '@/constants/characters';
import { useUserStore } from '@/store/userStore';

export function useOnboardingSelection() {
  const onboardingResult = useUserStore((state) => state.onboardingResult);
  const patchOnboardingCharacterId = useUserStore((state) => state.patchOnboardingCharacterId);
  const clearOnboardingCharacterId = useUserStore((state) => state.clearOnboardingCharacterId);

  const character_id = onboardingResult?.characterId ?? null;

  const setCharacterId = (id: OnboardingCharacterId | null) => {
    if (id === null) {
      clearOnboardingCharacterId();
      return;
    }

    patchOnboardingCharacterId(id);
  };

  return {
    character_id,
    setCharacterId,
  };
}
