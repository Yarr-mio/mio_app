export type ReportStatus = 'GENERATED' | 'INSUFFICIENT_DATA' | 'PENDING';

export type EmotionTrendPeriod = 'week' | 'month' | 'all';

export interface FetchEmotionTrendParams {
  period: EmotionTrendPeriod;
  week_start?: string;
  month_start?: string;
}

export type DistortionType =
  | 'overgeneralization'
  | 'catastrophizing'
  | 'mind_reading'
  | 'all_or_nothing'
  | 'self_blame'
  | 'emotional_reasoning';

export interface DistortionTop3Item {
  type: DistortionType;
  label: string;
  count: number;
}

export interface TodoCategoryDistribution {
  심리_안정: number;
  인지_재구성: number;
  행동_활성화: number;
}

export interface TodoSummary {
  total: number;
  completed: number;
  partial_completed: number;
  skipped: number;
  expired: number;
  completion_rate: number;
  category_distribution: TodoCategoryDistribution;
}

export interface SessionSummary {
  total: number;
  total_minutes: number;
}

export interface WeeklyReportData {
  report_id?: string;
  week_start: string;
  week_end: string;
  status: ReportStatus;
  is_partial: boolean;
  checkin_count: number;
  required_count?: number;
  // avg_emotion_score는 0-100 리포트 집계용. avg_condition_score 1-5와 혼용 금지
  avg_emotion_score: number;
  distortion_top3: DistortionTop3Item[];
  narrative: string | null;
  coaching_direction: string | null;
  todo_summary: TodoSummary;
  session_summary: SessionSummary;
  generated_at?: string;
  message?: string;
}

export interface MonthlyReportData extends Omit<WeeklyReportData, 'week_start' | 'week_end'> {
  month_start: string;
  month_end: string;
}

export type ReportData = WeeklyReportData | MonthlyReportData;

export interface EmotionTrendPoint {
  date: string;
  // avg_condition_score 1-5는 감정 별자리 차트 전용. avg_emotion_score 0-100와 혼용 금지
  avg_condition_score: number | null;
  checkin_count: number;
}

export interface EmotionTrendData {
  period_start: string;
  period_end: string;
  points: EmotionTrendPoint[];
}

/** 감정 별자리 차트 렌더링용. EmotionTrendPoint를 라벨과 함께 매핑 */
export interface ConstellationChartPoint {
  label: string;
  // avg_condition_score 1-5는 감정 별자리 차트 전용. avg_emotion_score 0-100와 혼용 금지
  avg_condition_score: number | null;
}
