import type { StateCreator } from 'zustand';
import { storage } from '../lib/storage';
import type { Account } from '../types/domain';
import type { AppState, FinanceSlice } from './types';

export const createFinanceSlice: StateCreator<AppState, [], [], FinanceSlice> = (set, get) => ({
  accounts: [],
  transactions: [],
  budgets: [],
  investments: [],
  bills: [],
  debts: [],
  subscriptions: [],

  addAccount: async (account) => {
    set((state) => ({ accounts: [...state.accounts, account], dataVersion: state.dataVersion + 1 }));
    await storage.put('accounts', account);
  },
  updateAccount: async (account) => {
    set((state) => ({ accounts: state.accounts.map(a => a.id === account.id ? account : a), dataVersion: state.dataVersion + 1 }));
    await storage.put('accounts', account);
  },
  deleteAccount: async (id) => {
    const state = get();
    const relatedTransactions = state.transactions.filter(t => t.accountId === id || t.toAccountId === id);
    const accountUpdates = new Map<string, Account>();
    state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));

    const transfersFromThisAccount = relatedTransactions.filter(t => t.accountId === id && t.type === 'transfer' && t.toAccountId);
    for (const txn of transfersFromThisAccount) {
      const destAcc = accountUpdates.get(txn.toAccountId!);
      if (destAcc) destAcc.balance -= txn.amount;
    }
    const transfersToThisAccount = relatedTransactions.filter(t => t.toAccountId === id && t.type === 'transfer');
    for (const txn of transfersToThisAccount) {
      const sourceAcc = accountUpdates.get(txn.accountId);
      if (sourceAcc) sourceAcc.balance += txn.amount;
    }
    for (const txn of relatedTransactions) {
      await storage.delete('transactions', txn.id);
    }
    for (const acc of accountUpdates.values()) {
      if (acc.id !== id) await storage.put('accounts', acc);
    }
    await storage.delete('accounts', id);
    set((state) => ({
      accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
      transactions: state.transactions.filter(t => t.accountId !== id && t.toAccountId !== id),
      dataVersion: state.dataVersion + 1,
    }));
  },

  addTransaction: async (transaction) => {
    const normalizedTransaction = Array.isArray(transaction)
      ? transaction.map(t => ({ ...t, amount: Math.abs(t.amount) }))
      : { ...transaction, amount: Math.abs(transaction.amount) };
    const txns = Array.isArray(normalizedTransaction) ? normalizedTransaction : [normalizedTransaction];
    set((state) => {
      const accountUpdates = new Map<string, Account>();
      state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));
      txns.forEach(t => {
        const fromAcc = accountUpdates.get(t.accountId);
        const toAcc = t.toAccountId ? accountUpdates.get(t.toAccountId) : null;
        if (t.type === 'income') { if (fromAcc) fromAcc.balance += t.amount; }
        else if (t.type === 'expense') { if (fromAcc) fromAcc.balance -= t.amount; }
        else if (t.type === 'transfer') { if (fromAcc) fromAcc.balance -= t.amount; if (toAcc) toAcc.balance += t.amount; }
      });
      return {
        transactions: [...state.transactions, ...txns],
        accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
        dataVersion: state.dataVersion + 1,
      };
    });
    const st = get();
    const affectedAccounts = st.accounts.filter(a => txns.some(t => t.accountId === a.id || t.toAccountId === a.id));
    for (const acc of affectedAccounts) await storage.put('accounts', acc);
    for (const t of txns) await storage.put('transactions', t);
  },

  updateTransaction: async (transaction) => {
    const normalizedTransaction = { ...transaction, amount: Math.abs(transaction.amount) };
    set((state) => {
      const oldTxn = state.transactions.find(t => t.id === transaction.id);
      if (!oldTxn) return state;
      const accountUpdates = new Map<string, Account>();
      state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));
      const oldAcc = accountUpdates.get(oldTxn.accountId);
      if (oldAcc) {
        if (oldTxn.type === 'income') oldAcc.balance -= oldTxn.amount;
        else if (oldTxn.type === 'expense') oldAcc.balance += oldTxn.amount;
      }
      const newAcc = accountUpdates.get(normalizedTransaction.accountId);
      if (newAcc) {
        if (normalizedTransaction.type === 'income') newAcc.balance += normalizedTransaction.amount;
        else if (normalizedTransaction.type === 'expense') newAcc.balance -= normalizedTransaction.amount;
      }
      return {
        transactions: state.transactions.map(t => t.id === transaction.id ? normalizedTransaction : t),
        accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
        dataVersion: state.dataVersion + 1,
      };
    });
    await storage.put('transactions', normalizedTransaction);
    const st = get();
    const oldTxn = st.transactions.find(t => t.id === transaction.id) || normalizedTransaction;
    const affectedAccountIds = new Set([oldTxn.accountId, normalizedTransaction.accountId]);
    for (const acc of st.accounts) {
      if (affectedAccountIds.has(acc.id)) await storage.put('accounts', acc);
    }
  },

  deleteTransaction: async (id) => {
    let affectedAccountId: string | null = null;
    set((state) => {
      const oldTxn = state.transactions.find(t => t.id === id);
      if (!oldTxn) return state;
      affectedAccountId = oldTxn.accountId;
      const accountUpdates = new Map<string, Account>();
      state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));
      const oldAcc = accountUpdates.get(oldTxn.accountId);
      if (oldAcc) {
        if (oldTxn.type === 'income') oldAcc.balance -= oldTxn.amount;
        else if (oldTxn.type === 'expense') oldAcc.balance += oldTxn.amount;
      }
      return {
        transactions: state.transactions.filter(t => t.id !== id),
        accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
        dataVersion: state.dataVersion + 1,
      };
    });
    await storage.delete('transactions', id);
    if (affectedAccountId) {
      const acc = get().accounts.find(a => a.id === affectedAccountId);
      if (acc) await storage.put('accounts', acc);
    }
  },

  addBudget: async (budget) => {
    set((state) => ({ budgets: [...state.budgets, budget], dataVersion: state.dataVersion + 1 }));
    await storage.put('budgets', budget);
  },
  updateBudget: async (budget) => {
    set((state) => ({ budgets: state.budgets.map(b => b.id === budget.id ? budget : b), dataVersion: state.dataVersion + 1 }));
    await storage.put('budgets', budget);
  },
  deleteBudget: async (id) => {
    set((state) => ({ budgets: state.budgets.filter(b => b.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('budgets', id);
  },

  addInvestment: async (investment) => {
    set((state) => ({ investments: [...state.investments, investment], dataVersion: state.dataVersion + 1 }));
    await storage.put('investments', investment);
  },
  updateInvestment: async (investment) => {
    set((state) => ({ investments: state.investments.map(i => i.id === investment.id ? investment : i), dataVersion: state.dataVersion + 1 }));
    await storage.put('investments', investment);
  },
  deleteInvestment: async (id) => {
    set((state) => ({ investments: state.investments.filter(i => i.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('investments', id);
  },

  addBill: async (bill) => {
    set((state) => ({ bills: [...state.bills, bill], dataVersion: state.dataVersion + 1 }));
    await storage.put('bills', bill);
  },
  updateBill: async (bill) => {
    set((state) => ({ bills: state.bills.map(b => b.id === bill.id ? bill : b), dataVersion: state.dataVersion + 1 }));
    await storage.put('bills', bill);
  },
  deleteBill: async (id) => {
    set((state) => ({ bills: state.bills.filter(b => b.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('bills', id);
  },

  addDebt: async (debt) => {
    set((state) => ({ debts: [...state.debts, debt], dataVersion: state.dataVersion + 1 }));
    await storage.put('debts', debt);
  },
  updateDebt: async (debt) => {
    set((state) => ({ debts: state.debts.map(d => d.id === debt.id ? debt : d), dataVersion: state.dataVersion + 1 }));
    await storage.put('debts', debt);
  },
  deleteDebt: async (id) => {
    set((state) => ({ debts: state.debts.filter(d => d.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('debts', id);
  },

  addSubscription: async (subscription) => {
    set((state) => ({ subscriptions: [...state.subscriptions, subscription], dataVersion: state.dataVersion + 1 }));
    await storage.put('subscriptions', subscription);
  },
  updateSubscription: async (subscription) => {
    set((state) => ({ subscriptions: state.subscriptions.map(s => s.id === subscription.id ? subscription : s), dataVersion: state.dataVersion + 1 }));
    await storage.put('subscriptions', subscription);
  },
  deleteSubscription: async (id) => {
    set((state) => ({ subscriptions: state.subscriptions.filter(s => s.id !== id), dataVersion: state.dataVersion + 1 }));
    await storage.delete('subscriptions', id);
  },
});
