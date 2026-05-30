import { create } from 'zustand';
import { storage } from '../lib/storage';
import { createAuthSlice } from './authSlice';
import { createFinanceSlice } from './financeSlice';
import { createFitnessSlice } from './fitnessSlice';
import type { AppState } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const useAppStore = create<AppState>()((...args) => {
  const [set, get] = args;

  const auth = createAuthSlice(...args);
  const finance = createFinanceSlice(...args);
  const fitness = createFitnessSlice(...args);

  return {
    ...auth,
    ...finance,
    ...fitness,

    dataVersion: 0,

    loadAllData: async () => {
      const stores = [
        'accounts', 'transactions', 'budgets', 'workouts', 'meals',
        'bodyMetrics', 'hydration', 'sleep', 'goals', 'investments',
        'bills', 'debts', 'subscriptions',
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

    refreshData: () => {
      set((state: AppState) => ({ dataVersion: state.dataVersion + 1 }));
    },

    executeActivity: async (parsed: any) => {
      const { type, name, data } = parsed;
      const now = new Date().toISOString();
      switch (type) {
        case 'workout':
          await get().addWorkout({
            id: generateId(), date: now.split('T')[0], name,
            category: 'strength', exercises: [], duration: data.duration || 30,
            createdAt: now, updatedAt: now,
          });
          break;
        case 'meal':
          await get().addMeal({
            id: generateId(), date: now.split('T')[0], name,
            mealType: 'snack', calories: data.calories || 0,
            protein: data.protein || 0, carbs: data.carbs || 0, fat: data.fat || 0,
            createdAt: now, updatedAt: now,
          });
          break;
        case 'hydration':
          await get().addHydration({
            id: generateId(), date: now.split('T')[0],
            amount: data.amount || 250, timestamp: now,
            createdAt: now, updatedAt: now,
          });
          break;
        case 'sleep':
          await get().addSleep({
            id: generateId(), date: now.split('T')[0],
            duration: data.duration || 8, quality: 3,
            createdAt: now, updatedAt: now,
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
  };
});
