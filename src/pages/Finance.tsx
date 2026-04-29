import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Wallet, CreditCard, PiggyBank, TrendingUp, Calendar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { storage, type Account } from '@/lib/storage'
import { AccountList } from '@/components/finance/AccountList'
import { TransactionList } from '@/components/finance/TransactionList'
import { NaturalLanguageInput } from '@/components/finance/NaturalLanguageInput'
import { BudgetDashboard } from '@/components/finance/BudgetDashboard'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { InvestmentPortfolio } from '@/components/finance/InvestmentPortfolio'
import { BillReminders } from '@/components/finance/BillReminders'
import { DebtTracker } from '@/components/finance/DebtTracker'
import { SubscriptionTracker } from '@/components/finance/SubscriptionTracker'
import { formatCurrency } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { ParsedTransaction } from '@/types/finance'

type Tab = 'accounts' | 'transactions' | 'budgets' | 'investments' | 'bills' | 'debts' | 'subscriptions'

const tabLabels: Record<Tab, string> = {
  accounts: 'Accounts',
  transactions: 'Transactions',
  budgets: 'Budgets',
  investments: 'Investments',
  bills: 'Bills',
  subscriptions: 'Subscriptions',
  debts: 'Debts',
}

type FinanceProps = {
  defaultTab?: Tab
}

export default function Finance({ defaultTab = 'accounts' }: FinanceProps) {
  const location = useLocation()
  const isStandalone = location.pathname !== '/finance'
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (isStandalone) {
      const path = location.pathname.split('/finance/')[1]
      if (path && path !== '') return path as Tab
    }
    return defaultTab
  })

  useEffect(() => {
    if (isStandalone) {
      const path = location.pathname.split('/finance/')[1]
      if (path && path !== '') {
        setActiveTab(path as Tab)
      }
    }
  }, [location.pathname, isStandalone])
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
      let accountId = accounts[0]?.id
      if (!accountId) return

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Wallet className="h-5 w-5 text-primary-light" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isStandalone ? tabLabels[activeTab] : 'Financial'}
            </h2>
            {!isStandalone && (
              <p className="text-sm text-muted mt-0.5">
                {formatCurrency(totalBalance, settings.currency || 'USD')} across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        {activeTab === 'transactions' && (
          <Button variant="primary" size="sm" onClick={() => setShowTransactionForm(true)}>
            + New Transaction
          </Button>
        )}
      </div>

      {activeTab === 'transactions' && (
        <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />
      )}

      {!isStandalone && (
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 overflow-x-auto">
          {Object.entries(tabLabels).map(([key, label]) => {
            const icons: Record<Tab, React.ReactNode> = {
              accounts: <CreditCard size={16} />,
              transactions: <Wallet size={16} />,
              budgets: <PiggyBank size={16} />,
              investments: <TrendingUp size={16} />,
              bills: <Calendar size={16} />,
              subscriptions: <RefreshCw size={16} />,
              debts: <CreditCard size={16} />,
            }
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as Tab)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-primary/15 text-primary-light border border-primary/20'
                    : 'text-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {icons[key as Tab]}
                {label}
              </button>
            )
          })}
        </div>
      )}

      {activeTab === 'accounts' && <AccountList />}
      {activeTab === 'transactions' && (
        <TransactionList
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
          onTransactionChange={handleTransactionSaved}
        />
      )}
      {activeTab === 'budgets' && <BudgetDashboard />}
      {activeTab === 'investments' && <InvestmentPortfolio />}
      {activeTab === 'bills' && <BillReminders />}
      {activeTab === 'subscriptions' && <SubscriptionTracker />}
      {activeTab === 'debts' && <DebtTracker />}

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
