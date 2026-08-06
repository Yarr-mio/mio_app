import queryClient from '@/api/queryClient';
import { hashKey } from '@tanstack/react-query';

const reportPollFetchCounts = new Map<string, number>();

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'removed') {
    reportPollFetchCounts.delete(hashKey(event.query.queryKey));
  }
});

export function getReportPollFetchCount(queryKey: readonly unknown[]): number {
  return reportPollFetchCounts.get(hashKey(queryKey)) ?? 0;
}

export function incrementReportPollFetchCount(queryKey: readonly unknown[]): number {
  const key = hashKey(queryKey);
  const nextCount = (reportPollFetchCounts.get(key) ?? 0) + 1;
  reportPollFetchCounts.set(key, nextCount);
  return nextCount;
}

export function resetReportPollFetchCount(queryKey: readonly unknown[]): void {
  // 리셋 시 Map 키 삭제함 get은 없는 키를 0으로 반환함
  reportPollFetchCounts.delete(hashKey(queryKey));
}

export function clearReportPollFetchCounts(): void {
  reportPollFetchCounts.clear();
}
