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
      // 개편 후 Step4CharacterScreen은 선택해야만 「다음」 CTA를 노출하므로, 앱에서 출발한 요청은
      // 전부 명시 선택이다 → false 고정이 사실과 일치한다. 서버 자동 배정은 이 API를 호출하지
      // 않은 경우에만 일어나고 그때는 이 이벤트 자체가 없다. BE 응답에 필드가 열리면 그 값으로 교체
      track('character_selected', {
        character_id: res.data.preferred_character_id ?? variables.character_id,
        is_auto_assigned: false,
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
