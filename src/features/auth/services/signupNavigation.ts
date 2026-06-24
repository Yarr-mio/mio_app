import { getAuthSignupStatus } from '@/api/endpoints/auth';
import { ONBOARDING_CURRENT_STEPS, ONBOARDING_SKIP_NEXT_ROUTES } from '@/constants/onboarding';
import { AUTH_ROUTES, type AuthRoute } from '@/constants/routes';
import { routeForSignupStep } from '@/features/auth/utils/routeForSignupStep';
import type { SignupStep } from '@/types/auth';
import type { OnboardingProgressStep } from '@/types/onboarding';

export function shouldFetchSignupStatus(signupStep: SignupStep, isNewUser: boolean): boolean {
  return isNewUser || signupStep !== 'COMPLETED';
}

function getScreenNameForAuthRoute(route: AuthRoute): string {
  const screenNames: Record<AuthRoute, string> = {
    [AUTH_ROUTES.login]: 'LoginScreen',
    [AUTH_ROUTES.termsOfService]: 'TermsOfServiceScreen',
    [AUTH_ROUTES.signupInfo]: 'SignupInfoScreen',
    [AUTH_ROUTES.signupComplete]: 'SignupCompleteScreen',
    [AUTH_ROUTES.onboardingStep1]: 'OnboardingStep1Screen',
    [AUTH_ROUTES.onboardingStep2]: 'OnboardingStep2Screen',
    [AUTH_ROUTES.onboardingStep3]: 'OnboardingStep3Screen',
    [AUTH_ROUTES.onboardingStep4]: 'OnboardingStep4Screen',
    [AUTH_ROUTES.onboardingComplete]: 'OnboardingCompleteScreen',
    [AUTH_ROUTES.home]: '홈 화면',
  };

  return screenNames[route];
}

function logSignupStatusNavigation(
  signupStep: SignupStep,
  route: AuthRoute,
  onboardingStep?: OnboardingProgressStep
): void {
  console.log(
    '[AUTH] signup status:',
    onboardingStep !== undefined
      ? { signup_step: signupStep, onboarding_step: onboardingStep }
      : { signup_step: signupStep },
    'to',
    getScreenNameForAuthRoute(route)
  );
}

// API 응답값을 온보딩 진행 단계 타입으로 정규화! 알 수 없는 값은 0으로 처리
function normalizeOnboardingProgressStep(step: number): OnboardingProgressStep {
  if (step === 0 || step === 1 || step === 2 || step === 3) {
    return step;
  }

  return 0;
}

// 프로필 완료 후 온보딩 진행도에 따라 재진입 화면 결정
function routeForProfileCompletedOnboardingStep(onboardingStep: OnboardingProgressStep): AuthRoute {
  switch (onboardingStep) {
    case 0:
      return AUTH_ROUTES.signupComplete;
    case ONBOARDING_CURRENT_STEPS.step1:
      return ONBOARDING_SKIP_NEXT_ROUTES[ONBOARDING_CURRENT_STEPS.step1];
    case ONBOARDING_CURRENT_STEPS.step2:
      return ONBOARDING_SKIP_NEXT_ROUTES[ONBOARDING_CURRENT_STEPS.step2];
    case ONBOARDING_CURRENT_STEPS.step3:
      return ONBOARDING_SKIP_NEXT_ROUTES[ONBOARDING_CURRENT_STEPS.step3];
  }
}

function routeForSignupStatus(
  signupStep: SignupStep,
  onboardingStep: OnboardingProgressStep
): AuthRoute {
  if (signupStep === 'PROFILE_COMPLETED') {
    return routeForProfileCompletedOnboardingStep(onboardingStep);
  }

  return routeForSignupStep(signupStep);
}

export async function resolveRouteFromSignupStatus(): Promise<AuthRoute> {
  const status = await getAuthSignupStatus();
  const { signup_step: signupStep, onboarding_step: onboardingStep } = status.data;
  const normalizedOnboardingStep = normalizeOnboardingProgressStep(onboardingStep);
  const route = routeForSignupStatus(signupStep, normalizedOnboardingStep);
  logSignupStatusNavigation(signupStep, route, normalizedOnboardingStep);
  return route;
}

export interface FetchedSignupStatus {
  signup_step: SignupStep;
  onboarding_step: number;
}

export function resolveSignupRoute(
  signupStep: SignupStep,
  isNewUser: boolean,
  fetchedStatus?: FetchedSignupStatus
): AuthRoute {
  console.log('[AUTH] login response:', {
    is_new_user: isNewUser,
    signup_step: signupStep,
  });

  if (!isNewUser && signupStep === 'COMPLETED') {
    return AUTH_ROUTES.home;
  }

  const needsStatusFetch = shouldFetchSignupStatus(signupStep, isNewUser);
  const targetStep = needsStatusFetch && fetchedStatus ? fetchedStatus.signup_step : signupStep;

  if (targetStep === 'PROFILE_COMPLETED' && fetchedStatus) {
    const normalizedOnboardingStep = normalizeOnboardingProgressStep(fetchedStatus.onboarding_step);
    const route = routeForSignupStatus(targetStep, normalizedOnboardingStep);
    logSignupStatusNavigation(targetStep, route, normalizedOnboardingStep);
    return route;
  }

  const route = routeForSignupStep(targetStep);

  if (needsStatusFetch && fetchedStatus) {
    logSignupStatusNavigation(targetStep, route);
  }

  return route;
}
