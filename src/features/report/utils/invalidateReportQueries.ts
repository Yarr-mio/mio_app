import { queryKeys } from '@/api/queryKeys';
import { REPORT_POLL_MAX_ATTEMPTS } from '@/constants/config';
import type { QueryClient } from '@tanstack/react-query';

interface ReportQueryMeta {
  maxAttempts: number;
  fetchCount?: number;
}

function resetReportQueryFetchCounts(queryClient: QueryClient): void {
  const queries = queryClient.getQueryCache().findAll({ queryKey: queryKeys.report.all() });

  for (const query of queries) {
    // Query.meta 타입이 느슨해 ReportQueryMeta로 좁힘
    const meta = query.meta as Partial<ReportQueryMeta> | undefined;
    query.setOptions({
      ...query.options,
      meta: {
        ...meta,
        maxAttempts: meta?.maxAttempts ?? REPORT_POLL_MAX_ATTEMPTS,
        fetchCount: 0,
      },
    });
  }
}

export async function invalidateReportQueries(queryClient: QueryClient): Promise<void> {
  resetReportQueryFetchCounts(queryClient);

  await queryClient.invalidateQueries({
    queryKey: queryKeys.report.all(),
    refetchType: 'all',
  });
}

export async function invalidateCheckinRelatedQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.checkin.all(),
      refetchType: 'all',
    }),
    invalidateReportQueries(queryClient),
  ]);
}

export async function invalidateTodoRelatedQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.todo.all(),
      refetchType: 'all',
    }),
    invalidateReportQueries(queryClient),
  ]);
}
