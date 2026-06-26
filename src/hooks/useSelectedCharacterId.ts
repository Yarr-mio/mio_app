import {
  ONBOARDING_DEFAULT_CHARACTER_ID,
  getCharacterNameById,
  toOnboardingCharacterId,
} from '@/constants/characters';
import { resolveStoredNickname, useUserStore } from '@/store/userStore';

export function useSelectedCharacterId() {
  const authProfileCharacterId = useUserStore((state) => state.authProfile?.characterId);
  const onboardingCharacterId = useUserStore((state) => state.onboardingResult?.characterId);
  const characterId =
    authProfileCharacterId ?? onboardingCharacterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;

  return toOnboardingCharacterId(characterId);
}

export function useSelectedCharacterName() {
  const characterId = useSelectedCharacterId();
  return getCharacterNameById(characterId);
}

export function useSelectedNickname() {
  const authProfile = useUserStore((state) => state.authProfile);
  const onboardingResult = useUserStore((state) => state.onboardingResult);

  return resolveStoredNickname(authProfile, onboardingResult);
}
