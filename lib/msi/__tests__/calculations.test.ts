import { describe, it, expect } from 'vitest';
import {
  monthlyAmount,
  paymentSchedule,
  amountDueInMonth,
  projectionForMonths,
  monthsRemaining,
  isCompletedAsOf,
  type MsiPurchase,
} from '../calculations';

const laptop: MsiPurchase = {
  id: '1',
  total_amount: 24000,
  installments: 12,
  first_payment_month: '2026-05-01',
  status: 'active',
};

const tv: MsiPurchase = {
  id: '2',
  total_amount: 18000,
  installments: 18,
  first_payment_month: '2025-09-01',
  status: 'active',
};

describe('monthlyAmount', () => {
  it('divides total by installments', () => {
    expect(monthlyAmount(laptop)).toBe(2000);
  });

  it('handles non-divisible totals with 2 decimal precision', () => {
    expect(monthlyAmount({ ...laptop, total_amount: 10000, installments: 3 })).toBeCloseTo(3333.33, 2);
  });
});

describe('paymentSchedule', () => {
  it('returns an array of months with amount', () => {
    const schedule = paymentSchedule(laptop);
    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toEqual({ month: '2026-05-01', amount: 2000, index: 1 });
    expect(schedule[11]).toEqual({ month: '2027-04-01', amount: 2000, index: 12 });
  });
});

describe('amountDueInMonth', () => {
  it('returns the monthly amount if the purchase is being paid that month', () => {
    expect(amountDueInMonth(laptop, '2026-05-01')).toBe(2000);
    expect(amountDueInMonth(laptop, '2027-04-01')).toBe(2000);
  });

  it('returns 0 before first payment and after last', () => {
    expect(amountDueInMonth(laptop, '2026-04-01')).toBe(0);
    expect(amountDueInMonth(laptop, '2027-05-01')).toBe(0);
  });

  it('returns 0 for cancelled purchases', () => {
    expect(amountDueInMonth({ ...laptop, status: 'cancelled' }, '2026-05-01')).toBe(0);
  });
});

describe('projectionForMonths', () => {
  it('sums amounts across multiple purchases per month', () => {
    const result = projectionForMonths([laptop, tv], '2026-05-01', 3);
    // laptop: 2000 every month
    // tv: 1000 every month until 2027-02 (18 months from 2025-09)
    expect(result).toEqual([
      { month: '2026-05-01', amount: 3000 },
      { month: '2026-06-01', amount: 3000 },
      { month: '2026-07-01', amount: 3000 },
    ]);
  });

  it('zero when nothing is due', () => {
    const result = projectionForMonths([laptop], '2028-01-01', 2);
    expect(result).toEqual([
      { month: '2028-01-01', amount: 0 },
      { month: '2028-02-01', amount: 0 },
    ]);
  });
});

describe('monthsRemaining', () => {
  it('counts months from asOf to last payment', () => {
    expect(monthsRemaining(laptop, '2026-05-01')).toBe(12);
    expect(monthsRemaining(laptop, '2027-01-01')).toBe(4);
  });

  it('returns 0 when already completed', () => {
    expect(monthsRemaining(laptop, '2027-05-01')).toBe(0);
  });
});

describe('isCompletedAsOf', () => {
  it('true when the current month is past the last payment', () => {
    expect(isCompletedAsOf(laptop, '2027-05-01')).toBe(true);
    expect(isCompletedAsOf(laptop, '2027-04-01')).toBe(false);
  });
});
