import { isAxiosError } from 'axios';
import { HTTP_STATUS } from '@/constants/config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isAxiosStatusMessage(message: string): boolean {
  return /^request failed with status code \d+$/i.test(message.trim());
}

export const API_ERROR_FALLBACK_MESSAGE = '오류가 발생했습니다. 다시 시도해 주세요.';

/** fetch 및 axios 응답 본문 에러 코드 추출 */
export function readErrorCodeFromBody(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }

  const direct = data.error_code;
  if (typeof direct === 'string') {
    return direct;
  }

  const topLevelCode = data.code;
  if (typeof topLevelCode === 'string') {
    return topLevelCode;
  }

  const nested = data.error;
  if (isRecord(nested) && typeof nested.code === 'string') {
    return nested.code;
  }

  return null;
}

export function readApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  return readErrorCodeFromBody(error.response?.data);
}

export function readApiHttpStatus(error: unknown): number | null {
  if (!isAxiosError(error)) {
    return null;
  }

  return error.response?.status ?? null;
}

/**
 * 4xx 여부 — 같은 요청을 다시 보내도 결과가 바뀌지 않는(재시도가 무의미한) 실패인지 판별한다.
 * 5xx·네트워크 오류는 재시도 가치가 있으므로 여기에 포함하지 않는다.
 */
export function isClientErrorStatus(status: number | null): boolean {
  if (status === null) {
    return false;
  }

  return status >= HTTP_STATUS.BAD_REQUEST && status < HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export function readApiErrorMessage(error: unknown, fallback = API_ERROR_FALLBACK_MESSAGE): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (isRecord(data)) {
      const nested = data.error;
      if (isRecord(nested) && typeof nested.message === 'string') {
        const nestedMessage = nested.message.trim();
        if (nestedMessage.length > 0) {
          return nestedMessage;
        }
      }

      const directMessage = data.message;
      if (typeof directMessage === 'string') {
        const trimmedMessage = directMessage.trim();
        if (trimmedMessage.length > 0) {
          return trimmedMessage;
        }
      }
    }

    if (error.message && !isAxiosStatusMessage(error.message)) {
      return error.message;
    }

    return fallback;
  }

  if (error instanceof Error && error.message && !isAxiosStatusMessage(error.message)) {
    return error.message;
  }

  return fallback;
}
