import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(50),
  type: z.enum(['debit', 'credit', 'cash']),
  bank: z.string().max(50).optional().nullable(),
  last_four: z.string().regex(/^\d{4}$/, '4 dígitos').optional().nullable(),
  closing_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  payment_day: z.coerce.number().int().min(1).max(31).optional().nullable(),
  current_balance: z.coerce.number(),
});

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD'),
  amount: z.coerce.number().positive('Debe ser positivo'),
  kind: z.enum(['expense', 'income']),
  category_id: z.string().uuid(),
  account_id: z.string().uuid(),
  description: z.string().min(1).max(200),
  notes: z.string().max(500).optional().nullable(),
});

export const msiPurchaseSchema = z.object({
  description: z.string().min(1).max(200),
  merchant: z.string().max(100).optional().nullable(),
  total_amount: z.coerce.number().positive(),
  installments: z.coerce.number().int().min(2).max(48),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  first_payment_month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Debe ser primer día del mes'),
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
});

export const monthlyGoalSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  target_amount: z.coerce.number().nonnegative(),
});

export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type MsiPurchaseInput = z.infer<typeof msiPurchaseSchema>;
export type MonthlyGoalInput = z.infer<typeof monthlyGoalSchema>;
