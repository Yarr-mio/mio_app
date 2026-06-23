import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/api/queryKeys';
import type { OnboardingStyleType } from '@/constants/onboarding';
import { useOnboardingStatus } from '@/features/onboarding/hooks/useOnboarding';
import { getRecommendedCharacterIds } from '@/features/onboarding/utils/getRecommendedCharacterIds';
import type {
  OnboardingCharacterRecommendation,
  OnboardingStatusResponse,
} from '@/types/onboarding';

const ONBOARDING_STATUS_FETCH_ERROR_LOG =
  '[onboarding] Failed to fetch onboarding status for character recommendations';

export function useOnboardingCharacterRecommendations(preferredStyle: OnboardingStyleType | null) {
  const queryClient = useQueryClient();

  const cachedStatus = queryClient.getQueryData<OnboardingStatusResponse>(
    queryKeys.onboarding.status()
  );
  const cachedRecommendations = cachedStatus?.data.character_recommendations ?? null;
  const hasCachedRecommendations = (cachedRecommendations?.length ?? 0) > 0;

  const statusQuery = useOnboardingStatus(!hasCachedRecommendations);

  const apiRecommendations: OnboardingCharacterRecommendation[] | null = hasCachedRecommendations
    ? cachedRecommendations
    : (statusQuery.data?.data.character_recommendations ?? null);

  const recommendedIds = getRecommendedCharacterIds(preferredStyle, apiRecommendations);

  const isStatusLoading = !hasCachedRecommendations && statusQuery.isPending;

  useEffect(() => {
    if (!__DEV__ || hasCachedRecommendations || !statusQuery.isError) {
      return;
    }

    console.warn(ONBOARDING_STATUS_FETCH_ERROR_LOG, statusQuery.error);
  }, [hasCachedRecommendations, statusQuery.isError, statusQuery.error]);

  return {
    recommendedIds,
    apiRecommendations,
    isStatusLoading,
  };
}
