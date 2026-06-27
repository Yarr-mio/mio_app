import apiClient from '@/api/client';
import type { ApiResponse } from '@/types/common';
import type { MyProfile, MyProfileUpdateParams, MyProfileUpdateResponse } from '@/types/user';

export async function fetchMyPage(): Promise<MyProfile> {
  const { data } = await apiClient.get<ApiResponse<MyProfile>>('/v1/users/me');
  return data.data;
}

export async function updateMyProfile(
  params: MyProfileUpdateParams
): Promise<MyProfileUpdateResponse> {
  const { data } = await apiClient.patch<ApiResponse<MyProfileUpdateResponse>>(
    '/v1/users/me',
    params
  );
  return data.data;
}
