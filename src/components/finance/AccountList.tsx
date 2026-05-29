import { useState, useMemo } from 'react'
import { Plus, Wallet, PiggyBank, CreditCard, TrendingUp, Banknote, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { Account } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { AccountForm } from './AccountForm'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
  const activeAccounts = accounts
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <span>Total Net Worth</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{formatCurrency(totalBalance, settings.currency || 'USD')}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-green-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green-400/80 text-sm mb-2">
              <span>Assets</span>
            </div>
            <p className="text-3xl font-bold text-green-400 drop-shadow-lg">{formatCurrency(positiveBalance, settings.currency || 'USD')}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <span>Liabilities</span>
            </div>
            <p className="text-3xl font-bold text-red-400 drop-shadow-lg">{formatCurrency(negativeBalance, settings.currency || 'USD')}</p>
          </div>
        </div>
      </div>

      {activeAccounts.length === 0 ? (
        <Card className="py-12 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No accounts yet</h4>
          <p className="text-sm text-muted mb-4">Add your first account to start tracking</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Add Account
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div 
            className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-500/10 transition-all min-h-[100px]"
            onClick={() => setShowForm(true)}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-amber-300">Add Account</p>
          </div>
          {activeAccounts.map((account) => {
            const Icon = accountIcons[account.type]
            const isPositive = account.balance >= 0
            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.02] to-transparent pointer-events-none" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg" style={{ backgroundColor: account.color + '25', boxShadow: `0 0 20px ${account.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{account.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px] capitalize">
                          {account.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-sm font-bold tracking-wide px-3 py-1.5 rounded-lg ${isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {formatCurrency(account.balance, settings.currency || 'USD')}
                    </p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={(e) => { e.stopPropagation(); setEditingAccount(account) }} className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
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