import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Calendar,
  RefreshCw,
  Dumbbell,
  BookOpen,
  Layers,
  Activity,
  Utensils,
  Droplets,
  Moon,
  Settings,
  ShieldCheck,
  Trophy,
  Flame,
  Pill,
  BarChart3,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

const financialItems = [
  { label: 'Accounts', path: '/finance/accounts', icon: Wallet },
  { label: 'Transactions', path: '/finance/transactions', icon: CreditCard },
  { label: 'Budgets', path: '/finance/budgets', icon: PiggyBank },
  { label: 'Investments', path: '/finance/investments', icon: TrendingUp },
  { label: 'Bills', path: '/finance/bills', icon: Calendar },
  { label: 'Subscriptions', path: '/finance/subscriptions', icon: RefreshCw },
  { label: 'Debts', path: '/finance/debts', icon: CreditCard },
]

const healthItems = [
  { label: 'Workouts', path: '/fitness/workouts', icon: Dumbbell },
  { label: 'Exercises', path: '/fitness/exercises', icon: BookOpen },
  { label: 'Templates', path: '/fitness/templates', icon: Layers },
  { label: 'Body Metrics', path: '/fitness/body', icon: Activity },
  { label: 'Nutrition', path: '/fitness/nutrition', icon: Utensils },
  { label: 'Hydration', path: '/fitness/hydration', icon: Droplets },
  { label: 'Sleep', path: '/fitness/sleep', icon: Moon },
  { label: 'PRs', path: '/fitness/records', icon: Trophy },
  { label: 'Streak', path: '/fitness/streak', icon: Flame },
  { label: 'Meal Planner', path: '/fitness/planner', icon: Calendar },
  { label: 'Supplements', path: '/fitness/supplements', icon: Pill },
  { label: 'Analytics', path: '/fitness/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const location = useLocation()
  const { settings, updateSettings } = useAppStore()
  const primaryGate = settings.primaryGate || 'financial'
  const isFinancial = primaryGate === 'financial'

  const navItems = isFinancial ? financialItems : healthItems

  const handleSwitchGate = async () => {
    const newGate = isFinancial ? 'health' : 'financial'
    await updateSettings({ primaryGate: newGate })
    window.location.reload()
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/[0.06] bg-background-secondary/80 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary-light" />
        </div>
        <span className="text-lg font-bold gradient-text">LifeSync Pro</span>
      </div>

      <div className="px-3 py-2">
        <button
          onClick={handleSwitchGate}
          className="group relative flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg backdrop-blur-md bg-gray-800/40 border border-gray-700/30 hover:border-purple-400/50 hover:scale-[1.01] transition-all duration-200"
        >
          {isFinancial ? (
            <>
              <span className="relative z-10 text-lg">💪</span>
              <span className="relative z-10 text-white text-sm font-medium">Health & Fitness</span>
              <span className="relative z-10 text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full font-semibold">
                Switch
              </span>
            </>
          ) : (
            <>
              <span className="relative z-10 text-lg">💰</span>
              <span className="relative z-10 text-white text-sm font-medium">Financial</span>
              <span className="relative z-10 text-[10px] text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                Switch
              </span>
            </>
          )}
        </button>
        <p className="text-[10px] text-gray-500 text-center mt-1.5">
          Tap to switch between trackers
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
            location.pathname === '/'
              ? 'bg-primary/15 text-primary-light'
              : 'text-muted hover:bg-white/[0.04] hover:text-white'
          )}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || location.pathname.includes(item.path)
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/15 text-primary-light'
                  : 'text-muted hover:bg-white/[0.04] hover:text-white'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-white/[0.06]">
          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
              location.pathname === '/settings'
                ? 'bg-primary/15 text-primary-light'
                : 'text-muted hover:bg-white/[0.04] hover:text-white'
            )}
          >
            <Settings size={18} />
            Settings
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/[0.06] px-5 py-4">
        <div className="glass-card p-3">
          <p className="text-xs text-muted">
            {isFinancial ? '💰 Financial Tracker' : '💪 Health & Fitness Tracker'}
          </p>
        </div>
      </div>
    </aside>
  )
}
