import { useState, useMemo } from 'react'
import { Plus, Wallet, PiggyBank, CreditCard, TrendingUp, Banknote, Archive, Pencil, Trash2, AlertTriangle, DollarSign, ArrowUpDown } from 'lucide-react'
import type { Account } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { AccountForm } from './AccountForm'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const accountIcons: Record<Account['type'], typeof Wallet> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  cash: Banknote,
}

export function AccountList({ initialAccounts = [], onAccountChange, showForm: externalShowForm, onCloseForm, onOpenForm }: { initialAccounts?: Account[], onAccountChange?: () => void, showForm?: boolean, onCloseForm?: () => void, onOpenForm?: () => void }) {
  const [showFormState, setShowFormState] = useState(false)
  const showForm = externalShowForm !== undefined ? externalShowForm : showFormState
  const setShowForm = (value: boolean) => {
    if (externalShowForm !== undefined) {
      if (value) onOpenForm?.()
      else onCloseForm?.()
    } else {
      setShowFormState(value)
    }
  }
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const accounts = initialAccounts
  const { settings, addAccount, updateAccount, deleteAccount } = useAppStore()
  const activeAccounts = accounts.filter((a) => !a.isArchived)
  const totalBalance = useMemo(() => activeAccounts.reduce((sum, acc) => sum + acc.balance, 0), [activeAccounts])
  const positiveBalance = activeAccounts.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0)
  const negativeBalance = activeAccounts.filter(a => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0)

  const handleSave = async (account: Account) => {
    const existing = accounts.find(a => a.id === account.id)
    if (existing) await updateAccount(account)
    else await addAccount(account)
    setShowForm(false)
    setEditingAccount(null)
    onAccountChange?.()
  }

  const handleDelete = async () => {
    if (!deletingAccount) return
    await deleteAccount(deletingAccount.id)
    setDeletingAccount(null)
    onAccountChange?.()
  }

  const handleArchive = async (account: Account) => {
    await updateAccount({ ...account, isArchived: true })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Total Net Worth</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalBalance, settings.currency || 'USD')}</p>
            <p className="text-xs text-gray-500 mt-1">{activeAccounts.length} account{activeAccounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green-400/80 text-sm mb-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>Assets</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(positiveBalance, settings.currency || 'USD')}</p>
            <p className="text-xs text-gray-500 mt-1">Positive balances</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <CreditCard className="w-4 h-4" />
              <span>Liabilities</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(negativeBalance, settings.currency || 'USD')}</p>
            <p className="text-xs text-gray-500 mt-1">Negative balances</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Your Accounts</h3>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 hover:bg-emerald-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {activeAccounts.length > 1 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Account Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activeAccounts.map(a => ({ name: a.name, balance: a.balance, type: a.type }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" stroke="#ffffff60" fontSize={10} tickFormatter={(v: number) => `$${v >= 1000 ? `${v/1000}k` : v}`} />
              <YAxis dataKey="name" type="category" stroke="#ffffff60" fontSize={10} width={80} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => formatCurrency(value, settings.currency || 'USD')} />
              <Bar dataKey="balance" radius={[0, 4, 4, 0]} stroke="none">
                {activeAccounts.map((_, index) => (
                  <Cell key={index} fill={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeAccounts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-emerald-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No accounts yet</p>
          <p className="text-gray-500 text-sm">Add your first account to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAccounts.map((account) => {
            const Icon = accountIcons[account.type]
            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: account.color }} />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: account.color + '25', boxShadow: `0 0 20px ${account.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{account.name}</h4>
                      <p className="text-sm text-gray-500 capitalize flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px] capitalize">
                          {account.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-xl font-bold tracking-wide ${account.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {formatCurrency(account.balance, settings.currency || 'USD')}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={(e) => { e.stopPropagation(); setEditingAccount(account) }} className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleArchive(account) }} className="rounded-lg p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeletingAccount(account) }} className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AccountForm isOpen={showForm} onClose={() => setShowForm(false)} onSave={handleSave} />
      <AccountForm isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} onSave={handleSave} account={editingAccount} />

      {deletingAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingAccount(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Account?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingAccount.name}</span> and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingAccount(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}