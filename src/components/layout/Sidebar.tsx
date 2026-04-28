import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  Dumbbell,
  Lightbulb,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Finance', path: '/finance', icon: Wallet },
  { label: 'Fitness', path: '/fitness', icon: Dumbbell },
  { label: 'Insights', path: '/insights', icon: Lightbulb },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-white/[0.06] bg-background-secondary/80 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary-light" />
        </div>
        <span className="text-lg font-bold gradient-text">VitalFi</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
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
      </nav>

      <div className="border-t border-white/[0.06] px-5 py-4">
        <div className="glass-card p-3">
          <p className="text-xs text-muted">VitalFi v0.1.0</p>
          <p className="mt-0.5 text-xs text-muted-dark">Local mode</p>
        </div>
      </div>
    </aside>
  )
}
