import { describe, it, expect } from 'vitest';
import { calculateAggregateForMonth } from '../aggregate';
import type { MsiPurchase } from '../calculations';

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

const cancelled: MsiPurchase = {
  id: '3',
  total_amount: 6000,
  installments: 6,
  first_payment_month: '2026-05-01',
  status: 'cancelled',
};

describe('calculateAggregateForMonth', () => {
  it('sums all active purchases paying in the given month', () => {
    const result = calculateAggregateForMonth([laptop, tv, cancelled], '2026-05-01');
    expect(result.total).toBe(3000); // 2000 + 1000 + 0 (cancelled)
    expect(result.contributors).toHaveLength(2);
  });

  it('returns zero when nothing pays that month', () => {
    const result = calculateAggregateForMonth([laptop], '2024-01-01');
    expect(result.total).toBe(0);
    expect(result.contributors).toHaveLength(0);
  });

  it('excludes purchases with status != active', () => {
    const result = calculateAggregateForMonth([cancelled], '2026-05-01');
    expect(result.total).toBe(0);
  });
});
