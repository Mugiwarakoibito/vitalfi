import { useState, useMemo } from 'react'
import { Search, Filter, X, ArrowUpDown, Receipt, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { type Transaction as DBTransaction, type Transaction } from '@/lib/storage'
import { formatCurrency, cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { ALL_CATEGORIES, getCategoryByName } from '@/lib/categories'
import { TransactionForm } from './TransactionForm'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TransactionListProps {
  accounts: { id: string; name: string; color: string }[]
  initialTransactions?: Transaction[]
  onTransactionChange?: () => void
}

export function TransactionList({ accounts, initialTransactions = [], onTransactionChange }: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [editingTransaction, setEditingTransaction] = useState<DBTransaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<DBTransaction | null>(null)
  const { settings, deleteTransaction, addTransaction, updateTransaction } = useAppStore()

  // Use initial transactions passed in, or fall back to store if empty
  const transactions = useMemo(() => {
    if (initialTransactions.length > 0) return initialTransactions
    return []
  }, [initialTransactions])

  const filtered = useMemo(() => {
    let result = [...transactions]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }

    if (filterAccount) result = result.filter((t) => t.accountId === filterAccount)
    if (filterCategory) result = result.filter((t) => t.category === filterCategory)
    if (filterType) result = result.filter((t) => t.type === filterType)

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount
      } else {
        cmp = a.description.localeCompare(b.description)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [transactions, searchQuery, filterAccount, filterCategory, filterType, sortField, sortDir])

  // Daily spending trend
  const spendingTrend = useMemo(() => {
    const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90
    const now = new Date()
    const data: { date: string; expenses: number }[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayExpenses = transactions
        .filter(t => t.date.startsWith(dateStr) && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expenses: dayExpenses
      })
    }
    return data.filter(d => d.expenses > 0)
  }, [transactions, chartRange])

  const handleDelete = async () => {
    if (!deletingTransaction) return
    await deleteTransaction(deletingTransaction.id)
    onTransactionChange?.()
    setDeletingTransaction(null)
  }

  const handleSave = async (txn: DBTransaction | DBTransaction[]) => {
    if (Array.isArray(txn)) {
      for (const t of txn) {
        const existing = transactions.find(ex => ex.id === t.id)
        if (existing) {
          await updateTransaction(t)
        } else {
          await addTransaction(t)
        }
      }
    } else {
      const existing = transactions.find(ex => ex.id === txn.id)
      if (existing) {
        await updateTransaction(txn)
      } else {
        await addTransaction(txn)
      }
    }
    onTransactionChange?.()
    setEditingTransaction(null)
  }

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalTransfer = filtered.filter((t) => t.type === 'transfer').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Search & filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter size={16} />
            {(filterAccount || filterCategory || filterType) && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {showFilters && (
          <Card padding="md" className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Account</label>
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">All accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">All categories</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="glass-input w-full text-sm py-2"
                >
                  <option value="">All types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              {(filterAccount || filterCategory || filterType) && (
                <Button size="sm" variant="ghost" onClick={() => { setFilterAccount(''); setFilterCategory(''); setFilterType('') }}>
                  Clear
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
                <span>Income</span>
              </div>
              <p className="text-3xl font-bold text-emerald-400">+{formatCurrency(totalIncome, settings.currency || 'USD')}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
                <span>Expenses</span>
              </div>
              <p className="text-3xl font-bold text-red-400">-{formatCurrency(totalExpense, settings.currency || 'USD')}</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
                <span>Transfers</span>
              </div>
              <p className="text-3xl font-bold text-purple-400">{formatCurrency(totalTransfer, settings.currency || 'USD')}</p>
            </div>
          </div>
        </div>

        {/* Spending Trend Chart */}
        {spendingTrend.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Spending Trend</h3>
              <div className="flex gap-1">
                {(['7d', '30d', '90d'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                      chartRange === r 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'text-muted hover:text-white border border-transparent'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={spendingTrend}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff60" fontSize={10} />
                <YAxis stroke="#ffffff60" fontSize={10} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value, settings.currency || 'USD'), 'Spent']}
                />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="url(#spendingGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-muted" />
          {(['date', 'amount', 'description'] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                if (sortField === f) {
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortField(f)
                  setSortDir('desc')
                }
              }}
              className={`text-xs rounded-lg px-2.5 py-1 font-medium border transition-all ${
                sortField === f
                  ? 'border-primary/30 bg-primary/10 text-primary-light'
                  : 'border-white/[0.06] text-muted hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {sortField === f && (sortDir === 'asc' ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-emerald-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No transactions</p>
          <p className="text-gray-500 text-sm">Add your first transaction to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((txn) => {
            const cat = getCategoryByName(txn.category)
            const account = accounts.find((a) => a.id === txn.accountId)

            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-lg"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}25` : 'rgba(107,114,128,0.15)',
                        color: cat?.color || '#9CA3AF',
                        boxShadow: cat?.color ? `0 0 20px ${cat.color}20` : 'none',
                      }}
                    >
                      {txn.description.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white tracking-tight">{txn.description}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]">
                          {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{account?.name ?? 'Unknown'}</span>
                        <span className="text-gray-600">•</span>
                        <span className={cn(
                          txn.type === 'expense' ? 'text-red-400/80' : 
                          txn.type === 'income' ? 'text-emerald-400/80' : 'text-purple-400/80'
                        )}>
                          {txn.type === 'transfer' ? 'Transfer' : txn.category}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={cn(
                      'text-sm font-bold tracking-wide px-3 py-1.5 rounded-lg',
                      txn.type === 'income' ? 'text-emerald-400 bg-emerald-500/10' : 
                      txn.type === 'transfer' ? 'text-purple-400 bg-purple-500/10' : 'text-red-400 bg-red-500/10'
                    )}>
                      {txn.type === 'income' ? '+' : txn.type === 'transfer' ? '' : '-'}{formatCurrency(txn.amount, settings.currency || 'USD')}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => setEditingTransaction(txn)}
                        className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(txn)}
                        className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TransactionForm
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSave={handleSave}
        accounts={accounts}
        transaction={editingTransaction}
      />

      <Modal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        title="Delete Transaction?"
        className="max-w-sm"
      >
        <p className="text-muted text-sm mb-5">
          Delete <strong className="text-white">{deletingTransaction?.description}</strong> for{' '}
          {deletingTransaction && formatCurrency(deletingTransaction.amount)}?
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeletingTransaction(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
