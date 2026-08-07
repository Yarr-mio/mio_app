import type { AgeRange, AuthSignupProfileRequest, Gender } from '@/types/auth';
import type { UserAgeRange, UserEmploymentStatus, UserGender } from '@/types/user';

const USER_AGE_TO_API: Record<UserAgeRange, AgeRange> = {
  '10s': '10대',
  '20s': '20대',
  '30s': '30대',
  '40s': '40대+',
};

const USER_GENDER_TO_API: Record<UserGender, Gender> = {
  female: 'female',
  male: 'male',
  other: 'other',
};

/**
 * 프로덕션 서버의 employment_status 화이트리스트가 아직 2종(`job_seeker`/`employed`)이라
 * 이 값을 실어 보내면 `POST /v1/auth/signup/profile`이 400 INVALID_INPUT으로 떨어져
 * **가입 자체가 막힌다** — 코호트 한 칸이 아니라 그 사용자의 모든 이벤트를 잃는다.
 *
 * 선택 필드라 미전송 시 null로 저장되므로, 해당 응답자는 `(미응답)`으로 흡수된다.
 * 틀린 값이 아니라 빈 값이므로 서버 복구 후 자연히 정확해진다.
 *
 * TODO: 서버 3종 확장(#347)이 프로덕션에 반영되면 이 상수와 아래 분기를 제거한다.
 * 선택지 자체(`EMPLOYMENT_STATUS_OPTIONS`)는 건드리지 않는다 — UI에서 지우면
 * 해당 사용자가 다른 값을 고르게 돼 영구히 오염된 데이터가 남는다.
 */
const UNSUPPORTED_EMPLOYMENT_STATUS: UserEmploymentStatus = 'student_or_unemployed';

interface SignupProfileFormInput {
  nickname: string;
  gender: UserGender | null;
  ageRange: UserAgeRange | null;
  employmentStatus: UserEmploymentStatus | null;
}

export function mapSignupProfileInput(input: SignupProfileFormInput): AuthSignupProfileRequest {
  const body: AuthSignupProfileRequest = { nickname: input.nickname };

  if (input.ageRange) {
    body.age_range = USER_AGE_TO_API[input.ageRange];
  }

  if (input.gender) {
    body.gender = USER_GENDER_TO_API[input.gender];
  }

  if (input.employmentStatus && input.employmentStatus !== UNSUPPORTED_EMPLOYMENT_STATUS) {
    body.employment_status = input.employmentStatus;
  }

  return body;
}
