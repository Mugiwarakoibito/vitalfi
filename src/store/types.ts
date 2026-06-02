import type { AppSettings, Account, Transaction, Budget, Workout, Meal, BodyMetric, HydrationEntry, SleepEntry, Goal, Investment, Bill, Debt, Subscription } from '../types/domain';

export interface AuthSlice {
  isLicensed: boolean;
  isOnboarded: boolean;
  settings: Partial<AppSettings>;
  isLoading: boolean;
  appMode: 'finance' | 'fitness';
  isSplitView: boolean;
  user: {
    email: string;
    name: string;
    photo?: string;
    bio?: string;
    goals?: string[];
  } | null;
  setLicensed: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  initialize: () => Promise<void>;
  migrateLegacyTransfers: () => Promise<void>;
  resetApp: () => Promise<void>;
  setAppMode: (mode: 'finance' | 'fitness') => void;
  toggleAppMode: () => void;
  setSplitView: (value: boolean) => void;
  setUser: (user: AuthSlice['user']) => void;
}

export interface FinanceSlice {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  investments: Investment[];
  bills: Bill[];
  debts: Debt[];
  subscriptions: Subscription[];
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction | Transaction[]) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addInvestment: (investment: Investment) => Promise<void>;
  updateInvestment: (investment: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  addBill: (bill: Bill) => Promise<void>;
  updateBill: (bill: Bill) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addDebt: (debt: Debt) => Promise<void>;
  updateDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addSubscription: (subscription: Subscription) => Promise<void>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export interface FitnessSlice {
  workouts: Workout[];
  meals: Meal[];
  bodyMetrics: BodyMetric[];
  hydration: HydrationEntry[];
  sleep: SleepEntry[];
  goals: Goal[];
  addWorkout: (workout: Workout) => Promise<void>;
  updateWorkout: (workout: Workout) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  addMeal: (meal: Meal) => Promise<void>;
  updateMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  addBodyMetric: (metric: BodyMetric) => Promise<void>;
  deleteBodyMetric: (id: string) => Promise<void>;
  addHydration: (entry: HydrationEntry) => Promise<void>;
  deleteHydration: (id: string) => Promise<void>;
  clearHydration: () => Promise<void>;
  addSleep: (entry: SleepEntry) => Promise<void>;
  deleteSleep: (id: string) => Promise<void>;
  clearSleep: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export interface SharedSlice {
  dataVersion: number;
  loadAllData: () => Promise<void>;
  refreshData: () => void;
  executeActivity: (parsed: any) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export type AppState = AuthSlice & FinanceSlice & FitnessSlice & SharedSlice;
