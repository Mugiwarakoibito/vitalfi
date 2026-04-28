import type {
  Account,
  Transaction,
  Workout,
  Meal,
  HydrationEntry,
  SleepEntry,
  BodyMetric,
  Goal,
} from './storage'

export interface FinancialSummary {
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
}

export interface CategorySpend {
  category: string
  amount: number
  percentage: number
}

export interface WorkoutStats {
  totalThisMonth: number
  totalDuration: number
  streak: number
}

export interface TodayNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface ActivityItem {
  id: string
  type: 'transaction' | 'workout' | 'meal' | 'hydration' | 'sleep' | 'goal' | 'bodyMetric'
  title: string
  subtitle: string
  date: string
  amount?: number
  icon: string
  color: string
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

function getLastMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  return { start, end }
}

export function getFinancialSummary(
  accounts: Account[],
  transactions: Transaction[]
): FinancialSummary {
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
  const { start, end } = getMonthRange()

  const monthly = transactions.filter((t) => t.date >= start && t.date <= end)
  const monthlyIncome = monthly
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpenses = monthly
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings: monthlyIncome - monthlyExpenses,
  }
}

export function getSpendingByCategory(transactions: Transaction[]): CategorySpend[] {
  const { start, end } = getMonthRange()
  const expenses = transactions.filter(
    (t) => t.type === 'expense' && t.date >= start && t.date <= end
  )
  const total = expenses.reduce((sum, t) => sum + t.amount, 0)

  const map = new Map<string, number>()
  for (const t of expenses) {
    map.set(t.category, (map.get(t.category) || 0) + t.amount)
  }

  const result: CategorySpend[] = []
  for (const [category, amount] of map) {
    result.push({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    })
  }
  return result.sort((a, b) => b.amount - a.amount)
}

export function getWorkoutStreak(workouts: Workout[]): number {
  if (!workouts.length) return 0

  const dates = new Set(workouts.map((w) => w.date))
  const today = getTodayString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let checkDate = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null
  if (!checkDate) return 0

  const current = new Date(checkDate)
  let streak = 0

  while (true) {
    const dateStr = current.toISOString().split('T')[0]
    if (dates.has(dateStr)) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function getMonthlyWorkoutStats(workouts: Workout[]): WorkoutStats {
  const { start, end } = getMonthRange()
  const thisMonth = workouts.filter((w) => w.date >= start && w.date <= end)
  return {
    totalThisMonth: thisMonth.length,
    totalDuration: thisMonth.reduce((sum, w) => sum + w.duration, 0),
    streak: getWorkoutStreak(workouts),
  }
}

export function getTodayNutrition(meals: Meal[]): TodayNutrition {
  const today = getTodayString()
  const todayMeals = meals.filter((m) => m.date === today)
  return {
    calories: todayMeals.reduce((sum, m) => sum + m.calories, 0),
    protein: todayMeals.reduce((sum, m) => sum + m.protein, 0),
    carbs: todayMeals.reduce((sum, m) => sum + m.carbs, 0),
    fat: todayMeals.reduce((sum, m) => sum + m.fat, 0),
  }
}

export function getTodayHydration(entries: HydrationEntry[]): number {
  const today = getTodayString()
  return entries.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0)
}

export function getLastSleep(
  entries: SleepEntry[]
): { duration: number; quality: number } | null {
  if (!entries.length) return null
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  return { duration: sorted[0].duration, quality: sorted[0].quality }
}

export function getRecentActivity(
  transactions: Transaction[],
  workouts: Workout[],
  meals: Meal[],
  hydrationEntries: HydrationEntry[],
  sleepEntries: SleepEntry[],
  bodyMetrics: BodyMetric[],
  goals: Goal[],
  limit = 20
): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const t of transactions.slice(-50)) {
    items.push({
      id: `txn-${t.id}`,
      type: 'transaction',
      title: t.description,
      subtitle: t.type === 'income' ? 'Income' : t.category,
      date: t.createdAt || t.date,
      amount: t.amount,
      icon: t.type === 'income' ? 'TrendingUp' : 'Wallet',
      color: t.type === 'income' ? 'success' : 'primary',
    })
  }

  for (const w of workouts.slice(-20)) {
    items.push({
      id: `wo-${w.id}`,
      type: 'workout',
      title: w.name,
      subtitle: `${w.exercises.length} exercises · ${w.duration} min`,
      date: w.createdAt || w.date,
      icon: 'Dumbbell',
      color: 'success',
    })
  }

  for (const m of meals.slice(-20)) {
    items.push({
      id: `meal-${m.id}`,
      type: 'meal',
      title: m.name,
      subtitle: `${m.calories} kcal · ${m.mealType}`,
      date: m.createdAt || m.date,
      icon: 'Utensils',
      color: 'warning',
    })
  }

  for (const h of hydrationEntries.slice(-10)) {
    items.push({
      id: `hyd-${h.id}`,
      type: 'hydration',
      title: 'Hydration',
      subtitle: `+${h.amount}ml`,
      date: h.createdAt || h.date,
      icon: 'Droplets',
      color: 'accent',
    })
  }

  for (const s of sleepEntries.slice(-10)) {
    items.push({
      id: `sleep-${s.id}`,
      type: 'sleep',
      title: 'Sleep',
      subtitle: `${s.duration}h · Quality ${s.quality}/5`,
      date: s.createdAt || s.date,
      icon: 'Moon',
      color: 'primary',
    })
  }

  for (const b of bodyMetrics.slice(-10)) {
    items.push({
      id: `bm-${b.id}`,
      type: 'bodyMetric',
      title: 'Body Metrics',
      subtitle: b.weight ? `${b.weight} kg` : 'Measurements updated',
      date: b.createdAt || b.date,
      icon: 'Activity',
      color: 'success',
    })
  }

  for (const g of goals.slice(-10)) {
    items.push({
      id: `goal-${g.id}`,
      type: 'goal',
      title: g.name,
      subtitle: `${Math.round((g.current / g.target) * 100)}% complete`,
      date: g.updatedAt,
      icon: 'Target',
      color: 'warning',
    })
  }

  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

export function compareMonthOverMonth(transactions: Transaction[]): {
  currentMonthExpenses: number
  lastMonthExpenses: number
  changePercent: number
} {
  const currentRange = getMonthRange()
  const lastRange = getLastMonthRange()

  const currentExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.date >= currentRange.start &&
        t.date <= currentRange.end
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const lastExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' && t.date >= lastRange.start && t.date <= lastRange.end
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const changePercent =
    lastExpenses > 0
      ? Math.round(((currentExpenses - lastExpenses) / lastExpenses) * 100)
      : 0

  return { currentMonthExpenses: currentExpenses, lastMonthExpenses: lastExpenses, changePercent }
}

export function getAverageSleep(
  entries: SleepEntry[]
): { duration: number; quality: number } | null {
  if (!entries.length) return null
  const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0)
  const totalQuality = entries.reduce((sum, e) => sum + e.quality, 0)
  return {
    duration: Math.round((totalDuration / entries.length) * 10) / 10,
    quality: Math.round((totalQuality / entries.length) * 10) / 10,
  }
}
