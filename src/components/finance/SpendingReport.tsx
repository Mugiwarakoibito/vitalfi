import { useMemo } from 'react'
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
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
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Income</p>
                <p className="text-xl font-black text-white">${stats.thisMonthIncome.toLocaleString()}</p>
                <p className={cn("text-[10px]", stats.incomeChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {stats.incomeChange >= 0 ? '+' : ''}{stats.incomeChange.toFixed(1)}% vs last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <ArrowDownRight className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Expenses</p>
                <p className="text-xl font-black text-white">${stats.thisMonthExpenses.toLocaleString()}</p>
                <p className={cn("text-[10px]", stats.expenseChange <= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {stats.expenseChange >= 0 ? '+' : ''}{stats.expenseChange.toFixed(1)}% vs last month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Net</p>
                <p className="text-xl font-black text-white">${(stats.thisMonthIncome - stats.thisMonthExpenses).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Net Worth</p>
                <p className="text-xl font-black text-white">${stats.totalBalance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/5">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Top Spending Categories</h3>
        </CardHeader>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}