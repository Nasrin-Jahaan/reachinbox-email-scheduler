export function getHourWindowString(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

export function getStartOfNextHour(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setUTCHours(next.getUTCHours() + 1, 0, 0, 0);
  return next;
}

export function getDelayUntil(targetDate: Date): number {
  const delay = targetDate.getTime() - Date.now();
  return Math.max(0, delay);
}
