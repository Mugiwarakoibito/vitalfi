import { useState, useEffect, useMemo } from 'react'
import { Plus, Wallet, PiggyBank, CreditCard, TrendingUp, Banknote, Archive, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { storage, type Account } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { AccountForm } from './AccountForm'
import { Modal } from '@/components/ui/Modal'

const accountIcons: Record<Account['type'], typeof Wallet> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
  cash: Banknote,
}

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useAppStore()

  const loadAccounts = async () => {
    try {
      const data = await storage.getAll('accounts')
      setAccounts(data.filter((a) => !a.isArchived))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const handleSave = async (account: Account) => {
    await storage.put('accounts', account)
    await loadAccounts()
    setShowForm(false)
    setEditingAccount(null)
  }

  const handleDelete = async () => {
    if (!deletingAccount) return
    await storage.delete('accounts', deletingAccount.id)
    await loadAccounts()
    setDeletingAccount(null)
  }

  const handleArchive = async (account: Account) => {
    await storage.put('accounts', { ...account, isArchived: true })
    await loadAccounts()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card h-20 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Total Net Worth</p>
          <p className="text-3xl font-bold text-white mt-1">
            {formatCurrency(totalBalance, settings.currency || 'USD')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-1.5" />
          Add Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card className="py-12 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No accounts yet</h4>
          <p className="text-sm text-muted mb-4">Add your first account to start tracking</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Add Account
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const Icon = accountIcons[account.type]
            return (
              <Card
                key={account.id}
                hover
                className="group relative overflow-hidden cursor-pointer"
                onClick={() => setEditingAccount(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${account.color}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{account.name}</h4>
                      <p className="text-xs text-muted capitalize">{account.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(account.balance, settings.currency || 'USD')}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingAccount(account)
                        }}
                        className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchive(account)
                        }}
                        className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingAccount(account)
                        }}
                        className="rounded-lg p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ backgroundColor: account.color }}
                />
              </Card>
            )
          })}
        </div>
      )}

      <AccountForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
      />

      <AccountForm
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSave={handleSave}
        account={editingAccount}
      />

      <Modal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title="Delete Account?"
        className="max-w-sm"
      >
        <p className="text-muted text-sm mb-5">
          This will permanently delete <strong className="text-white">{deletingAccount?.name}</strong> and all
          associated data. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeletingAccount(null)} className="flex-1">
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
