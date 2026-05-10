import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Wallet,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { Account, Transaction } from '@/lib/storage'

interface FinancialDashboardProps {
  accounts: Account[]
  transactions: Transaction[]
  currency: string
  onNavigate?: (tab: string) => void
  onQuickAction?: (action: string) => void
}

export function FinancialDashboard({
  accounts,
  transactions,
  currency,
  onNavigate,
  onQuickAction,
}: FinancialDashboardProps) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '1y'>('30d')

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const totalNetWorth = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])

  const monthlyData = useMemo(() => {
    const months: { month: string; income: number; expenses: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthTxns = transactions.filter(t => {
        const td = new Date(t.date)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      })
      months.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        income: monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return months
  }, [transactions, now])

  const currentMonthIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= thisMonthStart)
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, thisMonthStart])

  const currentMonthExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= thisMonthStart)
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, thisMonthStart])

  const availableCash = useMemo(() => {
    return accounts
      .filter(a => !a.isArchived && (a.type === 'checking' || a.type === 'savings' || a.type === 'cash'))
      .reduce((s, a) => s + a.balance, 0)
  }, [accounts])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted font-medium">Total Net Worth</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalNetWorth, currency)}</p>
                <div className="flex items-center gap-1 text-xs text-success-light mt-1">
                  <TrendingUp size={12} /> +5.2%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Wallet size={20} className="text-primary-light" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card hover className="bg-gradient-to-br from-success/20 to-success/5 border-success/20">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted">Income</p>
              <p className="text-lg font-bold text-success-light mt-1">{formatCurrency(currentMonthIncome, currency)}</p>
            </CardContent>
          </Card>
          <Card hover className="bg-gradient-to-br from-error/20 to-error/5 border-error/20">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted">Expenses</p>
              <p className="text-lg font-bold text-error-light mt-1">{formatCurrency(currentMonthExpenses, currency)}</p>
            </CardContent>
          </Card>
        </div>

        <Card hover className="bg-gradient-to-br from-success/20 to-success/5 border-success/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted font-medium">Available Cash</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(availableCash, currency)}</p>
                <p className="text-xs text-muted mt-1">{accounts.length} accounts</p>
              </div>
              <div className="p-2.5 rounded-xl bg-success/20">
                <DollarSign size={20} className="text-success-light" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-warning/20 to-warning/5 border-warning/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted font-medium">Credit</p>
              <p className="text-lg font-bold text-white">0%</p>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: '0%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cash Flow</CardTitle>
          <div className="flex gap-1">
            {(['30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'text-muted hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: number) => formatCurrency(value, currency)}
              />
              <Area type="monotone" dataKey="income" stroke="#10B981" fill="url(#incomeGradient)" strokeWidth={2} name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="url(#expenseGradient)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error" />
              <span className="text-xs text-muted">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <button onClick={() => onNavigate?.('transactions')} className="text-xs text-primary-light hover:underline">
            View all
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No transactions yet</p>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${txn.type === 'income' ? 'bg-success/20' : 'bg-error/20'}`}>
                      {txn.type === 'income' ? <ArrowUpRight size={14} className="text-success-light" /> : <ArrowDownRight size={14} className="text-error-light" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{txn.description}</p>
                      <p className="text-xs text-muted">{txn.category}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${txn.type === 'income' ? 'text-success-light' : 'text-white'}`}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="primary" className="gap-2" onClick={() => onQuickAction?.('addTransaction')}>
            <Plus size={16} /> Add Transaction
          </Button>
          <Button className="gap-2" onClick={() => onQuickAction?.('payBill')}>
            <CreditCard size={16} /> Pay Bill
          </Button>
          <Button className="gap-2" onClick={() => onQuickAction?.('transfer')}>
            <ArrowUpRight size={16} /> Transfer
          </Button>
        </div>
      )}
    </div>
  )
}