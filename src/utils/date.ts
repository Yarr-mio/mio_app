import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const TZ = 'Asia/Seoul';

const kst = (isoString: string) => new TZDate(isoString, TZ);

/** ISO 문자열(UTC)로 저장된 날짜가 한국 시간 기준 오늘인지 확인 */
export function isToday(isoString: string): boolean {
  const fmt = (d: TZDate) => format(d, 'yyyy-MM-dd');
  return fmt(kst(isoString)) === fmt(new TZDate(new Date(), TZ));
}

export function formatCheckinFullDate(isoString: string): string {
  return format(kst(isoString), 'yyyy년 M월 d일 EEEE', { locale: ko });
}

export function formatCheckinShortDate(isoString: string): string {
  return format(kst(isoString), 'M월 d일', { locale: ko });
}

export function formatCheckinTime(isoString: string): string {
  return format(kst(isoString), 'a h:mm', { locale: ko });
}
