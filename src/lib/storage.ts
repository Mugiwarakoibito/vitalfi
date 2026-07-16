import { generateId } from './utils';
import type { DBSchema } from '../types/domain';

const DB_NAME = 'LifeSyncDB';
const DB_VERSION = 5;

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
            'sleep', 'goals', 'personalRecords', 'settings', 'investments',
            'bills', 'debts', 'subscriptions'
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
      'sleep', 'goals', 'personalRecords', 'settings', 'investments',
      'bills', 'debts', 'subscriptions'
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
      'sleep', 'goals', 'personalRecords', 'settings', 'investments',
      'bills', 'debts', 'subscriptions'
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