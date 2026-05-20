import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Moon,
  Droplets,
  Settings,
  ShieldCheck,
  BarChart3,
  Wallet,
  TrendingUp,
  Target,
  Calendar,
  Flame,
  Activity,
  Trophy,
  BookOpen,
  Coffee,
  Scissors,
  Skull,
  Gem,
  PiggyBank
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const location = useLocation()
  const { appMode } = useAppStore()

  const financeGroups = [
    {
      title: 'MoneyFlow Core',
      items: [
        { label: 'Transaction Hub', path: '/finance?tab=transactions', icon: Wallet, color: 'text-emerald-400', shortcut: 'T' },
        { label: 'Wealth Vault', path: '/finance?tab=wealth', icon: Gem, color: 'text-amber-400' },
        { label: 'Budget Command', path: '/finance?tab=budgets', icon: PiggyBank, color: 'text-cyan-400' },
        { label: 'Goal Crusher', path: '/finance?tab=goals', icon: Target, color: 'text-lime-400' },
        { label: 'Bill Center', path: '/finance?tab=bills', icon: Calendar, color: 'text-rose-400' },
      ]
    },
    {
      title: 'Power Tools',
      items: [
        { label: 'Sub Assassin', path: '/finance?tab=subscriptions', icon: Scissors, color: 'text-purple-400' },
        { label: 'Debt Destroyer', path: '/finance?tab=debts', icon: Skull, color: 'text-rose-500' },
        { label: 'Investment Hub', path: '/finance?tab=investments', icon: TrendingUp, color: 'text-cyan-400' },
        { label: 'Financial Calendar', path: '/finance?tab=calendar', icon: Calendar, color: 'text-amber-400' },
      ]
    }
  ]

  const fitnessGroups = [
    {
      title: 'BodyForge Core',
      items: [
        { label: 'Workout Logger', path: '/fitness?tab=workouts', icon: Dumbbell, color: 'text-orange-400', shortcut: 'W' },
        { label: 'Body Metrics', path: '/fitness?tab=body', icon: Activity, color: 'text-lime-400' },
        { label: 'Nutrition Hub', path: '/fitness?tab=nutrition', icon: Utensils, color: 'text-purple-400' },
        { label: 'Hydration Station', path: '/fitness?tab=hydration', icon: Droplets, color: 'text-blue-400' },
        { label: 'Sleep Sanctuary', path: '/fitness?tab=sleep', icon: Moon, color: 'text-indigo-400' },
      ]
    },
    {
      title: 'Performance',
      items: [
        { label: 'Exercise Library', path: '/fitness?tab=exercises', icon: BookOpen, color: 'text-amber-400' },
        { label: 'PR Hall of Fame', path: '/fitness?tab=records', icon: Trophy, color: 'text-yellow-400' },
        { label: 'Streak Engine', path: '/fitness?tab=streak', icon: Flame, color: 'text-orange-500' },
        { label: 'Supplement Center', path: '/fitness?tab=supplements', icon: Coffee, color: 'text-cyan-400' },
      ]
    }
  ]

  const mainItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: 'D', color: appMode === 'finance' ? 'text-cyan-400' : 'text-purple-400' },
    { label: 'Intelligence', path: '/insights', icon: BarChart3, shortcut: 'I', color: appMode === 'finance' ? 'text-emerald-400' : 'text-indigo-400' },
  ]

  const modeGroups = appMode === 'finance' ? financeGroups : fitnessGroups

  // Check if a nav path matches the current location (handles ?tab= query params)
  const isActive = (path: string) => {
    // Dashboard path "/" should be active in both modes when at root
    if (path === '/') {
      return location.pathname === '/'
    }
    const qIdx = path.indexOf('?')
    if (qIdx === -1) {
      return location.pathname === path
    }
    const pathname = path.slice(0, qIdx)
    const search = path.slice(qIdx + 1)
    if (pathname !== location.pathname) return false
    const expected = new URLSearchParams(search)
    const current = new URLSearchParams(location.search)
    for (const [key, val] of expected.entries()) {
      if (current.get(key) !== val) return false
    }
    return true
  }

  // Get active group title based on current location
  const getActiveGroupTitle = () => {
    for (const group of modeGroups) {
      for (const item of group.items) {
        if (isActive(item.path)) {
          return group.title
        }
      }
    }
    return modeGroups[0]?.title || ''
  }

  const activeGroupTitle = getActiveGroupTitle()

  const NavItem = ({ label, path, icon: Icon, color, shortcut }: any) => {
    const active = isActive(path)
    return (
      <Link
        to={path}
        className={cn(
          'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
          active
            ? 'bg-white/5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5'
            : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={cn('transition-all duration-500', active ? color : 'opacity-50 group-hover:opacity-100 group-hover:text-slate-400')} />
          <span className={cn('transition-colors', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')}>{label}</span>
        </div>
        {shortcut && (
          <span className="text-[10px] font-mono text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
            {shortcut}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/5 bg-black/80 backdrop-blur-3xl md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8 flex-shrink-0">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg transition-colors duration-500',
          appMode === 'finance'
            ? 'bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10'
            : 'bg-purple-500/10 border-purple-500/20 shadow-purple-500/10'
        )}>
          <ShieldCheck className={cn('h-6 w-6 transition-colors duration-500', appMode === 'finance' ? 'text-cyan-400' : 'text-purple-400')} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight text-white">LifeSync <span className="gradient-text">Pro</span></span>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{appMode === 'finance' ? 'Financial Hub' : 'LifeHub'}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 scrollbar-none">
        {/* Main */}
        <div className="space-y-1">
          <h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Main</h3>
          {mainItems.map(item => <NavItem key={item.label} {...item} />)}
        </div>

        {/* Mode-specific groups - show both titles */}
        {modeGroups.map(group => (
          <div key={group.title} className="space-y-1">
<h3 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {group.title === activeGroupTitle ? activeGroupTitle : group.title}
            </h3>
            {group.items.map(item => <NavItem key={item.label} {...item} />)}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-3 flex-shrink-0">
        {/* Sync status */}
        {/* Settings */}
        <div className="border-t border-white/5 pt-2">
          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300',
              location.pathname === '/settings'
                ? 'bg-white/5 text-white'
                : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
            )}
          >
            <Settings
              size={18}
              className={location.pathname === '/settings'
                ? (appMode === 'finance' ? 'text-cyan-400' : 'text-purple-400')
                : 'opacity-50'}
            />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  )
}
