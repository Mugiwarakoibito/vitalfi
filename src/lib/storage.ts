import { generateId } from './utils';

const DB_NAME = 'LifeSyncProDB';
const DB_VERSION = 3;

interface DBSchema {
  accounts: Account;
  transactions: Transaction;
  budgets: Budget;
  workouts: Workout;
  workoutTemplates: WorkoutTemplate;
  meals: Meal;
  bodyMetrics: BodyMetric;
  hydration: HydrationEntry;
  sleep: SleepEntry;
  goals: Goal;
  settings: AppSettings;
  investments: Investment;
  bills: Bill;
  debts: Debt;
  subscriptions: Subscription;
}

export interface Account {
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

export interface Budget {
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

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  accountId: string;
  type: 'income' | 'expense';
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  name: string;
  symbol?: string;
  type: 'stock' | 'etf' | 'crypto' | 'bond' | 'realestate' | 'other';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: 'utilities' | 'rent' | 'insurance' | 'subscription' | 'loan' | 'other';
  isPaid: boolean;
  lastPaidDate?: string;
  reminders: number[];
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'student' | 'other';
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'weekly' | 'monthly' | 'yearly';
  category: 'entertainment' | 'productivity' | 'fitness' | 'news' | 'cloud' | 'other';
  startDate: string;
  nextBillingDate: string;
  isActive: boolean;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetWorthEntry {
  id: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  createdAt: string;
}

export interface Workout {
  id: string;
  date: string;
  name: string;
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility';
  exercises: WorkoutExercise[];
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'hiit' | 'flexibility';
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed?: boolean;
}

export interface Meal {
  id: string;
  date: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  measurements: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface HydrationEntry {
  id: string;
  date: string;
  amount: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface SleepEntry {
  id: string;
  date: string;
  duration: number;
  quality: 1 | 2 | 3 | 4 | 5;
  bedTime?: string;
  wakeTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  type: 'financial' | 'fitness';
  name: string;
  target: number;
  current: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id?: string;
  currency: string;
  country: string;
  name: string;
  fitnessGoals: string[];
  primaryGate: 'financial' | 'health';
  theme: 'dark' | 'light';
  onboardingComplete: boolean;
}

class Storage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;
  private localStorageFallback = false;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB unavailable, falling back to localStorage');
        this.localStorageFallback = true;
        reject(new Error('IndexedDB unavailable'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('budgets')) {
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workoutTemplates')) {
          db.createObjectStore('workoutTemplates', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meals')) {
          db.createObjectStore('meals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bodyMetrics')) {
          db.createObjectStore('bodyMetrics', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('hydration')) {
          db.createObjectStore('hydration', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sleep')) {
          db.createObjectStore('sleep', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  private async getStore<K extends keyof DBSchema>(
    storeName: K,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await this.dbReady;
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private localGet<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private localSet(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async get<K extends keyof DBSchema>(storeName: K, id: string): Promise<DBSchema[K] | null> {
    if (this.localStorageFallback) {
      return this.localGet(`${storeName}_${id}`);
    }

    return new Promise((resolve, reject) => {
      this.getStore(storeName).then((store) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getAll<K extends keyof DBSchema>(storeName: K): Promise<DBSchema[K][]> {
    if (this.localStorageFallback) {
      return this.localGet(`${storeName}_all`) || [];
    }

    return new Promise((resolve, reject) => {
      this.getStore(storeName).then((store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async put<K extends keyof DBSchema>(storeName: K, data: DBSchema[K]): Promise<string> {
    const withTimestamps = {
      ...data,
      id: (data as { id?: string }).id || generateId(),
      createdAt: (data as { createdAt?: string }).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.localStorageFallback) {
      this.localSet(`${storeName}_${withTimestamps.id}`, withTimestamps);
      const allKey = `${storeName}_all`;
      const existing = this.localGet<DBSchema[K][]>(allKey) || [];
      const filtered = existing.filter((item) => (item as { id: string }).id !== withTimestamps.id);
      this.localSet(allKey, [...filtered, withTimestamps]);
      return withTimestamps.id;
    }

    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then((store) => {
        const request = store.put(withTimestamps);
        request.onsuccess = () => resolve(withTimestamps.id);
        request.onerror = () => reject(request.error);
      });
    });
  }

  async delete<K extends keyof DBSchema>(storeName: K, id: string): Promise<void> {
    if (this.localStorageFallback) {
      localStorage.removeItem(`${storeName}_${id}`);
      const allKey = `${storeName}_all`;
      const existing = this.localGet<DBSchema[K][]>(allKey) || [];
      this.localSet(
        allKey,
        existing.filter((item) => (item as { id: string }).id !== id)
      );
      return;
    }

    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then((store) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clear<K extends keyof DBSchema>(storeName: K): Promise<void> {
    if (this.localStorageFallback) {
      const allKey = `${storeName}_all`;
      this.localSet(allKey, []);
      return;
    }

    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then((store) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    const storeNames: (keyof DBSchema)[] = [
      'accounts',
      'transactions',
      'budgets',
      'workouts',
      'workoutTemplates',
      'meals',
      'bodyMetrics',
      'hydration',
      'sleep',
      'goals',
      'settings',
    ];

    for (const storeName of storeNames) {
      try {
        data[storeName] = await this.getAll(storeName);
      } catch {
        data[storeName] = [];
      }
    }

    return data;
  }

  async importAll(data: Record<string, unknown>): Promise<void> {
    const storeNames: (keyof DBSchema)[] = [
      'accounts',
      'transactions',
      'budgets',
      'workouts',
      'workoutTemplates',
      'meals',
      'bodyMetrics',
      'hydration',
      'sleep',
      'goals',
      'settings',
    ];

    for (const storeName of storeNames) {
      const items = data[storeName];
      if (Array.isArray(items)) {
        await this.clear(storeName);
        for (const item of items) {
          await this.put(storeName, item as DBSchema[typeof storeName]);
        }
      }
    }
  }

  isUsingLocalStorage(): boolean {
    return this.localStorageFallback;
  }
}

export const storage = new Storage();
