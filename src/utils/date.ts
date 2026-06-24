import { TZDate } from '@date-fns/tz';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';

const TZ = 'Asia/Seoul';

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const DAYS_PER_WEEK = 7;

const KOREAN_WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

const kst = (isoString: string) => new TZDate(isoString, TZ);

const kstDate = (date: Date) => new TZDate(date, TZ);

export function toKstDate(date: Date = new Date()): TZDate {
  return kstDate(date);
}

export function getKoreanWeekdayLabel(date: Date): string {
  return KOREAN_WEEKDAY_LABELS[kstDate(date).getDay()];
}

export interface ReportDateRange {
  start: Date;
  end: Date;
  label: string;
}

function formatReportDateWithWeekday(date: Date): string {
  const kst = kstDate(date);
  return `${format(kst, 'yyyy.MM.dd')} (${getKoreanWeekdayLabel(date)})`;
}

export function getWeekRange(anchorDate: Date): ReportDateRange {
  const kst = kstDate(anchorDate);
  const start = startOfWeek(kst, { weekStartsOn: 0 });
  const end = endOfWeek(kst, { weekStartsOn: 0 });

  return {
    start,
    end,
    label: `${formatReportDateWithWeekday(start)} ~ ${formatReportDateWithWeekday(end)}`,
  };
}

export function getMonthRange(anchorDate: Date): ReportDateRange {
  const kst = kstDate(anchorDate);
  const start = startOfMonth(kst);
  const end = endOfMonth(kst);

  return {
    start,
    end,
    label: `${formatReportDateWithWeekday(start)} ~ ${formatReportDateWithWeekday(end)}`,
  };
}

export function shiftWeek(anchorDate: Date, delta: number): Date {
  return addWeeks(kstDate(anchorDate), delta);
}

export function shiftMonth(anchorDate: Date, delta: number): Date {
  return addMonths(kstDate(anchorDate), delta);
}

/** 주간 범위의 종료일(week_end) 기준으로 월간 앵커(해당 월 1일)를 반환 */
export function getMonthAnchorFromWeekEnd(weekAnchorDate: Date): Date {
  const { end: weekEnd } = getWeekRange(weekAnchorDate);
  return startOfMonth(kstDate(weekEnd));
}

export function isCurrentKstMonth(anchorDate: Date): boolean {
  const today = kstDate(new Date());
  const anchor = kstDate(anchorDate);
  return today.getFullYear() === anchor.getFullYear() && today.getMonth() === anchor.getMonth();
}

export function isCurrentKstWeek(anchorDate: Date): boolean {
  const todayRange = getWeekRange(new Date());
  const anchorRange = getWeekRange(anchorDate);
  return (
    format(kstDate(todayRange.start), 'yyyy-MM-dd') ===
    format(kstDate(anchorRange.start), 'yyyy-MM-dd')
  );
}

export function toDateRangeIso(start: Date, end: Date): { from: string; to: string } {
  return {
    from: format(kstDate(start), 'yyyy-MM-dd'),
    to: format(kstDate(end), 'yyyy-MM-dd'),
  };
}

/** 주간 리포트 API week_start 파라미터용 ISO 날짜 */
export function getWeekStartIso(anchorDate: Date): string {
  const { start } = getWeekRange(anchorDate);
  return format(kstDate(start), 'yyyy-MM-dd');
}

/** 월간 리포트 API month_start 파라미터용 ISO 날짜 */
export function getMonthStartIso(anchorDate: Date): string {
  const { start } = getMonthRange(anchorDate);
  return format(kstDate(start), 'yyyy-MM-dd');
}

/** 해당 월 기준 주차 계산 (주간 종료일 토요일 기준) */
export function getWeekOfMonth(anchorDate: Date): number {
  const { end } = getWeekRange(anchorDate);
  const kstEnd = kstDate(end);

  return Math.floor((kstEnd.getDate() - 1) / DAYS_PER_WEEK) + 1;
}

/** 캐릭터 이야기 카드 주간 날짜 라벨 */
export function formatCharacterStoryWeeklyDateLabel(anchorDate: Date): string {
  const { start, end } = getWeekRange(anchorDate);
  const kstStart = kstDate(start);
  const kstEnd = kstDate(end);
  const month = kstStart.getMonth() + 1;
  const weekOfMonth = getWeekOfMonth(anchorDate);
  const startFormatted = format(kstStart, 'yyyy.MM.dd');
  const endFormatted = format(kstEnd, 'MM.dd');

  return `${month}월 ${weekOfMonth}주 · ${startFormatted} ~ ${endFormatted}`;
}

/** 캐릭터 이야기 카드 월간 날짜 라벨 */
export function formatCharacterStoryMonthlyDateLabel(anchorDate: Date): string {
  const { start, end } = getMonthRange(anchorDate);
  const kstStart = kstDate(start);
  const kstEnd = kstDate(end);
  const month = kstStart.getMonth() + 1;
  const startFormatted = format(kstStart, 'yyyy.MM.dd');
  const endFormatted = format(kstEnd, 'MM.dd');

  return `${month}월 · ${startFormatted} ~ ${endFormatted}`;
}

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
