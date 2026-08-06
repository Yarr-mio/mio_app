import { REPORT_PERIOD_TO_EVENT_PERIOD } from '@/analytics/events';
import { track } from '@/analytics/track';
import { fetchEmotionTrend, fetchMonthlyReport, fetchWeeklyReport } from '@/api/endpoints/report';
import { queryKeys } from '@/api/queryKeys';
import {
  getReportPollFetchCount,
  incrementReportPollFetchCount,
  resetReportPollFetchCount,
} from '@/api/reportPollFetchCountStore';
import { HTTP_STATUS, REPORT_POLL_INTERVAL_MS, REPORT_POLL_MAX_ATTEMPTS } from '@/constants/config';
import {
  EMOTION_TREND_PERIOD,
  REPORT_API_ERROR_CODE,
  REPORT_PERIOD,
  REPORT_STATUS,
  type ReportPeriod,
} from '@/constants/report';
import type {
  FetchEmotionTrendParams,
  MonthlyReportData,
  ReportStatus,
  WeeklyReportData,
} from '@/types/report';
import { getMonthStartIso, getWeekStartIso } from '@/utils/date';
import { readApiErrorCode, readApiHttpStatus } from '@/utils/readApiError';
import { useIsFocused } from '@react-navigation/native';
import { keepPreviousData, useQuery, type QueryFunctionContext } from '@tanstack/react-query';
import { useEffect } from 'react';

interface ReportPollingData {
  status: ReportStatus;
}

interface ReportPollingQuery {
  queryKey: readonly unknown[];
  state: { data: unknown };
}

function getReportPollingInterval(query: ReportPollingQuery): false | number {
  const data = query.state.data as ReportPollingData | undefined;
  const fetchCount = getReportPollFetchCount(query.queryKey);

  if (fetchCount >= REPORT_POLL_MAX_ATTEMPTS && data?.status === REPORT_STATUS.PENDING) {
    return false;
  }

  if (data?.status === REPORT_STATUS.PENDING) {
    return REPORT_POLL_INTERVAL_MS;
  }

  return false;
}

function updateReportQueryFetchCount(context: QueryFunctionContext): void {
  incrementReportPollFetchCount(context.queryKey);
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
  const query = useQuery({
    queryKey: queryKeys.report.weekly(weekStart),
    queryFn: createWeeklyReportQueryFn(weekStart),
    enabled: (options?.enabled ?? true) && weekStart.length > 0,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReportPollingInterval(query),
  });

  useEffect(() => {
    if (query.error) {
      console.error('[useWeeklyReport]', query.error);
    }
  }, [query.error]);

  return query;
}

export function useMonthlyReport(monthStart: string, options?: ReportQueryOptions) {
  const query = useQuery({
    queryKey: queryKeys.report.monthly(monthStart),
    queryFn: createMonthlyReportQueryFn(monthStart),
    enabled: (options?.enabled ?? true) && monthStart.length > 0,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => getReportPollingInterval(query),
  });

  useEffect(() => {
    if (query.error) {
      console.error('[useMonthlyReport]', query.error);
    }
  }, [query.error]);

  return query;
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

  const query = useQuery({
    queryKey: queryKeys.report.emotionTrend(params.period, periodStart),
    queryFn: () => fetchEmotionTrend(params),
    enabled: enabled && periodStart.length > 0,
  });

  useEffect(() => {
    if (query.error) {
      console.error('[useEmotionTrend]', query.error);
    }
  }, [query.error]);

  return query;
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

export function useReport({ period, anchorDate }: UseReportOptions): UseReportResult {
  const isFocused = useIsFocused();
  const weekStart = getWeekStartIso(anchorDate);
  const monthStart = getMonthStartIso(anchorDate);

  // 리포트만 useQuery라 onSuccess 앵커가 없고, 캐시 히트 시엔 네트워크 호출조차 없다.
  // 그래서 화면 진입과 주간↔월간 전환 시점에 명시 발행한다 (§0 원칙의 유일한 예외 — 대시보드가
  // period 분포만 읽으므로 허용 가능하다)
  useEffect(() => {
    if (!isFocused) {
      return;
    }

    track('report_viewed', { period: REPORT_PERIOD_TO_EVENT_PERIOD[period] });
  }, [isFocused, period]);

  const weeklyQuery = useWeeklyReport(weekStart, { enabled: period === REPORT_PERIOD.week });
  const monthlyQuery = useMonthlyReport(monthStart, { enabled: period === REPORT_PERIOD.month });

  const activeQuery = period === REPORT_PERIOD.week ? weeklyQuery : monthlyQuery;
  const activeQueryKey =
    period === REPORT_PERIOD.week
      ? queryKeys.report.weekly(weekStart)
      : queryKeys.report.monthly(monthStart);

  const report = activeQuery.data;
  const fetchCount = getReportPollFetchCount(activeQueryKey);
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
      resetReportPollFetchCount(activeQueryKey);
      void activeQuery.refetch();
    },
  };
}
