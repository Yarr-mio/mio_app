import { isAxiosError } from 'axios';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

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
