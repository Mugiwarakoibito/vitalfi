import { useState, useEffect, useCallback } from 'react'
import { Wallet, CreditCard, PiggyBank } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { storage, type Account } from '@/lib/storage'
import { AccountList } from '@/components/finance/AccountList'
import { TransactionList } from '@/components/finance/TransactionList'
import { NaturalLanguageInput } from '@/components/finance/NaturalLanguageInput'
import { BudgetDashboard } from '@/components/finance/BudgetDashboard'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { ParsedTransaction } from '@/types/finance'

type Tab = 'accounts' | 'transactions' | 'budgets'

export default function Finance() {
  const [activeTab, setActiveTab] = useState<Tab>('accounts')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { settings } = useAppStore()

  const loadAccounts = useCallback(async () => {
    const data = await storage.getAll('accounts')
    setAccounts(data.filter((a) => !a.isArchived))
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts, refreshKey])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  const handleNaturalLanguageParsed = async (parsed: ParsedTransaction & { raw: string }) => {
    if (parsed.description && parsed.amount > 0) {
      // Default to first account if user hasn't set up accounts yet
      let accountId = accounts[0]?.id
      if (!accountId) {
        // User needs an account first
        return
      }

      const txn = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        description: parsed.description,
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        accountId,
        date: parsed.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await storage.put('transactions', txn)
      setRefreshKey((k) => k + 1)
    }
  }

  const handleTransactionSaved = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Wallet className="h-5 w-5 text-primary-light" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Finance</h2>
            <p className="text-sm text-muted mt-0.5">
              {formatCurrency(totalBalance, settings.currency || 'USD')} across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowTransactionForm(true)}>
          + New Transaction
        </Button>
      </div>

      {/* Natural Language Input */}
      {activeTab === 'transactions' && (
        <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(
          [
            { key: 'accounts' as Tab, label: 'Accounts', icon: CreditCard },
            { key: 'transactions' as Tab, label: 'Transactions', icon: Wallet },
            { key: 'budgets' as Tab, label: 'Budgets', icon: PiggyBank },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 justify-center ${
              activeTab === key
                ? 'bg-primary/15 text-primary-light border border-primary/20'
                : 'text-muted hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && <AccountList />}
      {activeTab === 'transactions' && (
        <TransactionList
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
          onTransactionChange={handleTransactionSaved}
        />
      )}
      {activeTab === 'budgets' && <BudgetDashboard />}

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSave={() => {
          handleTransactionSaved()
          setShowTransactionForm(false)
        }}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  )
}
