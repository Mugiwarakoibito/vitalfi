import { create } from 'zustand';
import { storage, AppSettings } from '../lib/storage';

interface AppState {
  isLicensed: boolean;
  isOnboarded: boolean;
  settings: Partial<AppSettings>;
  isLoading: boolean;

  setLicensed: (value: boolean) => void;
  setOnboarded: (value: boolean) => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetApp: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  currency: 'USD',
  country: 'US',
  name: '',
  fitnessGoals: [],
  theme: 'dark',
  onboardingComplete: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  isLicensed: false,
  isOnboarded: false,
  settings: defaultSettings,
  isLoading: true,

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
    set({ isLoading: true });

    try {
      const settings = await storage.get('settings', 'app_settings');
      if (settings) {
        set({
          settings,
          isOnboarded: settings.onboardingComplete ?? false,
        });
      }
    } catch {
      // Use defaults
    }

    set({ isLoading: false });
  },

  resetApp: async () => {
    await storage.clear('accounts');
    await storage.clear('transactions');
    await storage.clear('budgets');
    await storage.clear('workouts');
    await storage.clear('meals');
    await storage.clear('bodyMetrics');
    await storage.clear('goals');
    await storage.clear('settings');
    localStorage.clear();
    set({
      isLicensed: false,
      isOnboarded: false,
      settings: defaultSettings,
    });
  },
}));
