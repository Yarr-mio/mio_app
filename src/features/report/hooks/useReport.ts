import { fetchEmotionTrend, fetchMonthlyReport, fetchWeeklyReport } from '@/api/endpoints/report';
import { queryKeys } from '@/api/queryKeys';
import { HTTP_STATUS, REPORT_POLL_INTERVAL_MS, REPORT_POLL_MAX_ATTEMPTS } from '@/constants/config';
import {
  EMOTION_TREND_PERIOD,
  REPORT_API_ERROR_CODE,
  REPORT_PERIOD,
  REPORT_STATUS,
  type ReportPeriod,
} from '@/constants/report';
import { readApiErrorCode, readApiHttpStatus } from '@/features/auth/utils/readApiError';
import type {
  FetchEmotionTrendParams,
  MonthlyReportData,
  ReportStatus,
  WeeklyReportData,
} from '@/types/report';
import { getMonthStartIso, getWeekStartIso } from '@/utils/date';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
} from '@tanstack/react-query';

interface ReportQueryMeta {
  maxAttempts: number;
  fetchCount?: number;
}

interface ReportPollingData {
  status: ReportStatus;
}

interface ReportPollingQuery {
  state: { data: unknown };
  meta?: Record<string, unknown>;
}

function getReportPollingInterval(query: ReportPollingQuery): false | number {
  const data = query.state.data as ReportPollingData | undefined;
  const meta = query.meta as Partial<ReportQueryMeta> | undefined;
  const maxAttempts = meta?.maxAttempts ?? REPORT_POLL_MAX_ATTEMPTS;
  const fetchCount = meta?.fetchCount ?? 0;

  if (fetchCount >= maxAttempts && data?.status === REPORT_STATUS.PENDING) {
    return false;
  }

  if (data?.status === REPORT_STATUS.PENDING) {
    return REPORT_POLL_INTERVAL_MS;
  }

  return false;
}

function updateReportQueryFetchCount(context: QueryFunctionContext): void {
  const query = context.client.getQueryCache().find({ queryKey: context.queryKey });
  if (!query) {
    return;
  }

  const meta = query.meta as Partial<ReportQueryMeta>;
  query.setOptions({
    meta: {
      maxAttempts: meta.maxAttempts ?? REPORT_POLL_MAX_ATTEMPTS,
      fetchCount: (meta.fetchCount ?? 0) + 1,
    },
  });
}

function resetReportQueryFetchCount(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[]
): void {
  const query = queryClient.getQueryCache().find({ queryKey });
  if (!query) {
    return;
  }

  const meta = query.meta as Partial<ReportQueryMeta>;
  query.setOptions({
    meta: {
      maxAttempts: meta.maxAttempts ?? REPORT_POLL_MAX_ATTEMPTS,
      fetchCount: 0,
    },
  });
}

function createWeeklyReportQueryFn(weekStart: string) {
  return async (context: QueryFunctionContext) => {
    const data = await fetchWeeklyReport(weekStart);
    updateReportQueryFetchCount(context);
    return data;
  };
}

function createMonthlyReportQueryFn(monthStart: string) {
  return async (context: QueryFunctionContext) => {
    const data = await fetchMonthlyReport(monthStart);
    updateReportQueryFetchCount(context);
    return data;
  };
}

interface ReportQueryOptions {
  enabled?: boolean;
}

export function useWeeklyReport(weekStart: string, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: createWeeklyReportQueryFn(weekStart),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    meta: { maxAttempts: REPORT_POLL_MAX_ATTEMPTS },
    refetchInterval: (query) => getReportPollingInterval(query),
  });
}

export function useMonthlyReport(monthStart: string, options?: ReportQueryOptions) {
  return useQuery({
    queryKey: queryKeys.report.monthly(monthStart),
    queryFn: createMonthlyReportQueryFn(monthStart),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    meta: { maxAttempts: REPORT_POLL_MAX_ATTEMPTS },
    refetchInterval: (query) => getReportPollingInterval(query),
  });
}

interface UseEmotionTrendOptions {
  period: ReportPeriod;
  anchorDate: Date;
  enabled?: boolean;
}

function buildEmotionTrendParams(period: ReportPeriod, anchorDate: Date): FetchEmotionTrendParams {
  if (period === REPORT_PERIOD.week) {
    return {
      period: EMOTION_TREND_PERIOD.week,
      week_start: getWeekStartIso(anchorDate),
    };
  }

  return {
    period: EMOTION_TREND_PERIOD.month,
    month_start: getMonthStartIso(anchorDate),
  };
}

export function useEmotionTrend({ period, anchorDate, enabled = true }: UseEmotionTrendOptions) {
  const params = buildEmotionTrendParams(period, anchorDate);
  const periodStart =
    params.period === EMOTION_TREND_PERIOD.week
      ? (params.week_start ?? '')
      : (params.month_start ?? '');

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
  isServerError: boolean;
  isPollingTimedOut: boolean;
  error: unknown;
  refetch: () => void;
}

function getReportFetchCount(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[]
): number {
  const query = queryClient.getQueryCache().find({ queryKey });
  const meta = query?.meta as Partial<ReportQueryMeta> | undefined;
  return meta?.fetchCount ?? 0;
}

export function useReport({ period, anchorDate }: UseReportOptions): UseReportResult {
  const queryClient = useQueryClient();
  const weekStart = getWeekStartIso(anchorDate);
  const monthStart = getMonthStartIso(anchorDate);

  const weeklyQuery = useWeeklyReport(weekStart, { enabled: period === REPORT_PERIOD.week });
  const monthlyQuery = useMonthlyReport(monthStart, { enabled: period === REPORT_PERIOD.month });

  const activeQuery = period === REPORT_PERIOD.week ? weeklyQuery : monthlyQuery;
  const activeQueryKey =
    period === REPORT_PERIOD.week
      ? queryKeys.report.weekly(weekStart)
      : queryKeys.report.monthly(monthStart);

  const report = activeQuery.data;
  const fetchCount = getReportFetchCount(queryClient, activeQueryKey);
  const isPollingTimedOut =
    fetchCount >= REPORT_POLL_MAX_ATTEMPTS && report?.status === REPORT_STATUS.PENDING;
  const isServerError =
    activeQuery.isError &&
    (readApiHttpStatus(activeQuery.error) === HTTP_STATUS.INTERNAL_SERVER_ERROR ||
      readApiErrorCode(activeQuery.error) === REPORT_API_ERROR_CODE);

  return {
    weeklyQuery,
    monthlyQuery,
    report,
    isPending: activeQuery.isPending,
    isFetching: activeQuery.isFetching,
    isPlaceholderData: activeQuery.isPlaceholderData,
    isError: activeQuery.isError,
    isServerError,
    isPollingTimedOut,
    error: activeQuery.error,
    refetch: () => {
      resetReportQueryFetchCount(queryClient, activeQueryKey);
      void activeQuery.refetch();
    },
  };
}
