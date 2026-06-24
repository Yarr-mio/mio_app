import { useEffect } from 'react';

import {
  ONBOARDING_DEFAULT_CHARACTER_ID,
  getCharacterNameById,
  toOnboardingCharacterId,
} from '@/constants/characters';
import { useUserStore } from '@/store/userStore';

export function useSelectedCharacterId() {
  const authProfileCharacterId = useUserStore((state) => state.authProfile?.characterId);
  const onboardingCharacterId = useUserStore((state) => state.onboardingResult?.characterId);
  const characterId =
    authProfileCharacterId ?? onboardingCharacterId ?? ONBOARDING_DEFAULT_CHARACTER_ID;
  const resolvedCharacterId = toOnboardingCharacterId(characterId);

  useEffect(() => {
    const source = authProfileCharacterId
      ? 'authProfile'
      : onboardingCharacterId
        ? 'onboardingResult'
        : 'default';

    console.log('[디버그][useSelectedCharacterId] 현재 적용된 characterId', resolvedCharacterId, {
      source,
    });
  }, [resolvedCharacterId, authProfileCharacterId, onboardingCharacterId]);

  return resolvedCharacterId;
}

export function useSelectedCharacterName() {
  const characterId = useSelectedCharacterId();
  return getCharacterNameById(characterId);
}

export function useSelectedNickname() {
  const authProfileNickname = useUserStore((state) => state.authProfile?.nickname);
  const onboardingNickname = useUserStore((state) => state.onboardingResult?.nickname);
  const nickname = authProfileNickname ?? onboardingNickname ?? null;

  useEffect(() => {
    const source = authProfileNickname
      ? 'authProfile'
      : onboardingNickname
        ? 'onboardingResult'
        : 'default';

    console.log('[디버그][useSelectedNickname] 현재 적용된 nickname', nickname, {
      source,
    });
  }, [nickname, authProfileNickname, onboardingNickname]);

  return nickname;
}
