import { motion } from 'framer-motion'
import { 
  TrendingUp, Target, ShieldCheck, ArrowUpRight, 
  ArrowDownRight, Landmark, PieChart,
  Zap, Calendar, Plus, Wallet, Flag
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { Button } from '@/components/ui/Button'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export function FinanceDashboard() {
  const navigate = useNavigate()
  const { settings, accounts, transactions, investments, goals } = useAppStore()
  const currency = settings.currency || 'USD'
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const netWorth = accounts.reduce((s, a) => s + a.balance, 0)
  
// Calculate this month's income - only count 'income' type
  const thisMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const d = new Date(t.date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return sum + t.amount
      }
      return sum
    }, 0)
  
  // Calculate this month's expenses - only count 'expense' type  
  const thisMonthSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const d = new Date(t.date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return sum + t.amount
      }
      return sum
    }, 0)
  
  // Calculate last month's income
  const lastMonthIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => {
      const d = new Date(t.date)
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        return sum + t.amount
      }
      return sum
    }, 0)
  
  // Calculate last month's expenses
  const lastMonthSpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => {
      const d = new Date(t.date)
      if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        return sum + t.amount
      }
      return sum
    }, 0)
  
  const cashFlow = thisMonthIncome - thisMonthSpending
  const lastMonthCashFlow = lastMonthIncome - lastMonthSpending
  
  const investmentAccounts = accounts.filter(a => a.type === 'investment')
  const investmentAccountTotal = investmentAccounts.reduce((s, a) => s + a.balance, 0)
  const investmentHoldingsValue = investments.reduce((s, i) => s + (i.currentPrice * i.quantity), 0)
  const investmentTotal = investmentAccountTotal + investmentHoldingsValue
  
  // Calculate spending health (savings rate this month)
  const spendingHealth = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthSpending) / thisMonthIncome) * 100) : (thisMonthSpending > 0 ? -100 : 0)
  const lastMonthSpendingHealth = lastMonthIncome > 0 ? Math.round(((lastMonthIncome - lastMonthSpending) / lastMonthIncome) * 100) : (lastMonthSpending > 0 ? -100 : 0)
  
  // Calculate changes 
  let cashFlowChangeStr = ""
  let spendingHealthChange = 0
  const hasLastMonthData = lastMonthIncome > 0 || lastMonthSpending > 0
  
  if (hasLastMonthData && lastMonthCashFlow !== 0 && cashFlow !== 0) {
    const cashFlowChange = Math.round(((cashFlow - lastMonthCashFlow) / Math.abs(lastMonthCashFlow)) * 100)
    cashFlowChangeStr = `${cashFlowChange > 0 ? '+' : ''}${cashFlowChange}%`
  } else if (hasLastMonthData && lastMonthCashFlow === 0 && cashFlow !== 0) {
    cashFlowChangeStr = cashFlow > 0 ? `+${formatCurrency(cashFlow, currency)}` : formatCurrency(cashFlow, currency)
  }
  
  spendingHealthChange = hasLastMonthData ? spendingHealth - lastMonthSpendingHealth : 0
  const spendingHealthChangeStr = hasLastMonthData ? `${spendingHealthChange > 0 ? '+' : ''}${spendingHealthChange}%` : ""
  
  // Chart state
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('30d')
  
  // Spending trend data
  const spendingTrend = useMemo(() => {
    const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90
    const result: { date: string; expenses: number }[] = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0)
      result.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        expenses: dayExpenses
      })
    }
    return result
  }, [transactions, chartRange])
  
  // Calculate data-driven score (0-100)
  let score = 0
  let status = "No Data"
  let message = "Add accounts and transactions to see your financial health score."
  
  // Only calculate score if there's meaningful financial data (accounts with balance + transactions)
  const hasAccountsWithBalance = accounts.length > 0 && netWorth > 0
  const hasTransactionsData = transactions.length > 0
  const hasMeaningfulData = hasAccountsWithBalance && hasTransactionsData
  
  if (hasMeaningfulData) {
    const activityScore = Math.min(transactions.length * 2, 30)
    const accountScore = Math.min(accounts.length * 8, 20)
    const balanceScore = netWorth > 0 ? Math.min(netWorth / 1000, 25) : 0
    const cashflowScore = cashFlow > 0 ? Math.min(cashFlow / 100, 15) : 0
    const investmentScore = investmentTotal > 0 ? Math.min(investmentTotal / 2000, 10) : 0
    
    score = Math.min(Math.round(activityScore + accountScore + balanceScore + cashflowScore + investmentScore), 100)
    
    if (score >= 80) {
      status = "Excellent"
      message = "Your finances are thriving! Strong income, healthy savings, and great cash flow."
    } else if (score >= 60) {
      status = "Good"
      message = "You're on the right track. Keep building your wealth."
    } else if (score >= 40) {
      status = "Fair"
      message = "Room to grow. Consider increasing income or reducing expenses."
    } else {
      status = "Needs Work"
      message = "Focus on building your financial foundation."
    }
  }
  
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-12">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Wallet size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
          <StreakStatus />
          <div className="flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full", transactions.length > 0 || accounts.length > 0 ? "bg-emerald-400 animate-ping" : "bg-slate-400")} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">
              {transactions.length === 0 && accounts.length === 0 ? (
                <span className="text-slate-500">Get Started</span>
              ) : cashFlow > 0 ? (
                <span className="text-emerald-400">Money Flow: Positive</span>
              ) : cashFlow < 0 ? (
                <span className="text-rose-400">Money Flow: Negative</span>
              ) : (
                <span className="text-emerald-400">Money Status: On Track</span>
              )}
            </h2>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
            {accounts.length > 0 || transactions.length > 0 ? (
              <>Master your <span className="gradient-text">Money.</span></>
            ) : (
              <>Build your <span className="gradient-text">Wealth.</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl font-medium">
            {accounts.length === 0 && transactions.length === 0 ? (
              <>Begin your wealth journey. Add your first account and watch your finances take shape.</>
            ) : accounts.length > 0 && netWorth > 0 ? (
              <>Your net worth is <span className="text-emerald-400 font-bold">{formatCurrency(netWorth, currency)}</span>. Keep tracking to grow your wealth!</>
            ) : transactions.length > 0 ? (
              <>You've logged <span className="text-cyan-400 font-bold">{transactions.length}</span> transactions this month. Keep it up!</>
            ) : (
              <>Your finance setup is looking great. Keep tracking your spending and investments to grow your wealth.</>
            )}
          </p>
          <div className="flex flex-wrap gap-4">
            {!accounts.length ? (
              <button 
                onClick={() => navigate('/finance?tab=wealth&action=add')}
                className="glass-card bg-cyan-500/10 border-cyan-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-cyan-500/20 transition-all group"
              >
                <Plus size={20} className="text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Account</span>
              </button>
            ) : (
              <button 
                onClick={() => navigate('/finance?tab=transactions&action=add')}
                className="glass-card bg-emerald-500/10 border-emerald-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-emerald-500/20 transition-all group"
              >
                <Plus size={20} className="text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Transaction</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/finance?tab=investments')}
              className="glass-card bg-white/5 border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all"
            >
              <Target size={20} className="text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Investments</span>
            </button>
          </div>
        </div>
      </section>

      {/* Primary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          onClick={() => navigate('/finance/wealth')}
          label="Net Worth" 
          value={formatCurrency(netWorth, currency)} 
          trend={accounts.length > 0 ? (lastMonthIncome > 0 || lastMonthSpending > 0 ? "History" : "Start") : "No Data"}
          positive={netWorth > 0}
          icon={ShieldCheck} 
          color="cyan" 
        />
        <MetricCard 
          onClick={() => navigate('/finance?tab=flow')}
          label="In vs Out" 
          value={formatCurrency(cashFlow, currency)} 
          trend={transactions.length > 0 && cashFlowChangeStr ? cashFlowChangeStr : (transactions.length > 0 ? "No Last Month" : "No Data")}
          positive={cashFlow >= 0}
          icon={TrendingUp} 
          color="emerald" 
        />
        <MetricCard 
          onClick={() => navigate('/finance?tab=spending')}
          label="Spending Health" 
          value={thisMonthIncome > 0 || thisMonthSpending > 0 ? `${spendingHealth}%` : thisMonthSpending > 0 ? "-100%" : "N/A"} 
          trend={transactions.length > 0 && spendingHealthChangeStr ? spendingHealthChangeStr : (transactions.length > 0 ? "No Last Month" : "No Data")}
          positive={spendingHealth >= 0}
          icon={PieChart} 
          color="purple" 
        />
        <MetricCard 
          onClick={() => navigate(goals.filter(g => g.type === 'financial').length > 0 ? '/finance?tab=goals' : '/finance?tab=goals&action=add')}
          label="Financial Goals" 
          value={goals.filter(g => g.type === 'financial').length > 0 ? `${goals.filter(g => g.type === 'financial').length} Goals` : "No Goals"} 
          trend={goals.filter(g => g.type === 'financial').length > 0 ? `Total: ${formatCurrency(goals.filter(g => g.type === 'financial').reduce((sum, g) => sum + g.current, 0), currency)}` : "Add your first goal"}
          positive={goals.filter(g => g.type === 'financial').length > 0}
          icon={Flag} 
          color="amber"
          showVsLastMonth={false}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 border-white/5 h-[400px] relative overflow-hidden group">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Spending Speed</h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Daily Money Activity</p>
                </div>
                <div className="flex gap-1">
                   {(['7d', '30d', '90d'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setChartRange(r)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          chartRange === r 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'text-muted hover:text-white border border-transparent'
                        }`}
                      >
                        {r === '7d' ? '7D' : r === '30d' ? '1M' : '3M'}
                      </button>
                   ))}
                </div>
             </div>
             
             {/* Interactive Chart */}
             {spendingTrend.length > 0 && spendingTrend.some(d => d.expenses > 0) ? (
               <ResponsiveContainer width="100%" height={280}>
                 <AreaChart data={spendingTrend}>
                   <defs>
                     <linearGradient id="spendingGradientDash" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                       <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                   <XAxis 
                     dataKey="date" 
                     stroke="#ffffff60" 
                     fontSize={10} 
                     tickLine={false}
                   />
                   <YAxis 
                     stroke="#ffffff60" 
                     fontSize={10} 
                     tickFormatter={(v: number) => formatCurrency(v, currency)}
                     tickLine={false}
                     axisLine={false}
                   />
                   <Tooltip
                     contentStyle={{ 
                       backgroundColor: '#0f172a', 
                       border: '1px solid rgba(255,255,255,0.1)',
                       borderRadius: '8px',
                       fontSize: '12px'
                     }}
                     labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                     formatter={(value: number) => [formatCurrency(value, currency), 'Spent']}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="expenses" 
                     stroke="#EF4444" 
                     fill="url(#spendingGradientDash)" 
                     strokeWidth={2}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                     <p className="text-4xl font-black text-white">
                       {formatCurrency(thisMonthSpending, currency)}
                     </p>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">spent this month</p>
                  </div>
               </div>
             )}
          </div>
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Accounts */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Distribution</h3>
                    <button onClick={() => navigate('/finance?tab=wealth')} className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter hover:underline">See All</button>
                 </div>
                 <div className="space-y-2">
                    {accounts.length === 0 ? (
                      <div className="glass-card p-6 text-center border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase">No accounts linked</p>
                      </div>
                    ) : (
                      accounts.slice(0, 3).map(acc => {
                        const percentage = netWorth > 0 ? (acc.balance / netWorth) * 100 : 0
                        return (
                         <div key={acc.id} onClick={() => navigate('/finance/accounts')} className="glass-card p-4 border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer group">
                            <div className="flex items-center justify-between mb-2">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg" style={{ backgroundColor: acc.color + '20', color: acc.color }}>
                                     <Landmark size={16} />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-white">{acc.name}</p>
                                     <p className="text-[10px] font-bold text-slate-500 uppercase">{acc.type}</p>
                                  </div>
                               </div>
                               <p className="text-sm font-black text-white">{formatCurrency(acc.balance, currency)}</p>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%`, backgroundColor: acc.color }}
                               />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 text-right">{percentage.toFixed(1)}%</p>
                         </div>
                      )
                      })
                    )}
                 </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Recent Spending</h3>
                    <button onClick={() => navigate('/finance?tab=transactions')} className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter hover:underline">Full History</button>
                 </div>
                 <div className="glass-card border-white/5 overflow-hidden">
                    {transactions.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-slate-500 text-[10px] font-bold uppercase">No transactions yet</p>
                      </div>
                    ) : (
                      transactions.slice(0, 4).map(txn => (
<div key={txn.id} onClick={() => navigate('/finance/transactions')} className="p-4 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "p-2 rounded-xl border transition-all",
                                 txn.type === 'income' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : txn.type === 'transfer' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                               )}>
                                  {txn.type === 'income' ? <ArrowUpRight size={14} /> : txn.type === 'transfer' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{txn.description}</p>
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{txn.type === 'transfer' ? 'Transfer' : txn.category}</p>
                               </div>
                            </div>
<p className={cn("text-sm font-black tracking-tighter", txn.type === 'income' ? "text-emerald-400" : txn.type === 'transfer' ? "text-purple-400" : "text-red-400")}>
                               {txn.type === 'income' ? '+' : txn.type === 'transfer' ? '' : '-'}{formatCurrency(txn.amount, currency)}
                             </p>
                         </div>
                      ))
                    )}
                 </div>
              </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           {/* Financial Health Score */}
           <div className="glass-card p-8 border-white/5 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Zap size={150} />
              </div>
<div className="text-center space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Your Score</p>
                  <div className="relative inline-flex items-center justify-center">
                     <svg className="w-40 h-40 transform -rotate-90">
                        <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                        <motion.circle 
                          cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" 
                          strokeDasharray={465}
                          initial={{ strokeDashoffset: 465 }}
                          animate={{ strokeDashoffset: score === 0 ? 465 : 465 - (465 * score) / 100 }}
                          transition={{ duration: 2 }}
                          className={cn(score === 0 ? "text-slate-600" : score >= 60 ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" : score >= 40 ? "text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]")}
                          strokeLinecap="round"
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-black text-white tracking-tighter">{score === 0 ? "--" : score}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">{status}</span>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-xs font-bold text-white uppercase tracking-tight">Status: {status}</p>
                     {score > 0 ? (
                       <p className="text-[10px] text-slate-500 leading-relaxed px-4">{message}</p>
                     ) : (
                       <p className="text-[10px] text-slate-600 leading-relaxed px-4">Add accounts with balance + transactions to see your score</p>
                     )}
                  </div>
               </div>
           </div>

            {/* Upcoming Commitments */}
            <div className="glass-card p-6 border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming Bills</h3>
                  <Calendar size={14} className="text-slate-600" />
               </div>
               <div className="space-y-4">
                  {useAppStore.getState().bills.length === 0 ? (
                    <div className="py-4 text-center">
                       <p className="text-[10px] font-bold text-slate-600 uppercase">No upcoming bills</p>
                    </div>
                  ) : (
                    useAppStore.getState().bills.slice(0, 3).map(item => (
                       <div key={item.id} onClick={() => navigate('/finance/bills')} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-2 w-2 rounded-full",
                               item.isPaid ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,180,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                             )} />
                             <p className="text-xs font-bold text-white">{item.name}</p>
                          </div>
                          <p className="text-xs font-bold text-slate-500">MAD {item.amount.toFixed(0)}</p>
                       </div>
                    ))
                  )}
                  {useAppStore.getState().bills.length > 3 && (
                    <button onClick={() => navigate('/finance?tab=bills')} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">
                       +{useAppStore.getState().bills.length - 3} more
                    </button>
                  )}
               </div>
               <Button variant="ghost" size="sm" onClick={() => navigate('/finance?tab=bills')} className="w-full">
                  View All Bills
               </Button>
            </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, trend, positive, icon: Icon, color, onClick, showVsLastMonth = true }: any) {
  const hasData = trend && trend !== 'No Data' && trend !== 'First Month' && trend !== 'Start' && trend !== 'History' && trend !== 'No Last Month' && trend !== 'Add your first goal'
  const colorMap = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
  }
  
  return (
    <div onClick={onClick} className="glass-card p-6 border-white/5 group hover:border-white/10 transition-all cursor-pointer relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity", colorMap[color as keyof typeof colorMap].split(' ')[0])}>
        <Icon size={40} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">{label}</p>
      <div className="space-y-1">
        <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        {hasData && (
          <div className="flex items-center gap-1.5">
            <span className={cn("text-[10px] font-bold uppercase", positive ? "text-emerald-400" : "text-rose-500")}>
              {trend}
            </span>
            {showVsLastMonth && <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter">vs Last Month</span>}
          </div>
        )}
      </div>
    </div>
  )
}