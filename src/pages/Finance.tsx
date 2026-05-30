import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, CreditCard, Gem, Calendar, TrendingUp, Plus, Target, PiggyBank } from 'lucide-react'
import { type Transaction } from '@/types/domain'
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
import { FinancialGoals } from '@/components/finance/FinancialGoals'
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'
import type { ParsedTransaction } from '@/types/finance'

type Tab = 'transactions' | 'wealth' | 'budgets' | 'goals' | 'bills' | 'subscriptions' | 'debts' | 'investments' | 'calendar'

export default function Finance() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as Tab | null
  const actionFromUrl = searchParams.get('action')
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || 'transactions')
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showInvestmentForm, setShowInvestmentForm] = useState(false)
  const { settings, accounts, transactions, loadAllData, addTransaction } = useAppStore()

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    if (actionFromUrl === 'add') {
      if (tabFromUrl === 'wealth') {
        setShowAccountForm(true)
      } else if (tabFromUrl === 'goals') {
        setShowGoalForm(true)
      } else if (tabFromUrl === 'investments') {
        setShowInvestmentForm(true)
      } else {
        setShowTransactionForm(true)
      }
      setSearchParams({ tab: tabFromUrl || 'transactions' })
    }
  }, [tabFromUrl])

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0)
  }, [accounts])

  const now = new Date()
  const thisMonthIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0)
  const thisMonthSpending = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0)
  const monthlyCashFlow = thisMonthIncome - thisMonthSpending

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
            <div className={cn("h-2 w-2 rounded-full animate-ping shadow-[0_0_8px_rgba(16,185,129,0.5)]", accounts.length === 0 && transactions.length === 0 ? "bg-slate-500" : monthlyCashFlow >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">
              {accounts.length === 0 && transactions.length === 0 ? (
                <span className="text-slate-500">Get Started</span>
              ) : monthlyCashFlow >= 0 ? (
                <span className="text-emerald-400">+{formatCurrency(monthlyCashFlow, settings.currency || 'USD')} this month</span>
              ) : (
                <span className="text-rose-400">{formatCurrency(monthlyCashFlow, settings.currency || 'USD')} this month</span>
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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none rounded-2xl bg-white/[0.02] border border-white/5 p-1.5">
          {[
            { id: 'transactions', label: 'Transactions', icon: Wallet },
            { id: 'wealth', label: 'Wealth', icon: CreditCard },
            { id: 'budgets', label: 'Budgets', icon: PiggyBank },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'bills', label: 'Bills', icon: Calendar },
            { id: 'subscriptions', label: 'Subs', icon: Gem },
            { id: 'debts', label: 'Debts', icon: CreditCard },
            { id: 'investments', label: 'Invest', icon: TrendingUp },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as Tab); setSearchParams({ tab: tab.id }) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shrink-0 whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-gradient-to-br from-white/15 to-white/5 text-white shadow-[0_0_30px_rgba(255,255,255,0.08)] border border-white/15 backdrop-blur-sm" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon size={14} className="opacity-70" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'transactions' && (
        <NaturalLanguageInput onParsed={handleNaturalLanguageParsed} />
      )}

      {activeTab === 'transactions' && (
        <TransactionList
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
          initialTransactions={transactions}
          onTransactionChange={handleTransactionSaved}
          onOpenForm={() => setShowTransactionForm(true)}
        />
      )}
      {activeTab === 'budgets' && <BudgetDashboard />}
      {activeTab === 'wealth' && <AccountList initialAccounts={accounts} onAccountChange={() => loadAllData()} showForm={showAccountForm} onCloseForm={() => setShowAccountForm(false)} onOpenForm={() => setShowAccountForm(true)} />}
      {activeTab === 'bills' && <BillReminders />}
      {activeTab === 'subscriptions' && <SubscriptionTracker />}
      {activeTab === 'debts' && <DebtTracker />}
      {activeTab === 'investments' && <InvestmentPortfolio initialShow={showInvestmentForm} onCloseForm={() => setShowInvestmentForm(false)} />}
      {activeTab === 'goals' && <FinancialGoals initialShow={showGoalForm} />}
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