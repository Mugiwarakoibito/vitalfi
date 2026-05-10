import { create } from 'zustand';
import { storage, AppSettings, Account, Transaction, Budget, Workout, Meal, BodyMetric, HydrationEntry, SleepEntry, Goal, Investment, Bill, Debt, Subscription } from '../lib/storage';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

interface AppState {
  isLicensed: boolean;
  isOnboarded: boolean;
  settings: Partial<AppSettings>;
  isLoading: boolean;
  
  // Reactive data
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  workouts: Workout[];
  meals: Meal[];
  bodyMetrics: BodyMetric[];
  hydration: HydrationEntry[];
  sleep: SleepEntry[];
  goals: Goal[];
  investments: Investment[];
  bills: Bill[];
  debts: Debt[];
  subscriptions: Subscription[];
  
  // UI State
  appMode: 'finance' | 'fitness';
  isSplitView: boolean;
  
  // Auth & Profile
  user: {
    email: string;
    name: string;
    photo?: string;
    bio?: string;
    goals?: string[];
  } | null;

  // Data refresh trigger
  dataVersion: number;
  
  // Actions
  setLicensed: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  initialize: () => Promise<void>;
  migrateLegacyTransfers: () => Promise<void>;
  resetApp: () => Promise<void>;
  
  // Data actions
  loadAllData: () => Promise<void>;
  refreshData: () => void;
  addAccount: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction | Transaction[]) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Budget) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
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
  addSleep: (entry: SleepEntry) => Promise<void>;
  deleteSleep: (id: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
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
  executeActivity: (parsed: any) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // UI Actions
  setAppMode: (mode: 'finance' | 'fitness') => void;
  toggleAppMode: () => void;
  setSplitView: (value: boolean) => void;
  setUser: (user: AppState['user']) => void;
}

const defaultSettings: AppSettings = {
  currency: 'USD',
  country: 'US',
  name: '',
  fitnessGoals: [],
  theme: 'dark',
  onboardingComplete: false,
  activityLevel: 'moderate',
};

