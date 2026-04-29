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
  Target,
  ArrowLeftRight,
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

  const primaryGate = settings.primaryGate || 'financial'
  const isFinancial = primaryGate === 'financial'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isFinancial ? 'Financial Dashboard' : 'Health & Fitness'}
          </h2>
          <p className="text-sm text-muted mt-1">
            {isFinancial ? 'Your financial overview at a glance' : 'Your health & fitness overview'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/settings'}
        >
          <ArrowLeftRight size={14} />
          Switch to {isFinancial ? 'Health' : 'Financial'}
        </Button>
      </div>

      {isFinancial ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hover={false} className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">Net Worth</p>
                <p className="text-2xl font-bold text-white">
                  {accounts.length
                    ? '$' + accounts.reduce((s, a) => s + a.balance, 0).toLocaleString()
                    : '$0'}
                </p>
              </CardContent>
            </Card>
            <Card hover={false} className="bg-gradient-to-br from-accent/10 to-accent/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">This Month Spending</p>
                <p className="text-2xl font-bold text-white">
                  {transactions.length
                    ? '$' + transactions
                        .filter((t) => t.type === 'expense')
                        .slice(-30)
                        .reduce((s, t) => s + t.amount, 0)
                        .toLocaleString()
                    : '$0'}
                </p>
              </CardContent>
            </Card>
            <Card hover={false} className="bg-gradient-to-br from-success/10 to-success/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">Financial Goals</p>
                <p className="text-2xl font-bold text-white">
                  {goals.filter((g) => g.type === 'financial' && Math.round((g.current / g.target) * 100) >= 100).length}/{goals.filter(g => g.type === 'financial').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialOverview
                    accounts={accounts}
                    transactions={transactions}
                    currency={currency}
                    spendingByCategory={spendingByCategory}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivity 
                    items={activity.filter((a: any) => a.type === 'transaction' || a.type === 'account')} 
                    currency={currency} 
                  />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalList goals={goals.filter(g => g.type === 'financial')} currency={currency} onGoalsChange={loadAll} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="primary" className="w-full justify-start gap-2">
                    <Wallet size={16} /> Add Transaction
                  </Button>
                  <Button className="w-full justify-start gap-2">
                    <Target size={16} /> Set Goal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card hover={false} className="bg-gradient-to-br from-success/10 to-success/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">Total Workouts</p>
                <p className="text-2xl font-bold text-white">{workouts.length}</p>
              </CardContent>
            </Card>
            <Card hover={false} className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">This Month</p>
                <p className="text-2xl font-bold text-white">
                  {workouts.filter(w => {
                    const d = new Date(w.date)
                    const now = new Date()
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </CardContent>
            </Card>
            <Card hover={false} className="bg-gradient-to-br from-warning/10 to-warning/5">
              <CardContent className="py-4">
                <p className="text-xs text-muted mb-1">Fitness Goals</p>
                <p className="text-2xl font-bold text-white">
                  {goals.filter((g) => g.type === 'fitness' && Math.round((g.current / g.target) * 100) >= 100).length}/{goals.filter(g => g.type === 'fitness').length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fitness Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <FitnessOverview
                    workoutStats={getMonthlyWorkoutStats(workouts)}
                    todayNutrition={getTodayNutrition(meals)}
                    todayHydration={getTodayHydration(hydration)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentActivity 
                    items={activity.filter((a: any) => a.type === 'workout' || a.type === 'meal' || a.type === 'hydration' || a.type === 'sleep')} 
                    currency={currency} 
                  />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalList goals={goals.filter(g => g.type === 'fitness')} currency={currency} onGoalsChange={loadAll} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="primary" className="w-full justify-start gap-2">
                    <Dumbbell size={16} /> Log Workout
                  </Button>
                  <Button className="w-full justify-start gap-2">
                    <Target size={16} /> Set Goal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
