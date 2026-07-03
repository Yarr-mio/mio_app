import { isAxiosError } from 'axios';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isAxiosStatusMessage(message: string): boolean {
  return /^request failed with status code \d+$/i.test(message.trim());
}

export const API_ERROR_FALLBACK_MESSAGE = '오류가 발생했습니다. 다시 시도해 주세요.';

export function readApiErrorCode(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data as unknown;
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

export function readApiHttpStatus(error: unknown): number | null {
  if (!isAxiosError(error)) {
    return null;
  }

  return error.response?.status ?? null;
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
