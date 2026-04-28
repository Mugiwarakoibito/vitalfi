import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Dumbbell,
  Moon,
  Utensils,
  Activity,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { storage } from '@/lib/storage'
import type { Transaction, Workout, Meal, SleepEntry } from '@/lib/storage'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'
import {
  compareMonthOverMonth,
  getMonthlyWorkoutStats,
  getAverageSleep,
  getSpendingByCategory,
} from '@/lib/insights'


function InsightCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  color: string
}) {
  const bgMap: Record<string, string> = {
    primary: 'bg-primary/15 text-primary-light',
    success: 'bg-success/15 text-success-light',
    warning: 'bg-warning/15 text-warning-light',
    error: 'bg-error/15 text-error-light',
    accent: 'bg-accent/15 text-accent-light',
  }
  return (
    <Card hover={false}>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            bgMap[color] || bgMap.primary
          }`}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Insights() {
  const { settings } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [sleep, setSleep] = useState<SleepEntry[]>([])

  const load = useCallback(async () => {
    const [txn, wo, ml, sl] = await Promise.all([
      storage.getAll('transactions'),
      storage.getAll('workouts'),
      storage.getAll('meals'),
      storage.getAll('sleep'),
    ])
    setTransactions(txn)
    setWorkouts(wo)
    setMeals(ml)
    setSleep(sl)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
            <Lightbulb className="h-5 w-5 text-warning-light" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Insights</h2>
            <p className="text-sm text-muted mt-1">
              AI-driven recommendations and analytics.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-8">
                <div className="h-8 w-24 bg-white/[0.06] rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const currency = settings.currency || 'USD'
  const { changePercent, currentMonthExpenses, lastMonthExpenses } =
    compareMonthOverMonth(transactions)
  const woStats = getMonthlyWorkoutStats(workouts)
  const avgSleep = getAverageSleep(sleep)
  const topCategories = getSpendingByCategory(transactions)
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const avgCalories =
    meals.length > 0
      ? Math.round(meals.reduce((s, m) => s + m.calories, 0) / meals.length)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15">
          <Lightbulb className="h-5 w-5 text-warning-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Insights</h2>
          <p className="text-sm text-muted mt-1">
            AI-driven recommendations and analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InsightCard
          icon={TrendingDown}
          label="Monthly Expenses"
          value={formatCurrency(currentMonthExpenses, currency)}
          sub={
            lastMonthExpenses > 0
              ? `${changePercent >= 0 ? '+' : ''}${changePercent}% vs last month`
              : 'No data last month'
          }
          color="error"
        />
        <InsightCard
          icon={TrendingUp}
          label="Monthly Income"
          value={formatCurrency(totalIncome, currency)}
          color="success"
        />
        <InsightCard
          icon={Dumbbell}
          label="Workouts This Month"
          value={String(woStats.totalThisMonth)}
          sub={`${woStats.streak} day streak`}
          color="accent"
        />
        <InsightCard
          icon={Moon}
          label="Avg Sleep"
          value={avgSleep ? `${avgSleep.duration}h` : '—'}
          sub={avgSleep ? `Quality ${avgSleep.quality}/5` : 'No sleep data'}
          color="primary"
        />
        <InsightCard
          icon={Utensils}
          label="Avg Calories / Meal"
          value={avgCalories > 0 ? String(avgCalories) : '—'}
          sub={`${meals.length} meals logged`}
          color="warning"
        />
        <InsightCard
          icon={Activity}
          label="Total Workout Time"
          value={`${woStats.totalDuration}m`}
          sub={`${woStats.totalThisMonth} sessions this month`}
          color="success"
        />
      </div>

      {topCategories.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-white mb-4">
              Top Spending Categories
            </h3>
            <div className="space-y-3">
              {topCategories.slice(0, 6).map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{cat.category}</span>
                    <span className="text-muted">
                      {formatCurrency(cat.amount, currency)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
