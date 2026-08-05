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
};

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

  if (input.employmentStatus) {
    body.employment_status = input.employmentStatus;
  }

  return body;
}
