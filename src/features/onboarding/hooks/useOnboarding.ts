import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getOnboardingStatus,
  postOnboardingCharacter,
  postOnboardingStep1,
  postOnboardingStep2,
  postOnboardingStep3,
} from '@/api/endpoints/onboarding';
import { queryKeys } from '@/api/queryKeys';
import type {
  OnboardingCharacterRequest,
  OnboardingCharacterResponse,
  OnboardingStatusResponse,
  OnboardingStep1Request,
  OnboardingStep1Response,
  OnboardingStep2Request,
  OnboardingStep2Response,
  OnboardingStep3Request,
  OnboardingStep3Response,
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

export function useOnboardingCharacter() {
  return useMutation<OnboardingCharacterResponse, Error, OnboardingCharacterRequest>({
    mutationFn: (body) => postOnboardingCharacter(body),
  });
}

export function useOnboardingStatus(enabled = true) {
  return useQuery<OnboardingStatusResponse, Error>({
    queryKey: queryKeys.onboarding.status(),
    queryFn: () => getOnboardingStatus(),
    enabled,
  });
}
