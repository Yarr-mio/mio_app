import { useMutation, useQuery } from '@tanstack/react-query';

import { track } from '@/analytics/track';
import {
  getOnboardingStatus,
  postOnboardingCharacter,
  postOnboardingStep1,
  postOnboardingStep2,
  postOnboardingStep3,
  postOnboardingStepSkip,
} from '@/api/endpoints/onboarding';
import { queryKeys } from '@/api/queryKeys';
import type {
  OnboardingCharacterRequest,
  OnboardingCharacterResponse,
  OnboardingSkippableStep,
  OnboardingStatusResponse,
  OnboardingStep1Request,
  OnboardingStep1Response,
  OnboardingStep2Request,
  OnboardingStep2Response,
  OnboardingStep3Request,
  OnboardingStep3Response,
  OnboardingStepSkipResponse,
} from '@/types/onboarding';

export function useOnboardingStep1() {
  return useMutation<OnboardingStep1Response, Error, OnboardingStep1Request>({
    mutationFn: (body) => postOnboardingStep1(body),
  });
}

export function useOnboardingStep2() {
  return useMutation<OnboardingStep2Response, Error, OnboardingStep2Request>({
    mutationFn: (body) => postOnboardingStep2(body),
  });
}

export function useOnboardingStep3() {
  return useMutation<OnboardingStep3Response, Error, OnboardingStep3Request>({
    mutationFn: (body) => postOnboardingStep3(body),
  });
}

export function useOnboardingStepSkipMutation() {
  return useMutation<OnboardingStepSkipResponse, Error, OnboardingSkippableStep>({
    mutationFn: (stepNumber) => postOnboardingStepSkip(stepNumber),
  });
}

export function useOnboardingCharacter() {
  return useMutation<OnboardingCharacterResponse, Error, OnboardingCharacterRequest>({
    mutationFn: (body) => postOnboardingCharacter(body),
    onSuccess: (res, variables) => {
      // ⚠️ is_auto_assigned는 응답에 없다(서버가 미선택 시 자동 배정하는데 앱은 그 사실을 모른다).
      // 로컬 플래그로 대체하면 서버 판정과 갈라지므로 응답 필드가 열릴 때까지 싣지 않는다
      track('character_selected', {
        character_id: res.data.preferred_character_id ?? variables.character_id,
      });
    },
  });
}

export function useOnboardingStatus(enabled = true) {
  return useQuery<OnboardingStatusResponse, Error>({
    queryKey: queryKeys.onboarding.status(),
    queryFn: () => getOnboardingStatus(),
    enabled,
  });
}
