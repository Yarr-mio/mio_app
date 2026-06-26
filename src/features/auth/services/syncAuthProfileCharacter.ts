import { fetchMyCharacter } from '@/api/endpoints/character';
import { ONBOARDING_DEFAULT_CHARACTER_ID } from '@/constants/characters';
import { resolveStoredNickname, useUserStore } from '@/store/userStore';

export async function syncAuthProfileCharacterFromServer(): Promise<void> {
  try {
    const character = await fetchMyCharacter();
    const { authProfile, onboardingResult, setAuthProfile } = useUserStore.getState();
    const nickname = resolveStoredNickname(authProfile, onboardingResult);

    setAuthProfile({
      nickname: nickname ?? '',
      characterId: character.character_id ?? ONBOARDING_DEFAULT_CHARACTER_ID,
    });
  } catch (error) {
    console.error('[syncAuthProfileCharacterFromServer]', error);
  }
}
