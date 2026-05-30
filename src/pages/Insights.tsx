import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Wallet, PieChart,
  BarChart3, Target,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell as BarCell,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#14b8a6']
const CHARTS = ['Categories', 'Trend', 'Budget', 'Goals'] as const
type ChartTab = typeof CHARTS[number]

function useAnalytics() {
  const { accounts, transactions, budgets, investments, goals } = useAppStore()
  return useMemo(() => {
    const now = new Date(); const month = now.getMonth(); const year = now.getFullYear()
    const netWorth = accounts.reduce((s, a) => s + a.balance, 0)
    const monthlyIncome = transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).reduce((s, t) => s + t.amount, 0)
    const monthlyExpenses = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year).reduce((s, t) => s + t.amount, 0)
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome * 100 : 0
    const totalInvestments = accounts.filter(a => a.type === 'investment').reduce((s, a) => s + a.balance, 0) + investments.reduce((s, i) => s + i.currentPrice * i.quantity, 0)
    const catSpending: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => { catSpending[t.category] = (catSpending[t.category] || 0) + t.amount })
    const categoryBreakdown = Object.entries(catSpending).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))
    const totalSpent = categoryBreakdown.reduce((s, c) => s + c.value, 0)
    const trend30d: { date: string; expenses: number; income: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      trend30d.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expenses: transactions.filter(t => t.type === 'expense' && t.date === ds).reduce((s, t) => s + t.amount, 0),
        income: transactions.filter(t => t.type === 'income' && t.date === ds).reduce((s, t) => s + t.amount, 0),
      })
    }
    const budgetData = budgets.map(b => ({ name: b.name, spent: b.spent, limit: b.limit, remaining: Math.max(b.limit - b.spent, 0) }))
    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
    const totalBudgetSpent = budgets.reduce((s, b) => s + b.spent, 0)
    const activeGoals = goals.filter(g => g.type === 'financial')
    const avgDaily = transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month).length > 0
      ? transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month).reduce((s, t) => s + t.amount, 0) / new Set(transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === month).map(t => t.date)).size : 0
    const hasData = transactions.length > 0 && accounts.length > 0
    return { netWorth, monthlyIncome, monthlyExpenses, savingsRate, totalInvestments, categoryBreakdown, totalSpent, trend30d, budgetData, totalBudget, totalBudgetSpent, activeGoals, avgDaily, hasData }
  }, [accounts, transactions, budgets, investments, goals])
}

