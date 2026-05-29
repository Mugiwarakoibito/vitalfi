import { formatCurrency } from '@/lib/utils'
import type { Account, Transaction } from '@/lib/storage'
import type { CategorySpend } from '@/lib/insights'
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'

interface FinancialOverviewProps {
  accounts: Account[]
  transactions: Transaction[]
  currency: string
  spendingByCategory: CategorySpend[]
}

export function FinancialOverview({
  accounts,
  transactions,
  currency,
  spendingByCategory,
}: FinancialOverviewProps) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-violet-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-14 h-14 bg-purple-500/10 rounded-full -ml-7 -mb-7 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
              <Wallet size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-[11px] text-violet-400/80 uppercase tracking-wider">
                Net Worth
              </p>
              <p className="text-sm font-semibold text-white drop-shadow-lg">
                {formatCurrency(netWorth, currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-14 h-14 bg-teal-500/10 rounded-full -ml-7 -mb-7 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-400/80 uppercase tracking-wider">
                Income
              </p>
              <p className="text-sm font-semibold text-white drop-shadow-lg">
                {formatCurrency(income, currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-rose-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-14 h-14 bg-red-500/10 rounded-full -ml-7 -mb-7 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20">
              <TrendingDown size={16} className="text-rose-400" />
            </div>
            <div>
              <p className="text-[11px] text-rose-400/80 uppercase tracking-wider">
                Expenses
              </p>
              <p className="text-sm font-semibold text-white drop-shadow-lg">
                {formatCurrency(expenses, currency)}
              </p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-4 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="absolute bottom-0 left-0 w-14 h-14 bg-orange-500/10 rounded-full -ml-7 -mb-7 blur-lg" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
              <PiggyBank size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-amber-400/80 uppercase tracking-wider">
                Savings
              </p>
              <p className="text-sm font-semibold text-white drop-shadow-lg">
                {formatCurrency(income - expenses, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {spendingByCategory.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
          <div className="relative">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Top Spending</h3>
            <div className="space-y-2">
              {spendingByCategory.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">{cat.category}</span>
                      <span className="text-slate-400">
                        {formatCurrency(cat.amount, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700 ease-out shadow-sm"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
