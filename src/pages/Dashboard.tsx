import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FinancialOverview } from '@/components/dashboard/FinancialOverview'
import { FitnessOverview } from '@/components/dashboard/FitnessOverview'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { GoalList } from '@/components/goals/GoalList'
import { storage } from '@/lib/storage'
import type {
  Account,
  Transaction,
  Workout,
  Meal,
  HydrationEntry,
  SleepEntry,
  BodyMetric,
  Goal,
} from '@/lib/storage'
import { useAppStore } from '@/store/useAppStore'
import {
  getMonthlyWorkoutStats,
  getTodayNutrition,
  getTodayHydration,
  getRecentActivity,
  getSpendingByCategory,
} from '@/lib/insights'
import {
  Wallet,
  Dumbbell,
  TrendingUp,
  Target,
  Search,
  Command,
} from 'lucide-react'

export default function Dashboard() {
  const { settings } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [hydration, setHydration] = useState<HydrationEntry[]>([])
  const [sleep, setSleep] = useState<SleepEntry[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [goals, setGoals] = useState<Goal[]>([])

  const loadAll = useCallback(async () => {
    const [
      acc,
      txn,
      wo,
      ml,
      hyd,
      sl,
      bm,
      gl,
    ] = await Promise.all([
      storage.getAll('accounts'),
      storage.getAll('transactions'),
      storage.getAll('workouts'),
      storage.getAll('meals'),
      storage.getAll('hydration'),
      storage.getAll('sleep'),
      storage.getAll('bodyMetrics'),
      storage.getAll('goals'),
    ])
    setAccounts(acc)
    setTransactions(txn)
    setWorkouts(wo)
    setMeals(ml)
    setHydration(hyd)
    setSleep(sl)
    setBodyMetrics(bm)
    setGoals(gl)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const currency = settings.currency || 'USD'
  const activity = getRecentActivity(transactions, workouts, meals, hydration, sleep, bodyMetrics, goals)
  const spendingByCategory = getSpendingByCategory(transactions)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40 mb-1" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-sm text-muted mt-1">
            Your financial and fitness overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="hidden md:inline-flex items-center gap-1 text-[11px] bg-white/[0.06] text-muted border border-white/[0.08] rounded-lg px-2.5 py-1.5">
            <Command size={10} />
            K
          </kbd>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover={false}>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Wallet className="h-5 w-5 text-primary-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Net Worth</p>
              <p className="text-lg font-semibold text-white">
                {accounts.length
                  ? '$' + accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()
                  : '$0'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <TrendingUp className="h-5 w-5 text-accent-light" />
            </div>
            <div>
              <p className="text-xs text-muted">This Month</p>
              <p className="text-lg font-semibold text-white">
                {transactions.length
                  ? '$' + transactions
                      .filter((t) => t.type === 'expense')
                      .slice(-30)
                      .reduce((s, t) => s + t.amount, 0)
                      .toLocaleString()
                  : '$0'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
              <Dumbbell className="h-5 w-5 text-success-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Workouts</p>
              <p className="text-lg font-semibold text-white">
                {workouts.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
              <Target className="h-5 w-5 text-warning-light" />
            </div>
            <div>
              <p className="text-xs text-muted">Goals</p>
              <p className="text-lg font-semibold text-white">
                {goals.filter((g) => Math.round((g.current / g.target) * 100) >= 100).length}/{goals.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Wallet size={14} className="text-primary-light" />
            Financial
          </h3>
          <FinancialOverview
            accounts={accounts}
            transactions={transactions}
            currency={currency}
            spendingByCategory={spendingByCategory}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Dumbbell size={14} className="text-success-light" />
            Fitness
          </h3>
          <FitnessOverview
            workoutStats={getMonthlyWorkoutStats(workouts)}
            todayNutrition={getTodayNutrition(meals)}
            todayHydration={getTodayHydration(hydration)}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target size={14} className="text-warning-light" />
            Goals
          </h3>
          <GoalList goals={goals} currency={currency} onGoalsChange={loadAll} />
        </div>
      </div>

      {/* Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivity items={activity} currency={currency} />
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="primary" className="w-full justify-start gap-2">
                <Wallet size={16} /> Add Transaction
              </Button>
              <Button variant="accent" className="w-full justify-start gap-2">
                <Dumbbell size={16} /> Log Workout
              </Button>
              <Button className="w-full justify-start gap-2">
                <Target size={16} /> Set Goal
              </Button>
              <kbd className="w-full flex items-center justify-center gap-1 text-[11px] bg-white/[0.03] text-muted border border-white/[0.06] rounded-lg px-2.5 py-1.5 mt-1">
                <Search size={10} />
                Press / to search
              </kbd>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
