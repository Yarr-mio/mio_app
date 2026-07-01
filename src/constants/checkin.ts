import type { TimeOfDay } from '@/types/checkin';

export interface TimeOfDayMeta {
  label: string;
  emoji: string;
}

export const TIME_OF_DAY_META: Record<TimeOfDay, TimeOfDayMeta> = {
  morning: { label: '오전', emoji: '🌅' },
  afternoon: { label: '오후', emoji: '☀️' },
  evening: { label: '저녁', emoji: '🌙' },
};
