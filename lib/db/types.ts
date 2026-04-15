export type AccountType = 'debit' | 'credit' | 'cash';
export type TxKind = 'expense' | 'income';
export type TxSource = 'manual' | 'msi_aggregate';
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
