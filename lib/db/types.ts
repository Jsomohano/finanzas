export type AccountType = 'debit' | 'credit' | 'cash';
export type TxKind = 'expense' | 'income';
export type TxSource = 'manual' | 'msi_aggregate' | 'msi_installment';
export type MsiStatus = 'active' | 'completed' | 'cancelled';

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  bank: string | null;
  last_four: string | null;
  closing_day: number | null;
  payment_day: number | null;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: TxKind;
  color: string;
  icon: string;
  is_default: boolean;
  is_msi: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  kind: TxKind;
  category_id: string;
  account_id: string | null;
  description: string;
  notes: string | null;
  source: TxSource;
  msi_aggregate_month: string | null;
  msi_purchase_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MsiPurchaseRow = {
  id: string;
  user_id: string;
  description: string;
  merchant: string | null;
  total_amount: number;
  installments: number;
  purchase_date: string;
  first_payment_month: string;
  account_id: string;
  category_id: string;
  status: MsiStatus;
  created_at: string;
  updated_at: string;
};

export type MsiPurchaseWithAccount = MsiPurchaseRow & {
  accounts: { name: string; last_four: string | null; closing_day: number | null } | null;
};

export type Transfer = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  from_account_id: string;
  to_account_id: string;
  description: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyGoal = {
  id: string;
  user_id: string;
  month: string;
  target_amount: number;
};

export type UserSettings = {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_monthly_goal: number;
};

// --- Reports types ---

export type CategoryTrendPoint = {
  month: string;
  categoryId: string;
  categoryName: string;
  color: string;
  amount: number;
};

export type MonthComparisonRow = {
  categoryId: string;
  name: string;
  color: string;
  amountA: number;
  amountB: number;
  delta: number;
  deltaPct: number;
};

export type MicroSpendingRow = {
  categoryId: string;
  name: string;
  color: string;
  count: number;
  avgAmount: number;
  total: number;
};

export type HistoricalAvgRow = {
  categoryId: string;
  name: string;
  color: string;
  historicalAvg: number;
  currentMonth: number;
  delta: number;
  deltaPct: number;
};
