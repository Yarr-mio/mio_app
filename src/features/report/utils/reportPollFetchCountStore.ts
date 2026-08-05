import { hashKey } from '@tanstack/react-query';

const reportPollFetchCounts = new Map<string, number>();

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
  reportPollFetchCounts.set(hashKey(queryKey), 0);
}
