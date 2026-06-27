import { fetchMyCharacter } from '@/api/endpoints/character';
import { ONBOARDING_DEFAULT_CHARACTER_ID } from '@/constants/characters';
import { useAuthStore } from '@/store/authStore';
import { resolveStoredNickname, useUserStore } from '@/store/userStore';

export async function syncAuthProfileCharacterFromServer(): Promise<void> {
  const sessionToken = useAuthStore.getState().accessToken;
  if (!sessionToken) {
    return;
  }

  try {
    const character = await fetchMyCharacter({ skipAuthRedirect: true });

    if (useAuthStore.getState().accessToken !== sessionToken) {
      return;
    }

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