export default function Insights() {
  const { settings, transactions, investments } = useAppStore()
  const currency = settings.currency || 'USD'
  const a = useAnalytics()
  const [tab, setTab] = useState<ChartTab>('Categories')

  return (
    <div className="min-h-full pb-24 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex items-center justify-between mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Analytics Overview</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            {a.hasData ? `${transactions.length} transactions · ${a.categoryBreakdown.length} categories` : 'Add data to unlock analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className={cn("h-2 w-2 rounded-full", a.hasData ? (a.savingsRate >= 20 ? 'bg-emerald-500' : a.savingsRate > 0 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-slate-600')} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {a.hasData ? `${a.savingsRate.toFixed(0)}% saved` : 'No data'}
            </span>
          </div>
        </div>
      </header>

      {/* Single Unified Analytics Box */}
      <div className="glass-card border-white/5 overflow-hidden">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5 border-b border-white/5">
          <KPICell icon={Wallet} label="Net Worth" value={formatCurrency(a.netWorth, currency)} color="cyan" />
          <KPICell icon={TrendingUp} label="Income" value={formatCurrency(a.monthlyIncome, currency)} color="emerald" />
          <KPICell icon={TrendingDown} label="Burn Rate" value={formatCurrency(a.monthlyExpenses, currency)} color="rose" sub={a.avgDaily > 0 ? `${formatCurrency(a.avgDaily, currency)}/day` : undefined} />
          <KPICell icon={BarChart3} label="Investments" value={formatCurrency(a.totalInvestments, currency)} color="purple" sub={investments.length > 0 ? `${investments.length} holdings` : undefined} />
        </div>

        {/* Interactive Tab Bar */}
        <div className="flex border-b border-white/5">
          {CHARTS.map((c) => (
            <button key={c} onClick={() => setTab(c)}
              className={cn(
                "flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
                tab === c ? 'text-white' : 'text-slate-600 hover:text-slate-400'
              )}
            >
              {c}
              {tab === c && <div className="absolute bottom-0 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div className="p-8">
          {tab === 'Categories' && (
            a.categoryBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  <RePieChart width={240} height={240}>
                    <Pie data={a.categoryBreakdown.slice(0, 8)} cx={120} cy={120} innerRadius={65} outerRadius={100}
                      dataKey="value" paddingAngle={3}>
                      {a.categoryBreakdown.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(value: number) => [formatCurrency(value, currency)]} />
                  </RePieChart>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  {a.categoryBreakdown.slice(0, 6).map((c, i) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-slate-300 font-medium">{c.name}</span>
                        </div>
                        <span className="text-white font-bold">
                          {a.totalSpent > 0 ? Math.round(c.value / a.totalSpent * 100) : 0}%
                          <span className="text-slate-600 font-normal ml-1.5">{formatCurrency(c.value, currency)}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${a.totalSpent > 0 ? c.value / a.totalSpent * 100 : 0}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full rounded-full" style={{ backgroundColor: COLORS[i] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <ChartEmpty text="Add expenses to see category breakdown" />
          )}

          {tab === 'Trend' && (
            a.trend30d.some(d => d.expenses > 0 || d.income > 0) ? (
              <div className="space-y-6">
                <div className="flex gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-400">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-rose-500" />
                    <span className="text-slate-400">Expenses</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={a.trend30d}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={9} tickLine={false} interval={Math.ceil(a.trend30d.length / 6)} />
                    <YAxis stroke="#ffffff40" fontSize={9} tickFormatter={(v: number) => formatCurrency(v, currency)} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(value: number) => [formatCurrency(value, currency)]} />
                    <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <ChartEmpty text="No transaction history this month" />
          )}

          {tab === 'Budget' && (
            a.budgetData.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Budget</p>
                    <p className="text-2xl font-black text-white">{formatCurrency(a.totalBudget, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spent</p>
                    <p className="text-2xl font-black text-rose-400">{formatCurrency(a.totalBudgetSpent, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Remaining</p>
                    <p className={cn("text-2xl font-black", a.totalBudget - a.totalBudgetSpent >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                      {formatCurrency(a.totalBudget - a.totalBudgetSpent, currency)}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={a.budgetData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                    <XAxis type="number" stroke="#ffffff40" fontSize={9} tickFormatter={(v: number) => formatCurrency(v, currency)} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#ffffff80" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(value: number) => [formatCurrency(value, currency)]} />
                    <Bar dataKey="spent" stackId="a" radius={[0, 4, 4, 0]}>
                      {a.budgetData.map((entry, i) => (
                        <BarCell key={i} fill={entry.spent > entry.limit ? '#ef4444' : COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <ChartEmpty text="No budgets configured" />
          )}

          {tab === 'Goals' && (
            a.activeGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {a.activeGoals.map((g, i) => {
                  const pct = Math.min(g.current / g.target * 100, 100)
                  return (
                    <div key={g.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Target size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{g.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{g.category}</p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-black text-white">{formatCurrency(g.current, currency)}</span>
                        <span className="text-slate-600 text-sm font-medium">of {formatCurrency(g.target, currency)}</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden mt-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.5, delay: i * 0.2 }}
                          className={cn("h-full rounded-full bg-gradient-to-r", pct >= 100 ? 'from-emerald-500 to-cyan-500' : 'from-purple-500 to-cyan-500')}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs font-bold text-white">{pct.toFixed(0)}%</span>
                        <span className="text-[10px] text-slate-500 font-medium">{formatCurrency(g.target - g.current, currency)} remaining</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <ChartEmpty text="Set financial goals to track progress here" />
          )}
        </div>
      </div>

      {/* Minimal bottom insights */}
      {a.hasData && (
        <div className="flex flex-wrap gap-3 mt-8">
          <MiniBadge icon={PieChart} text={a.categoryBreakdown[0] ? `Top: ${a.categoryBreakdown[0].name} (${a.totalSpent > 0 ? Math.round(a.categoryBreakdown[0].value / a.totalSpent * 100) : 0}%)` : 'No categories'} color="cyan" />
          <MiniBadge icon={TrendingUp} text={`Savings: ${a.savingsRate.toFixed(0)}% of income`} color={a.savingsRate > 0 ? 'emerald' : 'rose'} />
          <MiniBadge icon={Wallet} text={`Net worth: ${formatCurrency(a.netWorth, currency)}`} color="purple" />
        </div>
      )}
    </div>
  )
}

function KPICell({ icon: Icon, label, value, color, sub }: any) {
  const colors: Record<string, string> = { cyan: 'text-cyan-400', emerald: 'text-emerald-400', rose: 'text-rose-400', purple: 'text-purple-400' }
  return (
    <div className="p-5 md:p-6 flex flex-col items-center justify-center text-center gap-1.5">
      <Icon size={16} className={cn(colors[color] || 'text-cyan-400', 'opacity-60')} />
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">{label}</p>
      <p className="text-lg md:text-xl font-black text-white tracking-tighter">{value}</p>
      {sub && <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{sub}</p>}
    </div>
  )
}

function MiniBadge({ icon: Icon, text, color }: any) {
  const colors: Record<string, string> = { cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20', purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
  return (
    <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border", colors[color] || colors.cyan)}>
      <Icon size={12} />
      <span className="text-[10px] font-bold">{text}</span>
    </div>
  )
}

function ChartEmpty({ text }: { text: string }) {
  return <div className="h-[280px] flex items-center justify-center"><p className="text-xs text-slate-600 font-bold uppercase tracking-wider">{text}</p></div>
}
