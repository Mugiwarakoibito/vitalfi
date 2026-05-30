import type { StateCreator } from 'zustand';
import { storage } from '../lib/storage';
import type { AppSettings } from '../types/domain';
import type { AppState, AuthSlice } from './types';

const defaultSettings: AppSettings = {
  currency: 'USD',
  country: 'US',
  name: '',
  fitnessGoals: [],
  theme: 'dark',
  onboardingComplete: false,
  activityLevel: 'moderate',
};

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
  isLicensed: false,
  isOnboarded: false,
  settings: defaultSettings,
  isLoading: true,
  appMode: (() => { try { return (localStorage.getItem('vitalfi_appMode') as 'finance' | 'fitness') || 'finance' } catch { return 'finance' } })(),
  isSplitView: false,
  user: null,

  setLicensed: (value: boolean) => set({ isLicensed: value }),

  setOnboarded: (value: boolean) => {
    set((state) => ({
      isOnboarded: value,
      settings: { ...state.settings, onboardingComplete: value },
    }));
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const current = get().settings;
    const merged = { ...current, ...newSettings };
    set({ settings: merged as AppSettings });
    await storage.put('settings', { id: 'app_settings', ...merged } as AppSettings);
  },

  loadSettings: async () => {
    await get().initialize();
  },

  initialize: async () => {
    set({ isLoading: true });
    const timeout = setTimeout(() => {
      if (get().isLoading) {
        console.warn('Initialization timed out, forcing UI unlock');
        set({ isLoading: false });
      }
    }, 5000);

    try {
      const settings = await storage.get('settings', 'app_settings').catch(() => null);
      if (settings) {
        set({ settings, isOnboarded: settings.onboardingComplete ?? false });
        const savedEmail = localStorage.getItem('lifesync_license_email');
        const savedName = localStorage.getItem('lifesync_user_name') || settings.name;
        if (savedEmail) {
          set({ user: { email: savedEmail, name: savedName || savedEmail.split('@')[0] } });
        }
      }
      await get().loadAllData().catch(console.error);
      await get().migrateLegacyTransfers().catch(console.error);
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      clearTimeout(timeout);
      set({ isLoading: false });
    }
  },

  migrateLegacyTransfers: async () => {
    const state = get();
    const txns = state.transactions;
    const transferOuts = txns.filter(t => t.type === 'expense' && t.category === 'Transfer Out');
    const transferIns = txns.filter(t => t.type === 'income' && t.category === 'Transfer In');
    const mergedIds = new Set<string>();
    const toUpdate: import('../types/domain').Transaction[] = [];
    const toDelete: string[] = [];

    for (const out of transferOuts) {
      const inn = transferIns.find(t =>
        Math.abs(t.amount) === Math.abs(out.amount) &&
        t.date === out.date &&
        t.id !== out.id &&
        !mergedIds.has(t.id)
      );
      if (inn) {
        mergedIds.add(out.id);
        mergedIds.add(inn.id);
        const updated = { ...out, type: 'transfer' as const, category: 'Transfer', toAccountId: inn.accountId };
        toUpdate.push(updated);
        toDelete.push(inn.id);
      }
    }

    if (toUpdate.length > 0) {
      console.log(`Migrating ${toUpdate.length} legacy transfer pairs to new format`);
      for (const txn of toUpdate) {
        await storage.put('transactions', txn);
      }
      for (const id of toDelete) {
        await storage.delete('transactions', id);
      }
      set(s => {
        let updatedTxns = [...s.transactions];
        updatedTxns = updatedTxns.filter(t => !toDelete.includes(t.id));
        updatedTxns = updatedTxns.map(t => {
          const update = toUpdate.find(u => u.id === t.id);
          return update || t;
        });
        return { transactions: updatedTxns };
      });
    }
  },

  resetApp: async () => {
    const stores = ['accounts', 'transactions', 'budgets', 'workouts', 'workoutTemplates', 'meals', 'bodyMetrics', 'hydration', 'sleep', 'goals', 'settings', 'investments', 'bills', 'debts', 'subscriptions'] as const;
    for (const store of stores) {
      await storage.clear(store);
    }
    localStorage.clear();
    set({
      isLicensed: false,
      isOnboarded: false,
      settings: defaultSettings,
      accounts: [], transactions: [], budgets: [],
      workouts: [], meals: [], bodyMetrics: [],
      hydration: [], sleep: [], goals: [],
      investments: [], bills: [], debts: [], subscriptions: [],
      dataVersion: 0,
    });
  },

  setAppMode: (mode) => { localStorage.setItem('vitalfi_appMode', mode); set({ appMode: mode }) },
  toggleAppMode: () => set((state) => { const next = state.appMode === 'finance' ? 'fitness' : 'finance'; localStorage.setItem('vitalfi_appMode', next); return { appMode: next } }),
  setSplitView: (value) => set({ isSplitView: value }),
  setUser: (user) => set({ user }),
});
