import type { EmotionTrendPeriod } from '@/types/report';

export const queryKeys = {
  checkin: {
    all: () => ['checkin'] as const,
    today: () => ['checkin', 'today'] as const,
    list: () => ['checkin', 'list'] as const,
    detail: (id: string) => ['checkin', 'detail', id] as const,
  },
  chat: {
    all: () => ['chat'] as const,
    activeSession: () => ['chat', 'activeSession'] as const,
    character: () => ['chat', 'character'] as const,
    session: (sessionId: string) => ['chat', 'session', sessionId] as const,
  },
  report: {
    all: () => ['report'] as const,
    weekly: (weekStart: string) => ['report', 'weekly', weekStart] as const,
    monthly: (monthStart: string) => ['report', 'monthly', monthStart] as const,
    emotionTrend: (period: EmotionTrendPeriod, periodStart: string) =>
      ['report', 'emotionTrend', period, periodStart] as const,
  },
  my: {
    profile: () => ['my', 'profile'] as const,
    characters: () => ['my', 'characters'] as const,
    character: () => ['my', 'character'] as const,
    notificationSettings: () => ['my', 'notificationSettings'] as const,
  },
  todo: {
    all: () => ['todo'] as const,
    list: (date: string, status?: string) => ['todo', 'list', date, status] as const,
  },
};
