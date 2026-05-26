export type EmotionType =
  | 'happy'
  | 'calm'
  | 'anxious'
  | 'sad'
  | 'angry'
  | 'ashamed'
  | 'numb'
  | 'tired'
  | 'confused';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface CheckinRecord {
  checkin_id: string;
  time_of_day: TimeOfDay;
  emotion_type: EmotionType;
  condition_score: number;
  memo?: string;
  ai_response: string | null;
  created_at: string;
}

export interface UpdatedCheckinRecord {
  checkin_id: string;
  time_of_day: TimeOfDay;
  emotion_type: EmotionType;
  memo?: string;
  condition_score: number;
  updated_at: string;
}

export interface TodayCheckinStatus {
  date: string;
  checkins: CheckinRecord[];
  completed_slots: TimeOfDay[];
  available_slots: TimeOfDay[];
}

export interface SubmitCheckinBody {
  time_of_day: TimeOfDay;
  emotion_type: EmotionType;
  condition_score: number;
  memo?: string;
}

export interface UpdateCheckinBody {
  emotion_type?: EmotionType;
  condition_score?: number;
  memo?: string;
}
