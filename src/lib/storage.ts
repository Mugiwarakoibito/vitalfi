import { generateId } from './utils';

const DB_NAME = 'LifeSyncDB';
const DB_VERSION = 4;

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
  toAccountId?: string;
  type: 'income' | 'expense' | 'transfer';
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
  category: string;
  phase?: string;
  week?: number;
  isDeload?: boolean;
  exercises: WorkoutExercise[];
  duration: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy migration
  type?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  category: string;
  trainingGoal?: string;
  phase?: string;
  week?: number;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
  // Legacy migration
  type?: string;
}

export interface TemplateExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps?: number;
  targetRpe?: number;
  restSeconds?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
  rpe?: number;
  isSupersetWith?: string;
  supersetOrder?: number;
}

export interface ExerciseSet {
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rpe?: number;
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
  note?: string;
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
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id?: string;
  currency: string;
  country: string;
  name: string;
  fitnessGoals: string[];
  theme: 'light' | 'dark';
  onboardingComplete: boolean;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  weightKg?: number;
  heightCm?: number;
  age?: number;
  sex?: 'male' | 'female' | 'other';
  lastSync?: string;
}

class Storage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase>;
  private localStorageFallback = false;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onblocked = () => {
          console.warn('Database upgrade blocked by another tab.');
        };

        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to localStorage');
          this.localStorageFallback = true;
          resolve(null as unknown as IDBDatabase);
        };

        request.onsuccess = () => {
          this.db = request.result;
          this.db.onversionchange = () => {
            this.db?.close();
            window.location.reload();
          };
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const stores = [
            'accounts', 'transactions', 'budgets', 'workouts',
            'workoutTemplates', 'meals', 'bodyMetrics', 'hydration',
            'sleep', 'goals', 'settings', 'investments', 'bills',
            'debts', 'subscriptions'
          ];
          stores.forEach(store => {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: 'id' });
            }
          });
        };
      } catch (error) {
        console.warn('IndexedDB init failed:', error);
        this.localStorageFallback = true;
        resolve(null as unknown as IDBDatabase);
      }
    });
  }

  private async getStore<K extends keyof DBSchema>(
    storeName: K,
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await this.dbReady;
    if (!db) throw new Error('Database not available');
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  private localGet<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private localSet(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('localStorage set failed:', error);
    }
  }

  async get<K extends keyof DBSchema>(storeName: K, id: string): Promise<DBSchema[K] | null> {
    if (this.localStorageFallback) {
      return this.localGet(`${storeName}_${id}`);
    }
    try {
      const store = await this.getStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return null;
    }
  }

  async getAll<K extends keyof DBSchema>(storeName: K): Promise<DBSchema[K][]> {
    if (this.localStorageFallback) {
      return this.localGet(`${storeName}_all`) || [];
    }
    try {
      const store = await this.getStore(storeName);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return [];
    }
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

    try {
      const store = await this.getStore(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(withTimestamps);
        request.onsuccess = () => resolve(withTimestamps.id);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      return withTimestamps.id;
    }
  }

  async delete<K extends keyof DBSchema>(storeName: K, id: string): Promise<void> {
    if (this.localStorageFallback) {
      localStorage.removeItem(`${storeName}_${id}`);
      const allKey = `${storeName}_all`;
      const existing = this.localGet<DBSchema[K][]>(allKey) || [];
      this.localSet(allKey, existing.filter((item) => (item as { id: string }).id !== id));
      return;
    }

    try {
      const store = await this.getStore(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Failed to delete ${storeName}/${id}:`, error);
    }
  }

  async clear<K extends keyof DBSchema>(storeName: K): Promise<void> {
    if (this.localStorageFallback) {
      this.localSet(`${storeName}_all`, []);
      return;
    }

    try {
      const store = await this.getStore(storeName, 'readwrite');
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Failed to clear ${storeName}:`, error);
    }
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};
    const storeNames: (keyof DBSchema)[] = [
      'accounts', 'transactions', 'budgets', 'workouts',
      'workoutTemplates', 'meals', 'bodyMetrics', 'hydration',
      'sleep', 'goals', 'settings', 'investments', 'bills',
      'debts', 'subscriptions'
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
      'accounts', 'transactions', 'budgets', 'workouts',
      'workoutTemplates', 'meals', 'bodyMetrics', 'hydration',
      'sleep', 'goals', 'settings', 'investments', 'bills',
      'debts', 'subscriptions'
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