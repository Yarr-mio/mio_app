import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatCheckinFullDate(isoString: string): string {
  return format(new Date(isoString), 'yyyy년 M월 d일 EEEE', { locale: ko });
}

export function formatCheckinShortDate(isoString: string): string {
  return format(new Date(isoString), 'M월 d일', { locale: ko });
}

export function formatCheckinTime(isoString: string): string {
  return format(new Date(isoString), 'a h:mm', { locale: ko });
}
