import type { EmploymentStatus } from '@/types/auth';

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'student_or_unemployed', label: '대학(원)생 및 무직' },
  { value: 'job_seeker', label: '취업 준비 중' },
  { value: 'employed', label: '재직 중' },
] as const satisfies readonly { value: EmploymentStatus; label: string }[];
