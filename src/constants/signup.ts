import type { EmploymentStatus } from '@/types/auth';

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'student_or_unemployed', label: '대학(원)생 및 무직' },
  { value: 'job_seeker', label: '취업 준비 중' },
  { value: 'employed', label: '재직 중' },
] as const satisfies readonly { value: EmploymentStatus; label: string }[];

export const SIGNUP_NEXT_BUTTON_LABEL = '다음';

export const SIGNUP_COMPLETE_COPY = {
  greeting: '반가워요!',
  title: (partnerName: string) => `${partnerName}와 함께\n여정을 떠나 볼까요?`,
  startButton: (partnerName: string) => `${partnerName}와 시작하기`,
} as const;
