import apiClient from '@/api/client';
import type { ApiResponse } from '@/types/common';
import type {
  ChangeCharacterParams,
  CharacterSummary,
  MyCharacterUpdateResponse,
  UserCharacter,
} from '@/types/user';

export async function fetchCharacters(): Promise<CharacterSummary[]> {
  const { data } = await apiClient.get<ApiResponse<CharacterSummary[]>>('/v1/characters');
  return data.data;
}

export async function fetchMyCharacter(options?: {
  skipAuthRedirect?: boolean;
}): Promise<UserCharacter> {
  const { data } = await apiClient.get<ApiResponse<UserCharacter>>('/v1/user/character', {
    _skipAuthRedirect: options?.skipAuthRedirect,
  });
  return data.data;
}

export async function changeMyCharacter(
  params: ChangeCharacterParams
): Promise<MyCharacterUpdateResponse> {
  const { data } = await apiClient.post<ApiResponse<MyCharacterUpdateResponse>>(
    '/v1/user/character',
    params
  );
  return data.data;
}
