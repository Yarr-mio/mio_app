export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'university_student', label: '대학생/대학원생' },
  { value: 'job_seeker', label: '취업 준비 중' },
  { value: 'employed', label: '재직 중' },
  { value: 'self_employed', label: '자영업/프리랜서' },
  { value: 'homemaker', label: '전업주부/육아 중' },
] as const;

export type EmploymentStatusValue = (typeof EMPLOYMENT_STATUS_OPTIONS)[number]['value'];
