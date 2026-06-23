import {
  fetchEmotionTrend,
  fetchMonthlyReport,
  fetchWeeklyReport,
  type FetchEmotionTrendParams,
} from '@/api/endpoints/report';
import { queryKeys } from '@/api/queryKeys';
import { REPORT_POLL_INTERVAL_MS } from '@/constants/config';
import { REPORT_STATUS, type ReportPeriod } from '@/constants/report';
import type {
  EmotionTrendData,
  MonthlyReportData,
  ReportStatus,
  WeeklyReportData,
} from '@/types/report';
import { getMonthStartIso, getWeekStartIso } from '@/utils/date';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

interface ReportPollingData {
  status: ReportStatus;
}

function getReportPollingInterval<T extends ReportPollingData>(
  data: T | undefined
): false | number {
  if (data?.status === REPORT_STATUS.PENDING) {
    return REPORT_POLL_INTERVAL_MS;
  }

  return false;
}

interface ReportQueryOptions {
  enabled?: boolean;
}

export function useWeeklyReport(weekStart: string, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: () => fetchWeeklyReport(weekStart),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReportPollingInterval(query.state.data),
  });
}

export function useMonthlyReport(monthStart: string, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: queryKeys.report.monthly(monthStart),
    queryFn: () => fetchMonthlyReport(monthStart),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReportPollingInterval(query.state.data),
  });
}

interface UseEmotionTrendOptions {
  period: ReportPeriod;
  anchorDate: Date;
  enabled?: boolean;
}

function buildEmotionTrendParams(period: ReportPeriod, anchorDate: Date): FetchEmotionTrendParams {
  if (period === 'week') {
    return {
      period: 'week',
      week_start: getWeekStartIso(anchorDate),
    };
  }

  return {
    period: 'month',
    month_start: getMonthStartIso(anchorDate),
  };
}

export function useEmotionTrend({ period, anchorDate, enabled = true }: UseEmotionTrendOptions) {
  const params = buildEmotionTrendParams(period, anchorDate);
  const periodStart =
    params.period === 'week' ? (params.week_start ?? '') : (params.month_start ?? '');

  return useQuery({
    queryKey: queryKeys.report.emotionTrend(params.period, periodStart),
    queryFn: () => fetchEmotionTrend(params),
    enabled: enabled && periodStart.length > 0,
  });
}

interface UseReportOptions {
  period: ReportPeriod;
  anchorDate: Date;
}

interface UseReportResult {
  weeklyQuery: ReturnType<typeof useWeeklyReport>;
  monthlyQuery: ReturnType<typeof useMonthlyReport>;
  report: WeeklyReportData | MonthlyReportData | undefined;
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useReport({ period, anchorDate }: UseReportOptions): UseReportResult {
  const weekStart = getWeekStartIso(anchorDate);
  const monthStart = getMonthStartIso(anchorDate);

  const weeklyQuery = useWeeklyReport(weekStart, { enabled: period === 'week' });
  const monthlyQuery = useMonthlyReport(monthStart, { enabled: period === 'month' });

  const activeQuery = period === 'week' ? weeklyQuery : monthlyQuery;

  return {
    weeklyQuery,
    monthlyQuery,
    report: activeQuery.data,
    isPending: activeQuery.isPending,
    isFetching: activeQuery.isFetching,
    isPlaceholderData: activeQuery.isPlaceholderData,
    isError: activeQuery.isError,
    error: activeQuery.error,
    refetch: () => {
      void activeQuery.refetch();
    },
  };
}

export type { EmotionTrendData, MonthlyReportData, WeeklyReportData };
