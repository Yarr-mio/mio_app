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
    ai_response: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    checkin_id: 'mock-2',
    time_of_day: 'afternoon',
    emotion_type: 'anxious',
    condition_score: 4,
    ai_response: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

export async function fetchCheckinToday(): Promise<TodayCheckinStatus> {
  return {
    date: new Date().toISOString().split('T')[0],
    checkins: [],
    completed_slots: ['morning'],
    available_slots: ['afternoon', 'evening'],
  };
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
    condition_score: body.condition_score ?? 3,
    updated_at: new Date().toISOString(),
  };
}
