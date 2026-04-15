import { formatInTimeZone } from 'date-fns-tz';
import { addMonths } from 'date-fns';

export const MX_TZ = 'America/Mexico_City';

/** Returns the first day of the month (YYYY-MM-01) for a given date, interpreted in MX tz. */
export function firstDayOfMonthMX(d: Date): string {
  return formatInTimeZone(d, MX_TZ, 'yyyy-MM-01');
}

/** Returns the first day of the current month in MX tz as YYYY-MM-01. */
export function currentMonthMX(now: Date = new Date()): string {
  return firstDayOfMonthMX(now);
}

/** Converts a YYYY-MM-DD date string to a YYYY-MM month key. */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Adds N months to a YYYY-MM-01 string, returning a new YYYY-MM-01 string. */
export function addMonthsMX(firstOfMonth: string, n: number): string {
  const base = new Date(`${firstOfMonth}T12:00:00Z`);
  const result = addMonths(base, n);
  return formatInTimeZone(result, MX_TZ, 'yyyy-MM-01');
}
