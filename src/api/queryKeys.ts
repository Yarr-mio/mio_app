import type { EmotionTrendPeriod } from '@/types/report';

export const queryKeys = {
  checkin: {
    all: () => ['checkin'] as const,
    today: () => ['checkin', 'today'] as const,
    list: (from?: string, to?: string) => ['checkin', 'list', { from, to }] as const,
    detail: (id: string) => ['checkin', 'detail', id] as const,
  },
  chat: {
    all: () => ['chat'] as const,
    activeSession: () => ['chat', 'activeSession'] as const,
    character: () => ['chat', 'character'] as const,
    session: (sessionId: string) => ['chat', 'session', sessionId] as const,
  },
  onboarding: {
    all: () => ['onboarding'] as const,
    status: () => ['onboarding', 'status'] as const,
  },
  report: {
    all: () => ['report'] as const,
    weekly: (weekStart: string) => ['report', 'weekly', weekStart] as const,
    monthly: (monthStart: string) => ['report', 'monthly', monthStart] as const,
    emotionTrend: (period: EmotionTrendPeriod, periodStart: string) =>
      ['report', 'emotionTrend', period, periodStart] as const,
  },
};
