import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui/Toast'
import { CommandPalette } from '@/components/command/CommandPalette'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import type { CommandAction } from '@/hooks/useCommandPalette'
import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navigateTo = useCallback((path: string) => {
    if (location.pathname === path) return
    navigate(path)
  }, [navigate, location.pathname])

  const actions: CommandAction[] = [
    // Navigation
    { id: 'nav-dash', title: 'Dashboard', shortcut: 'D', category: 'Navigation', perform: () => navigateTo('/') },
    { id: 'nav-finance', title: 'Finance', shortcut: 'F', category: 'Navigation', perform: () => navigateTo('/finance') },
    { id: 'nav-fitness', title: 'Fitness', shortcut: 'G', category: 'Navigation', perform: () => navigateTo('/fitness') },
    { id: 'nav-insights', title: 'Insights', shortcut: 'I', category: 'Navigation', perform: () => navigateTo('/insights') },
    { id: 'nav-settings', title: 'Settings', shortcut: ',', category: 'Navigation', perform: () => navigateTo('/settings') },

    // Finance
    { id: 'fin-new-txn', title: 'New Transaction', shortcut: 'N', category: 'Finance', perform: () => { navigateTo('/finance') } },
    { id: 'fin-accounts', title: 'Accounts', shortcut: 'A', category: 'Finance', perform: () => { navigateTo('/finance') } },
    { id: 'fin-budgets', title: 'Budgets', shortcut: 'B', category: 'Finance', perform: () => { navigateTo('/finance') } },

    // Fitness
    { id: 'fit-workout', title: 'Log Workout', shortcut: 'W', category: 'Fitness', perform: () => { navigateTo('/fitness') } },
    { id: 'fit-nutrition', title: 'Log Meal', shortcut: 'M', category: 'Fitness', perform: () => { navigateTo('/fitness') } },
    { id: 'fit-exercises', title: 'Exercise Library', shortcut: 'E', category: 'Fitness', perform: () => { navigateTo('/fitness') } },

    // Goals
    { id: 'goal-new', title: 'Create Goal', shortcut: 'Y', category: 'Goals', perform: () => { navigateTo('/') } },

    // Search
    { id: 'search', title: 'Search', shortcut: '/', category: 'Search', perform: () => { navigateTo('/insights') } },
  ]

  const { query, setQuery, selectedIndex, setSelectedIndex, filtered } =
    useCommandPalette(actions)

  useEffect(() => {
    if (commandOpen) return

    const handler = (e: KeyboardEvent) => {
      // Ignore if inside input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          (target as HTMLElement).blur()
          return
        }
        return
      }

      const key = e.key.toLowerCase()

      if (e.metaKey || e.ctrlKey) {
        if (key === 'k') {
          e.preventDefault()
          setCommandOpen(true)
        }
        return
      }

      if (key === '/') {
        e.preventDefault()
        navigateTo('/insights')
        return
      }

      if (key === 'escape') {
        return
      }

      // Single-key shortcuts
      const action = actions.find((a) => a.shortcut?.toLowerCase() === key)
      if (action) {
        e.preventDefault()
        action.perform()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandOpen, actions, navigateTo])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={
        mobileMenuOpen
          ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:hidden'
          : ''
      }>
        {mobileMenuOpen && <Sidebar />}
      </div>

      <div className="md:ml-64">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="p-4 md:p-6 animate-fade-in">
          {children}
        </main>
      </div>

      <ToastContainer />

      <CommandPalette
        actions={actions}
        query={query}
        setQuery={setQuery}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        filtered={filtered}
        isOpen={commandOpen}
        setIsOpen={setCommandOpen}
      />
    </div>
  )
}
