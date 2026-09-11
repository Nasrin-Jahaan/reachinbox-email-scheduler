import { getHourWindowString, getStartOfNextHour, getDelayUntil } from '../src/utils/time';

describe('Rate Limit Utility Tests', () => {
  it('should generate consistent hour window string in YYYY-MM-DD-HH format', () => {
    const testDate = new Date('2026-09-11T14:30:00.000Z');
    const windowStr = getHourWindowString(testDate);
    expect(windowStr).toBe('2026-09-11-14');
  });

  it('should accurately calculate start of next hour', () => {
    const testDate = new Date('2026-09-11T14:45:30.123Z');
    const nextHour = getStartOfNextHour(testDate);
    expect(nextHour.toISOString()).toBe('2026-09-11T15:00:00.000Z');
  });

  it('should calculate delay until target date in milliseconds', () => {
    const now = Date.now();
    const futureDate = new Date(now + 5000);
    const delay = getDelayUntil(futureDate);
    expect(delay).toBeGreaterThanOrEqual(4000);
    expect(delay).toBeLessThanOrEqual(5000);
  });
});
