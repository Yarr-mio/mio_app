import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { changeMyCharacter, fetchCharacters, fetchMyCharacter } from '@/api/endpoints/character';
import { fetchMyPage, updateMyProfile } from '@/api/endpoints/my';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/api/endpoints/notification';
import { queryKeys } from '@/api/queryKeys';
import { ONBOARDING_DEFAULT_CHARACTER_ID } from '@/constants/characters';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import type { ChangeCharacterParams, MyProfileUpdateParams } from '@/types/user';

function useLogQueryError(label: string, error: unknown) {
  useEffect(() => {
    if (error) {
      console.error(`[${label}]`, error);
    }
  }, [label, error]);
}

export function useMyPage() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: queryKeys.my.profile(),
    queryFn: fetchMyPage,
    enabled: Boolean(accessToken),
  });

  useLogQueryError('useMyPage', query.error);

  return query;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: MyProfileUpdateParams) => updateMyProfile(params),
    onSuccess: (response) => {
      const authProfile = useUserStore.getState().authProfile;

      useUserStore.getState().setAuthProfile({
        nickname: response.nickname,
        characterId: authProfile?.characterId ?? ONBOARDING_DEFAULT_CHARACTER_ID,
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.my.profile() });
    },
    onError: (error) => {
      console.error('[useUpdateProfile]', error);
    },
  });
}

export function useCharacters() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: queryKeys.my.characters(),
    queryFn: fetchCharacters,
    enabled: Boolean(accessToken),
  });

  useLogQueryError('useCharacters', query.error);

  return query;
}

export function useMyCharacter() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: queryKeys.my.character(),
    queryFn: () => fetchMyCharacter(),
    enabled: Boolean(accessToken),
  });

  useLogQueryError('useMyCharacter', query.error);

  return query;
}

export function useChangeCharacter() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (params: ChangeCharacterParams) => changeMyCharacter(params),
    onSuccess: async (response) => {
      const authProfile = useUserStore.getState().authProfile;

      useUserStore.getState().setAuthProfile({
        nickname: authProfile?.nickname ?? '',
        characterId: response.character_id,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.my.profile() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.my.character() }),
      ]);
      router.back();
    },
    onError: (error) => {
      console.error('[useChangeCharacter]', error);
    },
  });
}

export function useNotificationSettings() {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: queryKeys.my.notificationSettings(),
    queryFn: fetchNotificationSettings,
    enabled: Boolean(accessToken),
  });

  useLogQueryError('useNotificationSettings', query.error);

  return query;
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.my.notificationSettings() });
    },
    onError: (error) => {
      console.error('[useUpdateNotificationSettings]', error);
    },
  });
}
