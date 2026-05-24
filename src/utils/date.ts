import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

function toKSTDateString(date: Date): string {
  // 'en-CA' 로케일은 YYYY-MM-DD 포맷을 반환 — KST(UTC+9) 기준으로 날짜 추출
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/** ISO 문자열(UTC)로 저장된 날짜가 한국 시간 기준 오늘인지 확인 */
export function isToday(isoString: string): boolean {
  return toKSTDateString(new Date(isoString)) === toKSTDateString(new Date());
}

export function formatCheckinFullDate(isoString: string): string {
  return format(new Date(isoString), 'yyyy년 M월 d일 EEEE', { locale: ko });
}

export function formatCheckinShortDate(isoString: string): string {
  return format(new Date(isoString), 'M월 d일', { locale: ko });
}

export function formatCheckinTime(isoString: string): string {
  return format(new Date(isoString), 'a h:mm', { locale: ko });
}
