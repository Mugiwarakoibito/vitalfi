import { storage } from './storage';
import { generateId } from './utils';
import type { Account, Transaction, Budget, Investment, Bill, Debt, Goal, Workout, BodyMetric, SleepEntry, AppSettings } from '../types/domain';

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const descs = [
  'Grocery Store', 'Electric Bill', 'Netflix Subscription', 'Uber Ride',
  'Coffee Shop', 'Restaurant Dinner', 'Amazon Purchase', 'Gas Station',
  'Phone Bill', 'Internet Provider', 'Gym Membership', 'Spotify Premium',
  'Insurance Premium', 'Water Utility', 'Parking Garage', 'Pharmacy',
  'Clothing Store', 'Electronics Store', 'Book Store', 'Home Depot',
];

const incomeDescs = [
  'Salary Deposit', 'Freelance Payment', 'Dividend Payment',
  'Interest Payment', 'Refund', 'Side Project Income',
];

export async function seedIfNeeded(): Promise<boolean> {
  // Clean up any previously seeded meals & hydration (fake data from older version)
  try {
    const existingMeals = await storage.getAll('meals');
    const seededMealNames = ['Chicken & Rice', 'Salad Bowl', 'Protein Shake', 'Oatmeal', 'Steak & Veggies', 'Pasta', 'Smoothie', 'Eggs & Toast'];
    const seededMeals = existingMeals.filter(m => seededMealNames.includes(m.name));
    for (const m of seededMeals) await storage.delete('meals', m.id);
  } catch {}
  try {
    const existingHydration = await storage.getAll('hydration');
    const seededHydration = existingHydration.filter((h: any) => !h.drinkType);
    for (const h of seededHydration) await storage.delete('hydration', h.id);
  } catch {}

  const seeded = localStorage.getItem('vitalfi_seeded');
  if (seeded) return false;

  const settings = await storage.get('settings', 'app_settings');
  if (!settings) {
    await storage.put('settings', {
      id: 'app_settings',
      currency: 'USD',
      country: 'US',
      name: 'Alex',
      fitnessGoals: ['strength', 'cardio'],
      theme: 'dark',
      onboardingComplete: true,
      activityLevel: 'moderate',
    } as AppSettings);
  }

  const currency = (await storage.get('settings', 'app_settings'))?.currency || 'USD';

  const accountDefs = [
    { name: 'Main Checking', type: 'checking' as const, balance: 12450, color: '#06b6d4' },
    { name: 'High-Yield Savings', type: 'savings' as const, balance: 45200, color: '#10b981' },
    { name: 'Credit Card', type: 'credit' as const, balance: -2340, color: '#ef4444' },
    { name: 'Trading Account', type: 'investment' as const, balance: 28300, color: '#8b5cf6' },
  ];

  const accounts: Account[] = accountDefs.map(a => ({
    id: generateId(), name: a.name, type: a.type,
    balance: a.balance, currency, color: a.color,
    isArchived: false, createdAt: daysAgo(90), updatedAt: daysAgo(0),
  }));
  for (const a of accounts) await storage.put('accounts', a);

  const categories = [
    'Food & Dining', 'Transportation', 'Utilities', 'Shopping',
    'Entertainment', 'Health', 'Education', 'Housing',
  ];

  const transactions: Transaction[] = [];
  for (let i = 0; i < 45; i++) {
    const date = daysAgo(rand(0, 35));
    const isExpense = Math.random() > 0.25;
    transactions.push({
      id: generateId(), date,
      description: isExpense ? pick(descs) : pick(incomeDescs),
      amount: isExpense ? rand(5, 350) : rand(500, 5500),
      category: isExpense ? pick(categories) : 'Income',
      accountId: pick(accounts).id,
      type: isExpense ? 'expense' : 'income',
      tags: [],
      createdAt: date, updatedAt: date,
    });
  }
  for (const t of transactions) await storage.put('transactions', t);

  const budgets: Budget[] = categories.slice(0, 6).map(c => ({
    id: generateId(), name: c, category: c,
    limit: rand(400, 2000), spent: rand(100, 1800),
    period: 'monthly', color: pick(['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']),
    createdAt: daysAgo(30), updatedAt: daysAgo(0),
  }));
  for (const b of budgets) await storage.put('budgets', b);

  const investments: Investment[] = [
    { id: generateId(), name: 'S&P 500 ETF', symbol: 'VOO', type: 'etf', quantity: 45, purchasePrice: 380, currentPrice: 478, purchaseDate: daysAgo(180), createdAt: daysAgo(180), updatedAt: daysAgo(0) },
    { id: generateId(), name: 'Apple Inc.', symbol: 'AAPL', type: 'stock', quantity: 20, purchasePrice: 150, currentPrice: 178, purchaseDate: daysAgo(120), createdAt: daysAgo(120), updatedAt: daysAgo(0) },
    { id: generateId(), name: 'Bitcoin', symbol: 'BTC', type: 'crypto', quantity: 0.15, purchasePrice: 42000, currentPrice: 52700, purchaseDate: daysAgo(90), createdAt: daysAgo(90), updatedAt: daysAgo(0) },
  ];
  for (const i of investments) await storage.put('investments', i);

  const bills: Bill[] = [
    { id: generateId(), name: 'Rent', amount: 1800, dueDay: 1, category: 'rent', isPaid: true, reminders: [28], createdAt: daysAgo(30), updatedAt: daysAgo(5) },
    { id: generateId(), name: 'Electricity', amount: 145, dueDay: 15, category: 'utilities', isPaid: true, reminders: [12], createdAt: daysAgo(30), updatedAt: daysAgo(8) },
    { id: generateId(), name: 'Internet', amount: 79, dueDay: 10, category: 'utilities', isPaid: false, reminders: [8], createdAt: daysAgo(30), updatedAt: daysAgo(10) },
    { id: generateId(), name: 'Car Insurance', amount: 210, dueDay: 22, category: 'insurance', isPaid: false, reminders: [18], createdAt: daysAgo(60), updatedAt: daysAgo(0) },
  ];
  for (const b of bills) await storage.put('bills', b);

  const goals: Goal[] = [
    { id: generateId(), type: 'financial', name: 'Emergency Fund', target: 50000, current: 28500, deadline: '2026-12-31', category: 'savings', createdAt: daysAgo(60), updatedAt: daysAgo(0) },
    { id: generateId(), type: 'financial', name: 'Vacation Fund', target: 8000, current: 4200, deadline: '2026-08-31', category: 'savings', createdAt: daysAgo(45), updatedAt: daysAgo(0) },
    { id: generateId(), type: 'fitness', name: 'Run 10K', target: 10, current: 7, deadline: '2026-07-01', category: 'cardio', createdAt: daysAgo(30), updatedAt: daysAgo(0) },
  ];
  for (const g of goals) await storage.put('goals', g);

  const workouts: Workout[] = [];
  for (let i = 0; i < 12; i++) {
    const date = daysAgo(rand(0, 28));
    workouts.push({
      id: generateId(), date, name: pick(['Upper Body', 'Lower Body', 'Full Body', 'Cardio', 'HIIT', 'Yoga Flow']),
      category: pick(['strength', 'hypertrophy', 'cardio', 'hiit', 'yoga']),
      exercises: [], duration: rand(30, 75),
      createdAt: date, updatedAt: date,
    });
  }
  for (const w of workouts) await storage.put('workouts', w);

  for (let i = 0; i < 14; i++) {
    const date = daysAgo(i);
    await storage.put('sleep', {
      id: generateId(), date, duration: rand(6, 9), quality: rand(2, 5) as 1|2|3|4|5,
      bedTime: '22:30', wakeTime: '06:30', createdAt: date, updatedAt: date,
    } as SleepEntry    );

    if (i % 3 === 0) {
      await storage.put('bodyMetrics', {
        id: generateId(), date, weight: 78 + Math.random() * 2 - 1, bodyFat: 15 + Math.random() * 2,
        measurements: { waist: 82, chest: 102, arms: 38 }, createdAt: date, updatedAt: date,
      } as BodyMetric);
    }
  }

  const debts: Debt[] = [
    { id: generateId(), name: 'Student Loan', type: 'student', totalAmount: 35000, currentBalance: 22400, interestRate: 4.5, minimumPayment: 350, createdAt: daysAgo(365), updatedAt: daysAgo(0) },
  ];
  for (const d of debts) await storage.put('debts', d);

  localStorage.setItem('vitalfi_seeded', 'true');
  return true;
}
