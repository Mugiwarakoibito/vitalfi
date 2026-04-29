import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, X, ArrowUpDown, Receipt, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { storage, type Transaction as DBTransaction } from '@/lib/storage'
import { formatCurrency, cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { ALL_CATEGORIES, getCategoryByName } from '@/lib/categories'
import { TransactionForm } from './TransactionForm'

interface TransactionListProps {
  accounts: { id: string; name: string; color: string }[]
  onTransactionChange?: () => void
}

export function TransactionList({ accounts, onTransactionChange }: TransactionListProps) {
  const [transactions, setTransactions] = useState<DBTransaction[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<'date' | 'amount' | 'description'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editingTransaction, setEditingTransaction] = useState<DBTransaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<DBTransaction | null>(null)
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set())
  const { settings } = useAppStore()

  const loadTransactions = useCallback(async () => {
    const data = await storage.getAll('transactions')
    setTransactions(data)
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Duplicate detection: same amount + similar description within 7 days
  useEffect(() => {
    const dupSet = new Set<string>()
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const a = transactions[i]
        const b = transactions[j]
        if (
          a.amount === b.amount &&
          a.type === b.type &&
          a.description.toLowerCase().includes(b.description.toLowerCase().split(' ')[0]) ||
          b.description.toLowerCase().includes(a.description.toLowerCase().split(' ')[0])
        ) {
          const dateDiff = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime())
          if (dateDiff <= 7 * 24 * 60 * 60 * 1000) {
            dupSet.add(a.id)
            dupSet.add(b.id)
          }
        }
      }
    }
    setDuplicates(dupSet)
  }, [transactions])

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

  const handleDelete = async () => {
    if (!deletingTransaction) return
    await storage.delete('transactions', deletingTransaction.id)
    await loadTransactions()
    onTransactionChange?.()
    setDeletingTransaction(null)
  }

  const handleSave = async (txn: DBTransaction | DBTransaction[]) => {
    if (Array.isArray(txn)) {
      for (const t of txn) {
        await storage.put('transactions', t)
      }
    } else {
      await storage.put('transactions', txn)
    }
    await loadTransactions()
    onTransactionChange?.()
    setEditingTransaction(null)
  }

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Search & filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
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
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-muted">Income</p>
            <p className="text-lg font-bold text-emerald-400">+{formatCurrency(totalIncome, settings.currency || 'USD')}</p>
          </div>
          <div className="glass-card rounded-xl p-3">
            <p className="text-xs text-muted">Expenses</p>
            <p className="text-lg font-bold text-red-400">-{formatCurrency(totalExpense, settings.currency || 'USD')}</p>
          </div>
        </div>

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
        <Card className="py-12 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No transactions</h4>
          <p className="text-sm text-muted">Add your first transaction to get started</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((txn) => {
            const cat = getCategoryByName(txn.category)
            const account = accounts.find((a) => a.id === txn.accountId)
            const isDup = duplicates.has(txn.id)

            return (
              <Card
                key={txn.id}
                hover
                className={cn(
                  'group relative',
                  isDup && 'border-amber-500/25 bg-amber-500/[0.03]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-sm"
                      style={{
                        backgroundColor: cat?.color ? `${cat.color}18` : 'rgba(107,114,128,0.12)',
                        color: cat?.color || '#9CA3AF',
                      }}
                    >
                      {txn.description.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white">{txn.description}</p>
                        {isDup && (
                          <span className="flex items-center gap-0.5 text-amber-400 text-[10px] font-medium bg-amber-500/15 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle size={10} />
                            Duplicate
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' • '}
                        {account?.name ?? 'Unknown'}
                        {' • '}
                        {txn.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        txn.type === 'income' ? 'text-emerald-400' : 'text-white'
                      )}
                    >
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, settings.currency || 'USD')}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTransaction(txn)}
                        className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-white/[0.06]"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingTransaction(txn)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
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
