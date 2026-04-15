import { describe, it, expect } from 'vitest';
import { firstDayOfMonthMX, currentMonthMX, monthKey, addMonthsMX } from '../month-mx';

describe('month-mx helpers', () => {
  it('firstDayOfMonthMX returns YYYY-MM-01 for a given UTC date', () => {
    const d = new Date('2026-04-14T10:00:00Z');
    expect(firstDayOfMonthMX(d)).toBe('2026-04-01');
  });

  it('currentMonthMX returns first day of current month in MX tz', () => {
    const result = currentMonthMX(new Date('2026-04-14T02:00:00Z'));
    // 2026-04-14T02:00 UTC is 2026-04-13 20:00 in MX (CST -06:00), still April 13
    expect(result).toBe('2026-04-01');
  });

  it('monthKey formats as YYYY-MM', () => {
    expect(monthKey('2026-04-01')).toBe('2026-04');
  });

  it('addMonthsMX adds N months preserving first-of-month', () => {
    expect(addMonthsMX('2026-04-01', 3)).toBe('2026-07-01');
    expect(addMonthsMX('2026-11-01', 2)).toBe('2027-01-01');
  });

  it('addMonthsMX handles negative values (going back)', () => {
    expect(addMonthsMX('2026-04-01', -1)).toBe('2026-03-01');
    expect(addMonthsMX('2026-01-01', -1)).toBe('2025-12-01');
  });
});
