export interface FinanceAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  currency: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBudget {
  id: string;
  name: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedTransaction {
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  type: 'income' | 'expense' | 'transfer';
  date?: string;
  confidence: number;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}

export interface AccountSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

export type TransactionFilter = {
  accountId?: string;
  category?: string;
  type?: 'income' | 'expense' | 'transfer';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};
