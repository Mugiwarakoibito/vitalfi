import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Activity, Target,
  Brain, Wallet, PieChart, LineChart,
  BarChart3, DollarSign,
  CalendarDays, Flame, Dumbbell, Moon, Flag,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts'
import { HealthDashboard } from '@/components/fitness/HealthDashboard'

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6']

function useFinanceAnalytics() {
  const { accounts, transactions, budgets, investments, goals, workouts, sleep } = useAppStore()

  return useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const lastMonth = month === 0 ? 11 : month - 1
    const lastMonthYear = month === 0 ? year - 1 : year

    const netWorth = accounts.reduce((s, a) => s + a.balance, 0)
    const totalInvestments = accounts.filter(a => a.type === 'investment').reduce((s, a) => s + a.balance, 0)
      + investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0)

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((s, t) => s + t.amount, 0)
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year)
      .reduce((s, t) => s + t.amount, 0)
    const lastIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === lastMonth && new Date(t.date).getFullYear() === lastMonthYear)
      .reduce((s, t) => s + t.amount, 0)
    const lastExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === lastMonth && new Date(t.date).getFullYear() === lastMonthYear)
      .reduce((s, t) => s + t.amount, 0)

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100) : 0
    const lastSavingsRate = lastIncome > 0 ? ((lastIncome - lastExpenses) / lastIncome * 100) : 0
    const savingsTrend = lastSavingsRate > 0 ? savingsRate - lastSavingsRate : 0

    const catSpending: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catSpending[t.category] = (catSpending[t.category] || 0) + t.amount
    })
    const categoryBreakdown = Object.entries(catSpending)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))

    const totalSpent = categoryBreakdown.reduce((s, c) => s + c.value, 0)
    const topCategory = categoryBreakdown[0]

    const trend7d: { date: string; expenses: number; income: number }[] = []
    const trend30d: { date: string; expenses: number; income: number }[] = []
    const trend90d: { date: string; expenses: number; income: number }[] = []

    for (let i = 89; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayExpenses = transactions.filter(t => t.type === 'expense' && t.date === ds).reduce((s, t) => s + t.amount, 0)
      const dayIncome = transactions.filter(t => t.type === 'income' && t.date === ds).reduce((s, t) => s + t.amount, 0)
      const entry = {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expenses: dayExpenses, income: dayIncome,
      }
      trend90d.push(entry)
      if (i < 30) trend30d.push(entry)
      if (i < 7) trend7d.push(entry)
    }

    const budgetAdherence = budgets.map(b => ({
      name: b.name, limit: b.limit, spent: b.spent,
      remaining: b.limit - b.spent,
      overspent: b.spent > b.limit,
    }))

    const activeGoals = goals.filter(g => g.type === 'financial')
    const goalProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((s, g) => s + g.current, 0) / activeGoals.reduce((s, g) => s + g.target, 0) * 100)
      : 0

    const monthDays = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month)
      .reduce<Record<string, number>>((acc, t) => {
        const day = new Date(t.date).getDate().toString()
        acc[day] = (acc[day] || 0) + t.amount
        return acc
      }, {})
    const avgDaily = Object.values(monthDays).length > 0
      ? Object.values(monthDays).reduce((s, v) => s + v, 0) / Object.values(monthDays).length : 0

    const workoutDays = new Set(workouts.map(w => w.date))
    const weekdaySpending: Record<string, { total: number; count: number }> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const d = new Date(t.date)
      const day = d.toLocaleDateString('en-US', { weekday: 'long' })
      if (!weekdaySpending[day]) weekdaySpending[day] = { total: 0, count: 0 }
      weekdaySpending[day].total += t.amount
      weekdaySpending[day].count++
    })
    const bestDay = Object.entries(weekdaySpending)
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .sort((a, b) => a.avg - b.avg)[0]

    const workoutDaySpending = transactions
      .filter(t => t.type === 'expense' && workoutDays.has(t.date))
      .reduce((s, t) => s + t.amount, 0)
    const workoutDayCount = [...workoutDays].filter(d =>
      transactions.some(t => t.date === d)
    ).length
    const nonWorkoutSpending = transactions
      .filter(t => t.type === 'expense' && !workoutDays.has(t.date))
      .reduce((s, t) => s + t.amount, 0)
    const nonWorkoutCount = transactions.filter(t => t.type === 'expense' && !workoutDays.has(t.date)).length || 1

    const avgWorkoutDaySpend = workoutDayCount > 0 ? workoutDaySpending / workoutDayCount : 0
    const avgNonWorkoutSpend = nonWorkoutSpending / nonWorkoutCount
    const workoutEffect = avgNonWorkoutSpend > 0
      ? Math.round((1 - avgWorkoutDaySpend / avgNonWorkoutSpend) * 100) : 0

    const sleepQuality = sleep.length > 0
      ? Math.round(sleep.reduce((s, e) => s + e.quality, 0) / sleep.length * 20) : 0

    const hasData = transactions.length > 0 && accounts.length > 0

    return {
      netWorth, totalInvestments, monthlyIncome, monthlyExpenses, savingsRate, lastSavingsRate,
      savingsTrend, categoryBreakdown, totalSpent, topCategory,
      trend7d, trend30d, trend90d, budgetAdherence, goalProgress,
      avgDaily, bestDay, avgWorkoutDaySpend, avgNonWorkoutSpend,
      workoutEffect, sleepQuality, hasData,
      workoutDays, weekdaySpending, activeGoals,
    }
  }, [accounts, transactions, budgets, investments, goals, workouts, sleep])
}

