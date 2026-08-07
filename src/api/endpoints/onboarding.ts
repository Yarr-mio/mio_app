import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type { ApiMeta } from '@/types/common';
import type { OnboardingCharacterRequest, OnboardingCharacterResponse } from '@/types/onboarding';

function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

/**
 * 온보딩 캐릭터 선택
 */
export async function postOnboardingCharacter(
  body: OnboardingCharacterRequest
): Promise<OnboardingCharacterResponse> {
  if (USE_MOCK) {
    return {
      data: {
        preferred_character_id: body.character_id,
        signup_step: 'ONBOARDING_COMPLETED',
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<OnboardingCharacterResponse>(
    '/v1/onboarding/character',
    body
  );
  return data;
}
