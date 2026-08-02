export function formatTimeUnit(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTimeHHMM(hour: number, minute: number): string {
  return `${formatTimeUnit(hour)}:${formatTimeUnit(minute)}`;
}

export function parseTimeHHMM(time: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = time.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  return {
    hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 0,
    minute: Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0,
  };
}
