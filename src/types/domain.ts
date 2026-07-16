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
  type?: string;
}

export interface TemplateExercise {
  exerciseId: string;
  name: string;
  targetSets: number;
  targetReps?: number;
  targetRpe?: number;
  restSeconds?: number;
  sets?: { weight?: number; reps?: number; rpe?: number; completed?: boolean; duration?: number; distance?: number }[];
  notes?: string;
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
  vo2max?: number;
  gripStrength?: number;
  plank?: number;
  verticalJump?: number;
  sitAndReach?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HydrationEntry {
  id: string;
  date: string;
  amount: number;
  timestamp: string;
  drinkType?: 'water' | 'coffee' | 'tea' | 'juice' | 'sports' | 'other';
  thirst?: 'none' | 'slight' | 'thirsty' | 'very';
  exercise?: boolean;
  hotWeather?: boolean;
  caffeine?: boolean;
  withMeal?: boolean;
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
  onsetMinutes?: number;
  nightWakings?: number;
  morningFeel?: 'refreshed' | 'tired' | 'groggy' | 'foggy';
  screenTime?: boolean;
  roomTemp?: 'cold' | 'cool' | 'neutral' | 'warm' | 'hot';
  dreamRecall?: boolean;
  alcohol?: boolean;
  meditation?: boolean;
  heavyMeal?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalRecord {
  id: string;
  date: string;
  exerciseName: string;
  exerciseId?: string;
  weight: number;
  reps: number;
  type: 'weight' | 'reps' | 'volume';
  goalWeight?: number;
  goalReps?: number;
  goalVolume?: number;
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

export type StoreName = keyof DBSchema;

export interface DBSchema {
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
  personalRecords: PersonalRecord;
  settings: AppSettings;
  investments: Investment;
  bills: Bill;
  debts: Debt;
  subscriptions: Subscription;
}
