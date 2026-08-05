import { queryKeys } from '@/api/queryKeys';
import { resetReportPollFetchCount } from '@/features/report/utils/reportPollFetchCountStore';
import type { QueryClient } from '@tanstack/react-query';

function resetReportQueryFetchCounts(queryClient: QueryClient): void {
  const queries = queryClient.getQueryCache().findAll({ queryKey: queryKeys.report.all() });

  for (const query of queries) {
    resetReportPollFetchCount(query.queryKey);
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
