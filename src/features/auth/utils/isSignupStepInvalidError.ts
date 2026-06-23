import { HTTP_STATUS } from '@/constants/config';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';

export function isSignupStepInvalidError(error: unknown): boolean {
  const status = readApiHttpStatus(error);
  const errorCode = readApiErrorCode(error);
  return status === HTTP_STATUS.FORBIDDEN && errorCode === 'SIGNUP_STEP_INVALID';
}
