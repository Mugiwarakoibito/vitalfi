import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
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
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Wallet size={16} className="text-primary-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Net Worth
              </p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(netWorth, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
              <TrendingUp size={16} className="text-success-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Income
              </p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(income, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/15">
              <TrendingDown size={16} className="text-error-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Expenses
              </p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(expenses, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
              <PiggyBank size={16} className="text-warning-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Savings
              </p>
              <p className="text-sm font-semibold text-white">
                {formatCurrency(income - expenses, currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {spendingByCategory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Spending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {spendingByCategory.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{cat.category}</span>
                    <span className="text-muted">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
