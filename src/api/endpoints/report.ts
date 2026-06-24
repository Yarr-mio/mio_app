import apiClient from '@/api/client';
import type { ApiResponse } from '@/types/common';
import type {
  EmotionTrendData,
  FetchEmotionTrendParams,
  MonthlyReportData,
  WeeklyReportData,
} from '@/types/report';

export async function fetchWeeklyReport(weekStart: string): Promise<WeeklyReportData> {
  const { data } = await apiClient.get<ApiResponse<WeeklyReportData>>('/v1/reports/weekly', {
    params: { week_start: weekStart },
  });
  return data.data;
}

export async function fetchMonthlyReport(monthStart: string): Promise<MonthlyReportData> {
  const { data } = await apiClient.get<ApiResponse<MonthlyReportData>>('/v1/reports/monthly', {
    params: { month_start: monthStart },
  });
  return data.data;
}

export async function fetchEmotionTrend(
  params: FetchEmotionTrendParams
): Promise<EmotionTrendData> {
  const { data } = await apiClient.get<ApiResponse<EmotionTrendData>>('/v1/reports/emotion-trend', {
    params,
  });
  return data.data;
}