export const useAppStore = create<AppState>((set, get) => ({
  isLicensed: false,
  isOnboarded: false,
  settings: defaultSettings,
  isLoading: true,
  
  // Initial reactive data state
  accounts: [],
  transactions: [],
  budgets: [],
  workouts: [],
  meals: [],
  bodyMetrics: [],
  hydration: [],
  sleep: [],
  goals: [],
  investments: [],
  bills: [],
  debts: [],
  subscriptions: [],
  dataVersion: 0,
  appMode: 'finance',
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

    await storage.put('settings', {
      id: 'app_settings',
      ...merged,
    } as AppSettings);
  },

  loadSettings: async () => {
    // Legacy support, now handled by initialize
    await get().initialize();
  },

  initialize: async () => {
    set({ isLoading: true });

    // Safety timeout: stop loading after 5 seconds no matter what
    const timeout = setTimeout(() => {
      if (get().isLoading) {
        console.warn('Initialization timed out, forcing UI unlock');
        set({ isLoading: false });
      }
    }, 5000);

    try {
      // 1. Load Settings
      const settings = await storage.get('settings', 'app_settings');
      if (settings) {
        set({
          settings,
          isOnboarded: settings.onboardingComplete ?? false,
        });
      }

      // 2. Load All Data
      await get().loadAllData();
      
      // 3. Migrate legacy transfer transactions (expense + income pairs → single transfer)
      await get().migrateLegacyTransfers();
      
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
     
     // Find transfer pairs: category "Transfer Out" (expense) + category "Transfer In" (income) with same amount
     const transferOuts = txns.filter(t => t.type === 'expense' && t.category === 'Transfer Out');
     const transferIns = txns.filter(t => t.type === 'income' && t.category === 'Transfer In');
     
     const mergedIds = new Set<string>();
     const toUpdate: Transaction[] = [];
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
         
         // Update the "out" transaction to become the transfer
         const updated: Transaction = {
           ...out,
           type: 'transfer',
           category: 'Transfer',
           toAccountId: inn.accountId,
         };
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
       
       // Update state
       set(s => {
         let updatedTxns = [...s.transactions];
         // Remove old "Transfer In" transactions
         updatedTxns = updatedTxns.filter(t => !toDelete.includes(t.id));
         // Update "Transfer Out" to new format
         updatedTxns = updatedTxns.map(t => {
           const update = toUpdate.find(u => u.id === t.id);
           return update || t;
         });
         
         return { transactions: updatedTxns };
       });
     }
   },

  resetApp: async () => {
    await storage.clear('accounts');
    await storage.clear('transactions');
    await storage.clear('budgets');
    await storage.clear('workouts');
    await storage.clear('workoutTemplates');
    await storage.clear('meals');
    await storage.clear('bodyMetrics');
    await storage.clear('hydration');
    await storage.clear('sleep');
    await storage.clear('goals');
    await storage.clear('settings');
    await storage.clear('investments');
    await storage.clear('bills');
    await storage.clear('debts');
    await storage.clear('subscriptions');
    localStorage.clear();
    set({
      isLicensed: false,
      isOnboarded: false,
      settings: defaultSettings,
      accounts: [],
      transactions: [],
      budgets: [],
      workouts: [],
      meals: [],
      bodyMetrics: [],
      hydration: [],
      sleep: [],
      goals: [],
      investments: [],
      bills: [],
      debts: [],
      subscriptions: [],
      dataVersion: 0,
    });
  },
  
  // Data loading - loads all data at once
  loadAllData: async () => {
    const stores: (keyof AppState & string)[] = [
      'accounts', 'transactions', 'budgets', 'workouts', 'meals',
      'bodyMetrics', 'hydration', 'sleep', 'goals', 'investments',
      'bills', 'debts', 'subscriptions'
    ];

    const results = await Promise.allSettled(
      stores.map(store => storage.getAll(store as any))
    );

    const newState: any = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        newState[stores[index]] = result.value;
      } else {
        console.error(`Failed to load ${stores[index]}:`, result.reason);
        newState[stores[index]] = [];
      }
    });

    set(newState);
  },
  
  // Trigger refresh - increments version to trigger all subscribed components
  refreshData: () => {
    set((state) => ({ dataVersion: state.dataVersion + 1 }));
  },
  
  // Account actions - immediate state update for instant reactivity
  addAccount: async (account) => {
    set((state) => ({ 
      accounts: [...state.accounts, account],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('accounts', account);
  },
  updateAccount: async (account) => {
    set((state) => ({ 
      accounts: state.accounts.map(a => a.id === account.id ? account : a),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('accounts', account);
  },
  deleteAccount: async (id) => {
    const state = get()
    const relatedTransactions = state.transactions.filter(t => t.accountId === id || t.toAccountId === id);
    
    // Create account updates map
    const accountUpdates = new Map<string, Account>();
    state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));
    
    // For transfers, reverse the effect on destination account before deleting
    const transfersFromThisAccount = relatedTransactions.filter(t => t.accountId === id && t.type === 'transfer' && t.toAccountId);
    for (const txn of transfersFromThisAccount) {
      const destAcc = accountUpdates.get(txn.toAccountId!);
      if (destAcc) {
        destAcc.balance -= txn.amount; // Remove the transfer from destination
      }
    }
    
    // For transfers TO this account, reverse the effect (add back to source)
    const transfersToThisAccount = relatedTransactions.filter(t => t.toAccountId === id && t.type === 'transfer');
    for (const txn of transfersToThisAccount) {
      const sourceAcc = accountUpdates.get(txn.accountId);
      if (sourceAcc) {
        sourceAcc.balance += txn.amount; // Add back to source
      }
    }
    
    // Delete related transactions from storage
    for (const txn of relatedTransactions) {
      await storage.delete('transactions', txn.id);
    }
    
    // Save updated accounts to storage
    for (const acc of accountUpdates.values()) {
      if (acc.id !== id) {
        await storage.put('accounts', acc);
      }
    }
    
    await storage.delete('accounts', id);
    
    // Update state
    set((state) => ({ 
      accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
      transactions: state.transactions.filter(t => t.accountId !== id && t.toAccountId !== id),
      dataVersion: state.dataVersion + 1 
    }));
  },
  
   // Transaction actions
   addTransaction: async (transaction) => {
     // Ensure transaction amounts are stored as positive values
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
         
         if (t.type === 'income') {
           if (fromAcc) fromAcc.balance += t.amount;
         } else if (t.type === 'expense') {
           if (fromAcc) fromAcc.balance -= t.amount;
         } else if (t.type === 'transfer') {
           if (fromAcc) fromAcc.balance -= t.amount;
           if (toAcc) toAcc.balance += t.amount;
         }
       });

       return {
         transactions: [...state.transactions, ...txns],
         accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
         dataVersion: state.dataVersion + 1
       };
     });
     
     const state = get();
     const affectedAccounts = state.accounts.filter(a => 
       txns.some(t => t.accountId === a.id || t.toAccountId === a.id)
     );
     for (const acc of affectedAccounts) {
       await storage.put('accounts', acc);
     }
     
     for (const t of txns) {
       await storage.put('transactions', t);
     }
   },
  
   updateTransaction: async (transaction) => {
     // Ensure transaction amount is stored as positive value
     const normalizedTransaction = { ...transaction, amount: Math.abs(transaction.amount) };
     
     set((state) => {
       const oldTxn = state.transactions.find(t => t.id === transaction.id);
       if (!oldTxn) return state;

       const accountUpdates = new Map<string, Account>();
       state.accounts.forEach(a => accountUpdates.set(a.id, { ...a }));

       // Reverse old transaction
       const oldAcc = accountUpdates.get(oldTxn.accountId);
       if (oldAcc) {
         if (oldTxn.type === 'income') oldAcc.balance -= oldTxn.amount;
         else if (oldTxn.type === 'expense') oldAcc.balance += oldTxn.amount;
       }

       // Apply new transaction
       const newAcc = accountUpdates.get(normalizedTransaction.accountId);
       if (newAcc) {
         if (normalizedTransaction.type === 'income') newAcc.balance += normalizedTransaction.amount;
         else if (normalizedTransaction.type === 'expense') newAcc.balance -= normalizedTransaction.amount;
       }

       return {
         transactions: state.transactions.map(t => t.id === transaction.id ? normalizedTransaction : t),
         accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
         dataVersion: state.dataVersion + 1
       };
     });

     await storage.put('transactions', normalizedTransaction);

     // Save updated accounts to storage
     const state = get();
     const oldTxn = state.transactions.find(t => t.id === transaction.id) || normalizedTransaction; // Fallback
     const affectedAccountIds = new Set([oldTxn.accountId, normalizedTransaction.accountId]);

     for (const acc of state.accounts) {
       if (affectedAccountIds.has(acc.id)) {
         await storage.put('accounts', acc);
       }
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

      // Reverse old transaction
      const oldAcc = accountUpdates.get(oldTxn.accountId);
      if (oldAcc) {
        if (oldTxn.type === 'income') oldAcc.balance -= oldTxn.amount;
        else if (oldTxn.type === 'expense') oldAcc.balance += oldTxn.amount;
      }

      return {
        transactions: state.transactions.filter(t => t.id !== id),
        accounts: state.accounts.map(a => accountUpdates.get(a.id) || a),
        dataVersion: state.dataVersion + 1
      };
    });

    await storage.delete('transactions', id);
    
    if (affectedAccountId) {
      const acc = get().accounts.find(a => a.id === affectedAccountId);
      if (acc) {
        await storage.put('accounts', acc);
      }
    }
  },
  
  // Budget actions
  addBudget: async (budget) => {
    set((state) => ({ 
      budgets: [...state.budgets, budget],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('budgets', budget);
  },
  updateBudget: async (budget) => {
    set((state) => ({ 
      budgets: state.budgets.map(b => b.id === budget.id ? budget : b),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('budgets', budget);
  },
  deleteBudget: async (id) => {
    set((state) => ({ 
      budgets: state.budgets.filter(b => b.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('budgets', id);
  },
  
  // Workout actions
  addWorkout: async (workout) => {
    set((state) => ({ 
      workouts: [...state.workouts, workout],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('workouts', workout);
  },
  updateWorkout: async (workout) => {
    set((state) => ({ 
      workouts: state.workouts.map(w => w.id === workout.id ? workout : w),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('workouts', workout);
  },
  deleteWorkout: async (id) => {
    set((state) => ({ 
      workouts: state.workouts.filter(w => w.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('workouts', id);
  },
  
  // Meal actions
  addMeal: async (meal) => {
    set((state) => ({ 
      meals: [...state.meals, meal],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('meals', meal);
  },
  updateMeal: async (meal) => {
    set((state) => ({ 
      meals: state.meals.map(m => m.id === meal.id ? meal : m),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('meals', meal);
  },
  deleteMeal: async (id) => {
    set((state) => ({ 
      meals: state.meals.filter(m => m.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('meals', id);
  },
  
  // Body Metric actions
  addBodyMetric: async (metric) => {
    set((state) => ({ 
      bodyMetrics: [...state.bodyMetrics, metric],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('bodyMetrics', metric);
  },
  deleteBodyMetric: async (id) => {
    set((state) => ({ 
      bodyMetrics: state.bodyMetrics.filter(m => m.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('bodyMetrics', id);
  },
  
  // Hydration actions
  addHydration: async (entry) => {
    set((state) => ({ 
      hydration: [...state.hydration, entry],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('hydration', entry);
  },
  deleteHydration: async (id) => {
    set((state) => ({ 
      hydration: state.hydration.filter(h => h.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('hydration', id);
  },
  
  // Sleep actions
  addSleep: async (entry) => {
    set((state) => ({ 
      sleep: [...state.sleep, entry],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('sleep', entry);
  },
  deleteSleep: async (id) => {
    set((state) => ({ 
      sleep: state.sleep.filter(s => s.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('sleep', id);
  },
  
  // Goal actions
  addGoal: async (goal) => {
    set((state) => ({ 
      goals: [...state.goals, goal],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('goals', goal);
  },
  updateGoal: async (goal) => {
    set((state) => ({ 
      goals: state.goals.map(g => g.id === goal.id ? goal : g),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('goals', goal);
  },
  deleteGoal: async (id) => {
    set((state) => ({ 
      goals: state.goals.filter(g => g.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('goals', id);
  },
  
  // Investment actions
  addInvestment: async (investment) => {
    set((state) => ({ 
      investments: [...state.investments, investment],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('investments', investment);
  },
  updateInvestment: async (investment) => {
    set((state) => ({ 
      investments: state.investments.map(i => i.id === investment.id ? investment : i),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('investments', investment);
  },
  deleteInvestment: async (id) => {
    set((state) => ({ 
      investments: state.investments.filter(i => i.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('investments', id);
  },
  
  // Bill actions
  addBill: async (bill) => {
    set((state) => ({ 
      bills: [...state.bills, bill],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('bills', bill);
  },
  updateBill: async (bill) => {
    set((state) => ({ 
      bills: state.bills.map(b => b.id === bill.id ? bill : b),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('bills', bill);
  },
  deleteBill: async (id) => {
    set((state) => ({ 
      bills: state.bills.filter(b => b.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('bills', id);
  },
  
  // Debt actions
  addDebt: async (debt) => {
    set((state) => ({ 
      debts: [...state.debts, debt],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('debts', debt);
  },
  updateDebt: async (debt) => {
    set((state) => ({ 
      debts: state.debts.map(d => d.id === debt.id ? debt : d),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('debts', debt);
  },
  deleteDebt: async (id) => {
    set((state) => ({ 
      debts: state.debts.filter(d => d.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('debts', id);
  },
  
  // Subscription actions
  addSubscription: async (subscription) => {
    set((state) => ({ 
      subscriptions: [...state.subscriptions, subscription],
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('subscriptions', subscription);
  },
  updateSubscription: async (subscription) => {
    set((state) => ({ 
      subscriptions: state.subscriptions.map(s => s.id === subscription.id ? subscription : s),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.put('subscriptions', subscription);
  },
  deleteSubscription: async (id) => {
    set((state) => ({ 
      subscriptions: state.subscriptions.filter(s => s.id !== id),
      dataVersion: state.dataVersion + 1 
    }));
    await storage.delete('subscriptions', id);
  },
  
  executeActivity: async (parsed: any) => {
    const { type, name, data } = parsed;
    const now = new Date().toISOString();
    
    switch (type) {
      case 'workout':
        await get().addWorkout({
          id: generateId(),
          date: now.split('T')[0],
          name,
          type: 'strength',
          exercises: [],
          duration: data.duration || 30,
          createdAt: now,
          updatedAt: now
        });
        break;
      case 'meal':
        await get().addMeal({
          id: generateId(),
          date: now.split('T')[0],
          name,
          mealType: 'snack',
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          createdAt: now,
          updatedAt: now
        });
        break;
      case 'hydration':
        await get().addHydration({
          id: generateId(),
          date: now.split('T')[0],
          amount: data.amount || 250,
          timestamp: now,
          createdAt: now,
          updatedAt: now
        });
        break;
      case 'sleep':
        await get().addSleep({
          id: generateId(),
          date: now.split('T')[0],
          duration: data.duration || 8,
          quality: 3,
          createdAt: now,
          updatedAt: now
        });
        break;
    }
  },

  exportData: async () => {
    const data = await storage.exportAll();
    return JSON.stringify(data);
  },

  importData: async (json: string) => {
    const data = JSON.parse(json);
    await storage.importAll(data);
    await get().loadAllData();
  },

  clearAllData: async () => {
    await get().resetApp();
  },

  setAppMode: (mode) => set({ appMode: mode }),
  toggleAppMode: () => set((state) => ({ appMode: state.appMode === 'finance' ? 'fitness' : 'finance' })),
  setSplitView: (value) => set({ isSplitView: value }),
  setUser: (user) => set({ user }),
}));
