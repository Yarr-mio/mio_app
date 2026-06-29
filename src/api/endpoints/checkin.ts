import type {
  CheckinRecord,
  SubmitCheckinBody,
  TodayCheckinStatus,
  UpdateCheckinBody,
  UpdatedCheckinRecord,
} from '@/types/checkin';

const MOCK_CHECKIN_LIST: CheckinRecord[] = [
  {
    checkin_id: 'mock-1',
    time_of_day: 'morning',
    emotion_type: 'tired',
    condition_score: 3,
    memo: '오늘 하루도 차분하게 보냈어',
    ai_response: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    checkin_id: 'mock-2',
    time_of_day: 'afternoon',
    emotion_type: 'anxious',
    condition_score: 4,
    memo: '오늘 하루도 차분하게 보냈어',
    ai_response: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export async function fetchCheckinToday(): Promise<TodayCheckinStatus> {
  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = MOCK_CHECKIN_LIST.filter((c) => c.created_at.startsWith(today));
  const completed = todayCheckins.map((c) => c.time_of_day);
  const allSlots = ['morning', 'afternoon', 'evening'] as const;
  return {
    date: today,
    checkins: todayCheckins,
    completed_slots: completed,
    available_slots: allSlots.filter((s) => !completed.includes(s)),
  };
}

export async function fetchCheckinDetail(id: string): Promise<CheckinRecord> {
  const record = MOCK_CHECKIN_LIST.find((c) => c.checkin_id === id);
  if (!record) throw new Error('Checkin not found');
  return record;
}

export async function fetchCheckinList(_params: {
  cursor?: string;
  limit?: number;
  from?: string;
  to?: string;
}): Promise<{ data: CheckinRecord[]; next_cursor: string | null; has_more: boolean }> {
  return { data: MOCK_CHECKIN_LIST, next_cursor: null, has_more: false };
}

export async function submitCheckin(
  body: SubmitCheckinBody,
  _idempotencyKey: string
): Promise<CheckinRecord> {
  return {
    checkin_id: String(Date.now()),
    time_of_day: body.time_of_day,
    emotion_type: body.emotion_type,
    condition_score: body.condition_score,
    memo: body.memo,
    ai_response: null,
    created_at: new Date().toISOString(),
  };
}

export async function updateCheckin(
  checkinId: string,
  body: UpdateCheckinBody
): Promise<UpdatedCheckinRecord> {
  return {
    checkin_id: checkinId,
    time_of_day: 'morning',
    emotion_type: body.emotion_type ?? 'calm',
    memo: body.memo,
    condition_score: body.condition_score ?? 3,
    ai_response: null,
    updated_at: new Date().toISOString(),
  };
}
