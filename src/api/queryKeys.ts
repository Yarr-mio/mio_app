export const queryKeys = {
  checkin: {
    all: () => ['checkin'] as const,
    today: () => ['checkin', 'today'] as const,
    list: (from?: string, to?: string) => ['checkin', 'list', { from, to }] as const,
  },
};
