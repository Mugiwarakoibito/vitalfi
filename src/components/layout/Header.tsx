import { Bell, Search, Menu, LogOut, Wallet, Dumbbell, Columns, User, Trash2, Heart } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const navigate = useNavigate()
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const { user, appMode, isSplitView, setSplitView, toggleAppMode, transactions, accounts, bills, investments, goals, budgets, workouts, subscriptions, bodyMetrics, hydration, sleep, debts, clearAllData, setLicensed, setOnboarded } = useAppStore()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchResults = searchQuery.length > 0 ? [
    ...(transactions || []).filter((t: any) => t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || String(t.amount).includes(searchQuery)).slice(0, 3).map((t: any) => ({ type: 'transaction', data: t, label: t.description || 'Transaction', sublabel: `MAD ${t.amount}` })),
    ...(accounts || []).filter((a: any) => a.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map((a: any) => ({ type: 'account', data: a, label: a.name, sublabel: `MAD ${a.balance}` })),
    ...(budgets || []).filter((b: any) => b.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map((b: any) => ({ type: 'budget', data: b, label: b.name, sublabel: `MAD ${b.spent}/${b.limit}` })),
    ...(bills || []).filter((b: any) => b.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map((b: any) => ({ type: 'bill', data: b, label: b.name, sublabel: `MAD ${b.amount}` })),
    ...(investments || []).filter((i: any) => i.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map((i: any) => ({ type: 'investment', data: i, label: i.name, sublabel: `${i.quantity} shares` })),
    ...(goals || []).filter((g: any) => g.name?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 2).map((g: any) => ({ type: 'goal', data: g, label: g.name, sublabel: `MAD ${g.current}/${g.target}` })),
  ] : []

  const handleSearchClick = (result: any) => {
    setShowSearchResults(false)
    setSearchQuery('')
    if (result.type === 'transaction') navigate('/finance?tab=transactions')
    else if (result.type === 'account') navigate('/finance?tab=wealth')
    else if (result.type === 'budget') navigate('/finance?tab=budgets')
    else if (result.type === 'bill') navigate('/finance?tab=bills')
    else if (result.type === 'investment') navigate('/finance?tab=investments')
    else if (result.type === 'goal') navigate('/finance?tab=goals')
  }

  const handleSignOut = async () => {
    setLicensed(false)
    setOnboarded(false)
    setShowUserMenu(false)
    localStorage.removeItem('lifesync_license_email')
    localStorage.removeItem('lifesync_user_name')
    navigate('/')
  }

  const today = new Date()
  const billsData = Array.isArray(bills) ? bills : []
  const budgetsData = Array.isArray(budgets) ? budgets : []
  const goalsData = Array.isArray(goals) ? goals : []
  const accountsData = Array.isArray(accounts) ? accounts : []
  const transactionsData = Array.isArray(transactions) ? transactions : []
  const subscriptionsData = Array.isArray(subscriptions) ? subscriptions : []
  const workoutsData = Array.isArray(workouts) ? workouts : []
  const bodyMetricsData = Array.isArray(bodyMetrics) ? bodyMetrics : []
  const hydrationData = Array.isArray(hydration) ? hydration : []
  const sleepData = Array.isArray(sleep) ? sleep : []

  const notifications: any[] = [
    // === FINANCE NOTIFICATIONS ===
    // Bills due soon
    ...billsData.filter((b: any) => {
      try {
        const dueDate = new Date(b.dueDate)
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return !b.isPaid && daysUntilDue <= 7 && daysUntilDue >= 0
      } catch { return false }
    }).slice(0, 2).map((b: any) => {
      const dueDate = new Date(b.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: `bill-${b.id}`,
        title: daysUntilDue === 0 ? 'Bill due today!' : `Bill due in ${daysUntilDue} day`,
        subtitle: `${b.name} - MAD ${b.amount || 0}`,
        time: 'Now',
        unread: true,
        type: 'finance',
        icon: '📄',
        action: () => navigate('/finance?tab=bills')
      }
    }),
    // Budget alerts
    ...budgetsData.filter((b: any) => b.limit > 0 && (b.spent / b.limit) >= 0.8).slice(0, 2).map((b: any) => ({
      id: `budget-${b.id}`,
      title: 'Budget alert',
      subtitle: `${b.name} at ${Math.round((b.spent / b.limit) * 100)}%`,
      time: '1h ago',
      unread: true,
      type: 'finance',
      icon: '🐷',
      action: () => navigate('/finance?tab=budgets')
    })),
    // Goals progress
    ...goalsData.filter((g: any) => g.target > 0 && (g.current / g.target) >= 0.9).slice(0, 1).map((g: any) => ({
      id: `goal-${g.id}`,
      title: 'Goal milestone!',
      subtitle: `${g.name} at 90% completion`,
      time: '2h ago',
      unread: true,
      type: 'finance',
      icon: '🎯',
      action: () => navigate('/finance?tab=goals')
    })),
    // Subscriptions renewing
    ...subscriptionsData.filter((s: any) => {
      try {
        if (!s.isActive || !s.nextBillingDate) return false
        const daysUntil = Math.ceil((new Date(s.nextBillingDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil <= 7 && daysUntil >= 0
      } catch { return false }
    }).slice(0, 1).map((s: any) => ({
      id: `sub-${s.id}`,
      title: 'Subscription renewal',
      subtitle: `${s.name} - MAD ${s.amount}/mo`,
      time: '3h ago',
      unread: true,
      type: 'finance',
      icon: '🔄',
      action: () => navigate('/finance?tab=subscriptions')
    })),
    // Low balance accounts
    ...accountsData.filter((a: any) => a.balance < 100).slice(0, 1).map((a: any) => ({
      id: `account-${a.id}`,
      title: 'Low balance alert',
      subtitle: `${a.name}: MAD ${a.balance}`,
      time: '4h ago',
      unread: true,
      type: 'finance',
      icon: '💳',
      action: () => navigate('/finance?tab=wealth')
    })),
    // Debt warnings
    ...((debts || []).filter((d: any) => d.balance > 0 && (d.balance / d.totalDebt) > 0.8).slice(0, 1).map((d: any) => ({
      id: `debt-${d.id}`,
      title: 'Debt priority alert',
      subtitle: `${d.name}: ${Math.round((d.balance / d.totalDebt) * 100)}% remaining`,
      time: '5h ago',
      unread: true,
      type: 'finance',
      icon: '⚠️',
      action: () => navigate('/finance?tab=debts')
    })) || []),
    // Investment alerts
    ...((investments || []).filter((i: any) => i.currentValue && i.purchasePrice && ((i.currentValue - i.purchasePrice) / i.purchasePrice) < -0.1).slice(0, 1).map((i: any) => ({
      id: `invest-${i.id}`,
      title: 'Investment alert',
      subtitle: `${i.name} down ${Math.round(((i.currentValue - i.purchasePrice) / i.purchasePrice) * 100)}%`,
      time: '6h ago',
      unread: true,
      type: 'finance',
      icon: '📈',
      action: () => navigate('/finance?tab=investments')
    })) || []),
    // No data prompts - Finance
    ...(transactionsData.length === 0 ? [{
      id: 'no-transaction',
      title: 'Start tracking finances',
      subtitle: 'Add your first transaction',
      time: 'Now',
      unread: false,
      type: 'finance',
      icon: '💰',
      action: () => navigate('/finance?tab=transactions')
    }] : []),
    ...(accountsData.length === 0 ? [{
      id: 'no-account',
      title: 'Add your accounts',
      subtitle: 'Track all your accounts',
      time: 'Now',
      unread: false,
      type: 'finance',
      icon: '🏦',
      action: () => navigate('/finance?tab=wealth')
    }] : []),
    ...(budgetsData.length === 0 ? [{
      id: 'no-budget',
      title: 'Create a budget',
      subtitle: 'Start budgeting your spending',
      time: 'Now',
      unread: false,
      type: 'finance',
      icon: '📊',
      action: () => navigate('/finance?tab=budgets')
    }] : []),

    // === FITNESS NOTIFICATIONS ===
    // Recent workouts
    ...(workoutsData.length > 0 ? [{
      id: 'workout-count',
      title: 'Workouts this month',
      subtitle: `${workoutsData.length} workout(s) logged`,
      time: 'Today',
      unread: false,
      type: 'fitness',
      icon: '🏋️',
      action: () => navigate('/fitness?tab=workouts')
    }] : []),
    // Workout streak
    ...(workoutsData.length >= 3 ? [{
      id: 'workout-streak',
      title: 'Great progress!',
      subtitle: 'Keep up your workout streak',
      time: 'Today',
      unread: false,
      type: 'fitness',
      icon: '🔥',
      action: () => navigate('/fitness?tab=streak')
    }] : []),
    // No workout data
    ...(workoutsData.length === 0 ? [{
      id: 'no-workout',
      title: 'Start fitness journey',
      subtitle: 'Log your first workout',
      time: 'Now',
      unread: false,
      type: 'fitness',
      icon: '💪',
      action: () => navigate('/fitness?tab=workouts')
    }] : []),
    // No body metrics
    ...(bodyMetricsData.length === 0 ? [{
      id: 'no-body',
      title: 'Track your progress',
      subtitle: 'Log body metrics',
      time: 'Now',
      unread: false,
      type: 'fitness',
      icon: '📏',
      action: () => navigate('/fitness?tab=body')
    }] : []),
    // No hydration
    ...(hydrationData.length === 0 ? [{
      id: 'no-hydration',
      title: 'Stay hydrated',
      body: 'Drink water to support recovery.',
      icon: Heart,
      color: 'text-emerald-400',
      action: () => navigate('/fitness?tab=recovery')
    }] : []),
    // No sleep
    ...(sleepData.length === 0 ? [{
      id: 'no-sleep',
      title: 'Optimize recovery',
      subtitle: 'Track your sleep',
      time: 'Now',
      unread: false,
      type: 'fitness',
      icon: '😴',
      action: () => navigate('/fitness?tab=sleep')
    }] : []),
    // Sleep quality alerts
    ...(sleepData.length > 0 ? sleepData.filter((s: any) => s.hours < 6).slice(0, 1).map((s: any) => ({
      id: `sleep-${s.id}`,
      title: 'Sleep reminder',
      subtitle: `Only ${s.hours}h of sleep - aim for 7-8h`,
      time: 'Yesterday',
      unread: true,
      type: 'fitness',
      icon: '🌙',
      action: () => navigate('/fitness?tab=sleep')
    })) : []),
  ]
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0F1419]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <span className="text-lg font-black text-white tracking-tight">LifeSync <span className="gradient-text">Pro</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Split View Toggle (Desktop Only) */}
          <button
            onClick={() => setSplitView(!isSplitView)}
            className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 mr-2",
              isSplitView 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
            )}
            title="Toggle Split View"
          >
            <Columns size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSplitView ? 'Unified' : 'Split'}
            </span>
          </button>

{/* Quick Switcher (Header) */}
          <button
            onClick={() => {
              const targetPath = appMode === 'finance' ? '/' : '/'
              toggleAppMode()
              navigate(targetPath)
            }}
            className={cn(
              "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 mr-2",
              appMode === 'fitness' 
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20" 
                : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
            )}
          >
            {appMode === 'fitness' ? <Wallet size={14} /> : <Dumbbell size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {appMode === 'fitness' ? 'Finance' : 'Fitness'}
            </span>
          </button>

          <div className="relative group hidden md:block" ref={searchRef}>
            <div className="flex items-center gap-2 px-3 py-2 w-48 md:w-64 bg-slate-800/50 border border-white/10 rounded-xl group-focus-within:border-cyan-500/50 transition-colors z-10 relative">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true) }}
                onFocus={() => setShowSearchResults(true)}
                className="bg-transparent text-sm text-white placeholder-slate-600 outline-none w-full font-medium"
              />
              <span className="text-[10px] font-bold text-slate-700 uppercase">⌘K</span>
            </div>
            {showSearchResults && searchQuery.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-white/10 bg-cyan-600">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Search Results</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearchClick(result)}
                        className="w-full p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex items-center gap-3 text-left"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${result.type === 'transaction' ? 'bg-emerald-500/20 text-emerald-400' : result.type === 'account' ? 'bg-amber-500/20 text-amber-400' : result.type === 'budget' ? 'bg-cyan-500/20 text-cyan-400' : result.type === 'bill' ? 'bg-yellow-500/20 text-yellow-400' : result.type === 'investment' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {result.type === 'transaction' ? '💰' : result.type === 'account' ? '💳' : result.type === 'budget' ? '🐷' : result.type === 'bill' ? '📄' : result.type === 'investment' ? '📈' : '🎯'}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{result.label}</p>
                          <p className="text-xs text-slate-500">{result.sublabel}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">No results found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="relative rounded-xl p-2 text-white transition-colors bg-purple-600"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-purple-400" />
              )}
            </button>

            {showNotifications && (
              <div ref={notifRef} className="absolute top-14 right-0 w-80 bg-slate-900 border border-white/10 overflow-hidden z-50 rounded-2xl shadow-2xl shadow-purple-500/20">
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/80 to-purple-800/60 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Notification Center</h3>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto scrollbar-none">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} onClick={() => { n.action?.(); setShowNotifications(false) }} className={cn(
                      "p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all group",
                      n.unread && (n.type === 'finance' ? "bg-cyan-500/10" : "bg-purple-500/10")
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0",
                          n.type === 'finance' ? "bg-cyan-500/20 text-cyan-400" : "bg-purple-500/20 text-purple-400"
                        )}>
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">{n.title}</p>
                            <span className="text-[10px] font-bold text-slate-500 uppercase ml-2 flex-shrink-0">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium truncate">{n.subtitle}</p>
                        </div>
                        {n.unread && <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />}
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center">
                      <div className="text-3xl mb-2">🔔</div>
                      <p className="text-slate-400 text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={() => {}}
                    className="w-full p-3 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-white hover:bg-purple-500/20 transition-all rounded-b-2xl"
                  >
                    Mark all as read
                  </button>
                )}
                <button className="w-full p-3 text-center text-[10px] font-black text-purple-400 uppercase tracking-widest hover:text-white hover:bg-purple-500/20 transition-all rounded-b-2xl">
                  Dismiss All
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={userRef}>
            <button 
              className={cn(
                "h-9 w-9 rounded-xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden",
                appMode === 'finance' ? "border-cyan-500 bg-cyan-600" : "border-purple-500 bg-purple-600"
              )}
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
            >
              {user?.photo ? (
                <img src={user.photo} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">{(user?.name || user?.email?.split('@')[0] || 'V').charAt(0).toUpperCase()}</span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute top-14 right-0 w-80 bg-slate-900 border border-white/10 overflow-hidden z-50 rounded-2xl shadow-2xl shadow-cyan-500/20">
{/* User Profile Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-600/60 to-cyan-800/40 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center overflow-hidden border-2 border-white/20">
                      {user?.photo ? (
                        <img src={user.photo} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-black text-white">{(user?.name || user?.email?.split('@')[0] || 'V').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {user?.name || user?.email?.split('@')[0] || 'Commander'}
                      </p>
                      <p className="text-[10px] text-cyan-200 font-medium">{user?.email || 'user@lifesync.pro'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="p-2 space-y-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent hover:text-cyan-400 transition-all text-left group"
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                  >
                    <User size={16} className="group-hover:rotate-90 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Profile Settings</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent hover:text-cyan-400 transition-all text-left group"
                  >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                  </button>
                  <div className="my-2 border-t border-white/10" />
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left group"
                    onClick={async () => {
                      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                        await clearAllData()
                        setShowUserMenu(false)
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Clear All Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}