export default function Insights() {
  const navigate = useNavigate()
  const { settings, transactions, investments } = useAppStore()
  const currency = settings.currency || 'USD'
  const a = useFinanceAnalytics()

  const stabilityScore = a.hasData
    ? Math.round(Math.min(
      Math.min(a.savingsRate / 10, 3) +
        Math.min(a.budgetAdherence.filter(b => !b.overspent).length / Math.max(a.budgetAdherence.length, 1) * 3, 3) +
        Math.min(a.netWorth / 10000, 2) +
        Math.min(a.activeGoals.length, 1) +
        (a.workoutEffect > 0 ? 1 : 0),
      10) * 10) / 10
    : 0

  const systemScore = a.hasData
    ? Math.round(
      Math.min(a.savingsRate, 30) +
        Math.min(a.categoryBreakdown.length * 3, 20) +
        Math.min(a.goalProgress / 2, 20) +
        Math.min(a.workoutDays.size * 2, 20) +
        a.sleepQuality
    )
    : 0

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Intelligence Engine</h2>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tighter">
            Your <span className="gradient-text">Command Center.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl font-medium">
            {a.hasData
              ? `${transactions.length} transactions · ${a.categoryBreakdown.length} categories · ${a.workoutDays.size} active days`
              : 'Add data across finance and fitness to unlock your command center.'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-8 py-4 flex flex-col items-center justify-center border-white/10 bg-white/[0.02]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stability</p>
            <p className={cn("text-3xl font-black tracking-tighter", stabilityScore > 0 ? "text-emerald-400" : "text-white")}>
              {stabilityScore > 0 ? stabilityScore.toFixed(1) : "--"}<span className="text-xs text-slate-600 font-bold">/10</span>
            </p>
            {a.savingsTrend !== 0 && (
              <div className={cn("flex items-center gap-1 text-[10px] font-black mt-1", a.savingsTrend > 0 ? "text-emerald-500" : "text-rose-500")}>
                {a.savingsTrend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(a.savingsTrend).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="glass-card px-8 py-4 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">System</p>
            <p className="text-3xl font-black text-white tracking-tighter">{systemScore > 0 ? systemScore : "--"}</p>
            {a.hasData && <p className="text-[10px] text-indigo-400/60 font-bold mt-1">Active</p>}
          </div>
        </div>
      </header>

      {/* Primary Financial Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricTile
          icon={Wallet} label="Net Worth" value={formatCurrency(a.netWorth, currency)}
          trend={a.netWorth > 0 ? 'Real-time' : 'No Data'} color="cyan"
        />
        <MetricTile
          icon={DollarSign} label="Monthly Income" value={formatCurrency(a.monthlyIncome, currency)}
          trend={a.monthlyIncome > 0 ? `${a.savingsRate.toFixed(0)}% saved` : 'No Data'} color="emerald"
        />
        <MetricTile
          icon={TrendingDown} label="Monthly Burn" value={formatCurrency(a.monthlyExpenses, currency)}
          trend={a.monthlyExpenses > 0 ? `${a.avgDaily.toFixed(0)}/day avg` : 'No Data'} color="rose"
        />
        <MetricTile
          icon={BarChart3} label="Investments" value={formatCurrency(a.totalInvestments, currency)}
          trend={a.totalInvestments > 0 ? `${investments.length} holdings` : 'No Data'} color="purple"
        />
      </section>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown */}
        <div className="glass-card p-8 border-white/5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-8">
            <PieChart size={16} className="text-cyan-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Spending Categories</h3>
          </div>
          {a.categoryBreakdown.length > 0 ? (
            <div className="flex flex-col items-center">
              <RePieChart width={200} height={200}>
                <Pie data={a.categoryBreakdown} cx={100} cy={100} innerRadius={60} outerRadius={90}
                  dataKey="value" paddingAngle={3}>
                  {a.categoryBreakdown.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </RePieChart>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full">
                {a.categoryBreakdown.slice(0, 6).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] text-slate-400 font-medium truncate">{c.name}</span>
                    <span className="text-[10px] text-white font-bold ml-auto">
                      {a.totalSpent > 0 ? Math.round(c.value / a.totalSpent * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text="No spending data" />
          )}
        </div>

        {/* Spending Trend */}
        <div className="lg:col-span-2 glass-card p-8 border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <LineChart size={16} className="text-emerald-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cash Flow Trend</h3>
            </div>
          </div>
          {a.trend30d.some(d => d.expenses > 0 || d.income > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={a.trend30d}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={9} tickLine={false} />
                <YAxis stroke="#ffffff40" fontSize={9} tickFormatter={(v: number) => formatCurrency(v, currency)} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: number) => [formatCurrency(value, currency)]} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <EmptyState text="No transaction history yet" />
            </div>
          )}
        </div>
      </div>

      {/* Budget Health + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Target size={16} className="text-amber-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Budget Health</h3>
          </div>
          {a.budgetAdherence.length > 0 ? (
            <div className="space-y-4">
              {a.budgetAdherence.map((b, i) => (
                <div key={b.name} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white">{b.name}</span>
                    <span className={b.overspent ? 'text-rose-400' : 'text-emerald-400'}>
                      {formatCurrency(b.spent, currency)} / {formatCurrency(b.limit, currency)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(b.spent / b.limit * 100, 100)}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", b.overspent ? 'bg-rose-500' : 'bg-emerald-500')}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No budgets set" />
          )}
        </div>

        {/* Financial Goals */}
        <div className="glass-card p-8 border-white/5">
          <div className="flex items-center gap-2 mb-6">
            <Flag size={16} className="text-purple-400" />
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Financial Goals</h3>
          </div>
          {a.activeGoals.length > 0 ? (
            <div className="space-y-6">
              {a.activeGoals.map((g, i) => (
                <div key={g.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-white">{g.name}</p>
                    <p className="text-[10px] font-bold text-slate-500">{formatCurrency(g.current, currency)} / {formatCurrency(g.target, currency)}</p>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(g.current / g.target * 100, 100)}%` }}
                      transition={{ duration: 1.5, delay: i * 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium">{Math.round(g.current / g.target * 100)}% · {Math.round((g.target - g.current) / (Math.max(a.monthlyIncome - a.monthlyExpenses, 1))) > 0 ? `${Math.round((g.target - g.current) / Math.max(a.monthlyIncome - a.monthlyExpenses, 1))} months remaining` : 'Almost there!'}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No financial goals yet" />
          )}
        </div>
      </div>

      {/* Cross-Domain Insights — The "Ultimate" Differentiator */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-10">
        <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
          <Brain size={300} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse" />
            <h2 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-[0.4em]">
              Cross-Domain Intelligence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CorrelationCard
              icon={Dumbbell}
              title="Workout Impact on Spending"
              value={a.workoutEffect > 0 ? `${a.workoutEffect}% Less` : 'No Correlation'}
              subtitle={a.workoutEffect > 0
                ? `You spend ${a.workoutEffect}% less on days you work out vs rest days`
                : 'Log more workouts to see correlation'}
              trend={a.workoutEffect > 0 ? 'positive' : null}
            />
            <CorrelationCard
              icon={Moon}
              title="Sleep & Financial Health"
              value={a.sleepQuality > 0 ? `${a.sleepQuality}% Quality` : 'No Data'}
              subtitle={a.sleepQuality > 60
                ? 'Great sleep correlates with better financial decisions'
                : a.sleepQuality > 0
                  ? 'Improving sleep quality may boost your financial clarity'
                  : 'Log sleep to discover patterns'}
              trend={a.sleepQuality > 60 ? 'positive' : a.sleepQuality > 0 ? 'neutral' : null}
            />
            <CorrelationCard
              icon={CalendarDays}
              title="Best Spending Day"
              value={a.bestDay ? a.bestDay.day : 'No Data'}
              subtitle={a.bestDay
                ? `Your lowest average spending day — avg ${formatCurrency(a.bestDay.avg, currency)}`
                : 'Log transactions to find your optimal day'}
              trend="neutral"
            />
          </div>

          {a.hasData && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <InsightBadge
                icon={Flame}
                text={a.topCategory
                  ? `Top category: ${a.topCategory.name} (${a.totalSpent > 0 ? Math.round(a.topCategory.value / a.totalSpent * 100) : 0}% of spending)`
                  : 'No spending yet'}
                color="rose"
              />
              <InsightBadge
                icon={TrendingUp}
                text={a.savingsTrend > 0
                  ? `Savings rate improved ${Math.abs(a.savingsTrend).toFixed(0)}% vs last month`
                  : a.savingsTrend < 0
                    ? `Savings rate dropped ${Math.abs(a.savingsTrend).toFixed(0)}% — check your spending`
                    : 'Track more months to see trends'}
                color={a.savingsTrend >= 0 ? 'emerald' : 'amber'}
              />
              <InsightBadge
                icon={DollarSign}
                text={a.avgDaily > 0
                  ? `Average daily spend: ${formatCurrency(a.avgDaily, currency)} · ${a.categoryBreakdown.length} active categories`
                  : 'Start tracking daily spending'}
                color="cyan"
              />
            </div>
          )}
        </div>
      </section>

      {/* Health Overview */}
      <section className="space-y-8 py-8 border-y border-white/5">
        <div className="flex items-center gap-3">
          <Activity size={16} className="text-purple-400" />
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Wellness Sync</h3>
        </div>
        <HealthDashboard onNavigate={(tab) => navigate(`/fitness?tab=${tab}`)} />
      </section>
    </div>
  )
}

function MetricTile({ icon: Icon, label, value, trend, color }: any) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  return (
    <div className="glass-card p-5 border-white/5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl border", colors[color] || colors.cyan)}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-xl font-black text-white tracking-tighter">{value}</p>
      {trend && trend !== 'No Data' && (
        <p className="text-[9px] font-bold text-slate-600 mt-0.5 uppercase tracking-tighter">{trend}</p>
      )}
    </div>
  )
}

function CorrelationCard({ icon: Icon, title, value, subtitle, trend }: any) {
  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2.5 rounded-xl border",
          trend === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            trend === 'neutral' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
              'bg-slate-800 text-slate-500 border-white/5'
        )}>
          <Icon size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{title}</p>
      </div>
      <p className="text-2xl font-black text-white tracking-tight mb-1">{value}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{subtitle}</p>
    </div>
  )
}

function InsightBadge({ icon: Icon, text, color }: any) {
  const colors: Record<string, string> = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }
  return (
    <div className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl border", colors[color] || colors.cyan)}>
      <Icon size={14} />
      <span className="text-[11px] font-bold">{text}</span>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider text-center py-8">{text}</p>
}
