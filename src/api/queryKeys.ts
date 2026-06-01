export const queryKeys = {
  checkin: {
    all: () => ['checkin'] as const,
    today: () => ['checkin', 'today'] as const,
    list: (from?: string, to?: string) => ['checkin', 'list', { from, to }] as const,
    detail: (id: string) => ['checkin', 'detail', id] as const,
  },
  memory: {
    all: () => ['memory'] as const,
    list: () => ['memory', 'list'] as const,
    categories: () => ['memory', 'categories'] as const,
  },
};
