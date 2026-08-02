export function pickRandomItem<T>(items: readonly T[]): T {
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}
