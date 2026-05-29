import { useMemo } from 'react'
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export function SpendingReport() {
  const { transactions, accounts } = useAppStore()

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const lastMonth = transactions.filter(t => {
      const d = new Date(t.date)
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear()
    })

    const thisMonthIncome = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const thisMonthExpenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const lastMonthIncome = lastMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const lastMonthExpenses = lastMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

    const categorySpending: Record<string, number> = {}
    thisMonth.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category || 'Other'] = (categorySpending[t.category || 'Other'] || 0) + t.amount
    })

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      thisMonthIncome,
      thisMonthExpenses,
      lastMonthIncome,
      lastMonthExpenses,
      incomeChange: lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
      expenseChange: lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
      topCategories,
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
    }
  }, [transactions, accounts])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">Income</p>
              <p className="text-xl font-black text-white drop-shadow-lg">${stats.thisMonthIncome.toLocaleString()}</p>
              <p className={cn("text-[10px] font-medium", stats.incomeChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange.toFixed(1)}% vs last month
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl">
              <ArrowDownRight className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-rose-400/80 font-bold uppercase tracking-wider">Expenses</p>
              <p className="text-xl font-black text-white drop-shadow-lg">${stats.thisMonthExpenses.toLocaleString()}</p>
              <p className={cn("text-[10px] font-medium", stats.expenseChange <= 0 ? "text-emerald-400" : "text-rose-400")}>
                {stats.expenseChange >= 0 ? '+' : ''}{stats.expenseChange.toFixed(1)}% vs last month
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-cyan-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-sky-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">Net</p>
              <p className="text-xl font-black text-white drop-shadow-lg">${(stats.thisMonthIncome - stats.thisMonthExpenses).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider">Net Worth</p>
              <p className="text-xl font-black text-white drop-shadow-lg">${stats.totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
        <div className="relative">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Top Spending Categories</h3>
          {stats.topCategories.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No spending data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topCategories.map(([cat, amount]) => {
                const pct = (amount / stats.thisMonthExpenses) * 100
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <span className="text-white font-bold">${amount.toLocaleString()} <span className="text-slate-500 text-xs">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}