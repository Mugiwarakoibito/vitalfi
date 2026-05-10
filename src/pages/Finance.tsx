import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, CreditCard, Gem, Calendar, TrendingUp, Plus, Target, Scissors, Skull } from 'lucide-react'
import { type Transaction } from '@/lib/storage'
import { AccountList } from '@/components/finance/AccountList'
import { TransactionList } from '@/components/finance/TransactionList'
import { NaturalLanguageInput } from '@/components/finance/NaturalLanguageInput'
import { BudgetDashboard } from '@/components/finance/BudgetDashboard'
import { TransactionForm } from '@/components/finance/TransactionForm'
import { BillReminders } from '@/components/finance/BillReminders'
import { SubscriptionTracker } from '@/components/finance/SubscriptionTracker'
import { DebtTracker } from '@/components/finance/DebtTracker'
import { InvestmentPortfolio } from '@/components/finance/InvestmentPortfolio'
import { FinancialCalendar } from '@/components/finance/FinancialCalendar'
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'
import type { ParsedTransaction } from '@/types/finance'

type Tab = 'accounts' | 'transactions' | 'budgets' | 'wealth' | 'bills' | 'subscriptions' | 'debts' | 'investments' | 'calendar'

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as Tab | null
  const actionFromUrl = searchParams.get('action')
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || 'transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const { settings, accounts, transactions, loadAllData, addTransaction } = useAppStore()

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    if (actionFromUrl === 'add') {
      if (tabFromUrl === 'wealth') {
        setShowAccountForm(true)
      } else {
        setShowTransactionForm(true)
      }
      setSearchParams({ tab: tabFromUrl || 'transactions' })
    }
  }, [tabFromUrl, actionFromUrl])

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const handleNaturalLanguageParsed = async (parsed: ParsedTransaction & { raw: string }) => {
    if (parsed.description && parsed.amount > 0) {
      const accountId = accounts[0]?.id
      if (!accountId) {
        alert('Please create an account first before adding transactions.')
        return
      }

      const txn: Transaction = {
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

      await addTransaction(txn)
      await loadAllData()
    } else {
      alert('Could not parse: description=' + parsed.description + ', amount=' + parsed.amount)
    }
  }

  const handleTransactionSaved = () => {
    loadAllData()
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-500/10 p-12">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <TrendingUp size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <StreakStatus />
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full animate-ping bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">
              {accounts.length > 0 || transactions.length > 0 ? (
                <span className="text-emerald-400">AI Active</span>
              ) : (
                <span className="text-slate-500">Get Started</span>
              )}
            </h2>
          </div>
        </div>
        <div className="relative z-10 mt-10">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            {accounts.length > 0 || transactions.length > 0 ? (
              <>Financial <span className="text-emerald-500">Hub</span></>
            ) : (
              <>Financial <span className="text-emerald-500">Hub</span></>
            )}
          </h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">
            {accounts.length > 0 || transactions.length > 0 ? (
              <>Your net worth is {formatCurrency(totalBalance, settings.currency || 'USD')} across {accounts.length} account{accounts.length !== 1 ? 's' : ''}.</>
            ) : (
              <>Begin your wealth journey. Add your first account and watch your finances take shape.</>
            )}
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            {accounts.length > 0 && (
              <button onClick={() => { setShowTransactionForm(true); setActiveTab('transactions'); setSearchParams({ tab: 'transactions' }) }} className="glass-card bg-emerald-500/10 border-emerald-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-emerald-500/20 transition-all group">
                <Plus size={20} className="text-emerald-400 group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Transaction</span>
              </button>
            )}
            {accounts.length === 0 ? (
              <button onClick={() => { setShowAccountForm(true); setActiveTab('wealth'); setSearchParams({ tab: 'wealth' }) }} className="glass-card bg-cyan-500/10 border-cyan-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-cyan-500/20 transition-all">
                <Plus size={20} className="text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Account</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        {[
          { id: 'transactions', label: 'Transactions', icon: Wallet },
          { id: 'accounts', label: 'Wealth', icon: CreditCard },
          { id: 'budgets', label: 'Budgets', icon: Target },
          { id: 'bills', label: 'Bills', icon: Scissors },
          { id: 'subscriptions', label: 'Subs', icon: Gem },
          { id: 'debts', label: 'Debts', icon: Skull },
          { id: 'investments', label: 'Invest', icon: TrendingUp },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setSearchParams({ tab: tab.id }) }}
            className={cn(
              "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              activeTab === tab.id 
                ? "bg-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' && (
        <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />
      )}

      {activeTab === 'accounts' && <AccountList initialAccounts={accounts} onAccountChange={() => loadAllData()} />}
      {activeTab === 'transactions' && (
        <TransactionList
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
          initialTransactions={transactions}
          onTransactionChange={handleTransactionSaved}
        />
      )}
      {activeTab === 'budgets' && <BudgetDashboard />}
      {activeTab === 'wealth' && <AccountList initialAccounts={accounts} onAccountChange={() => loadAllData()} showForm={showAccountForm} onCloseForm={() => setShowAccountForm(false)} onOpenForm={() => setShowAccountForm(true)} />}
      {activeTab === 'bills' && <BillReminders />}
      {activeTab === 'subscriptions' && <SubscriptionTracker />}
      {activeTab === 'debts' && <DebtTracker />}
      {activeTab === 'investments' && <InvestmentPortfolio />}
      {activeTab === 'calendar' && <FinancialCalendar initialTransactions={transactions} />}

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