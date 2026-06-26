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

export async function fetchMyCharacter(): Promise<UserCharacter> {
  // 배경 동기화 전용 요청이므로 401 시 강제 로그아웃 리다이렉트에서 제외
  const { data } = await apiClient.get<ApiResponse<UserCharacter>>('/v1/user/character', {
    _skipAuthRedirect: true,
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
