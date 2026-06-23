import apiClient from '@/api/client';
import { USE_MOCK } from '@/constants/config';
import type { SignupStep } from '@/types/auth';
import type { ApiMeta } from '@/types/common';
import type {
  OnboardingCharacterRecommendation,
  OnboardingCharacterRequest,
  OnboardingCharacterResponse,
  OnboardingProgressStep,
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

function createMockMeta(): ApiMeta {
  return { trace_id: `mock_${Date.now()}` };
}

let mockOnboardingStep: OnboardingProgressStep = 0;
let mockSignupStep: SignupStep = 'PROFILE_COMPLETED';
let mockCharacterRecommendations: OnboardingCharacterRecommendation[] | null = null;

const MOCK_CHARACTER_RECOMMENDATIONS: OnboardingCharacterRecommendation[] = [
  {
    character_id: 'mio',
    name: '미오',
    match_score: 0.92,
    reason: '공감형 상담 스타일과 잘 맞아요',
  },
  {
    character_id: 'bau',
    name: '바우',
    match_score: 0.85,
    reason: '행동 중심 접근에 적합해요',
  },
];

function setMockOnboardingStep(step: OnboardingProgressStep): void {
  mockOnboardingStep = step;
}

/**
 * 온보딩 1단계 감정 상태 제출
 */
export async function postOnboardingStep1(
  body: OnboardingStep1Request
): Promise<OnboardingStep1Response> {
  if (USE_MOCK) {
    setMockOnboardingStep(1);
    return {
      data: { onboarding_step: 1 },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<OnboardingStep1Response>('/v1/onboarding/step/1', body);
  return data;
}

/**
 * 온보딩 2단계 주요 고민 유형 제출
 */
export async function postOnboardingStep2(
  body: OnboardingStep2Request
): Promise<OnboardingStep2Response> {
  if (USE_MOCK) {
    setMockOnboardingStep(2);
    return {
      data: { onboarding_step: 2 },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<OnboardingStep2Response>('/v1/onboarding/step/2', body);
  return data;
}

/**
 * 온보딩 3단계 선호 상담 스타일 제출 및 캐릭터 추천
 */
export async function postOnboardingStep3(
  body: OnboardingStep3Request
): Promise<OnboardingStep3Response> {
  if (USE_MOCK) {
    setMockOnboardingStep(3);
    mockCharacterRecommendations = MOCK_CHARACTER_RECOMMENDATIONS;
    return {
      data: {
        onboarding_step: 3,
        character_recommendations: MOCK_CHARACTER_RECOMMENDATIONS,
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<OnboardingStep3Response>('/v1/onboarding/step/3', body);
  return data;
}

/**
 * 온보딩 단계 건너뛰기
 */
export async function postOnboardingStepSkip(
  stepNumber: OnboardingSkippableStep
): Promise<OnboardingStepSkipResponse> {
  if (USE_MOCK) {
    setMockOnboardingStep(stepNumber);
    return {
      data: { onboarding_step: stepNumber },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.post<OnboardingStepSkipResponse>(
    `/v1/onboarding/step/${stepNumber}/skip`
  );
  return data;
}

/**
 * 온보딩 캐릭터 선택
 */
export async function postOnboardingCharacter(
  body: OnboardingCharacterRequest
): Promise<OnboardingCharacterResponse> {
  if (USE_MOCK) {
    mockSignupStep = 'ONBOARDING_COMPLETED';
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

/**
 * 온보딩 상태 조회
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  if (USE_MOCK) {
    return {
      data: {
        onboarding_step: mockOnboardingStep,
        signup_step: mockSignupStep,
        character_recommendations: mockCharacterRecommendations,
      },
      meta: createMockMeta(),
    };
  }

  const { data } = await apiClient.get<OnboardingStatusResponse>('/v1/onboarding/status');
  return data;
}
