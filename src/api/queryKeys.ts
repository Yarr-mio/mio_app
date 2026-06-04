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
};
