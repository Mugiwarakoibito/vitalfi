import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui/Toast'
import { TrackerSwitcher } from './TrackerSwitcher'
import { CommandPalette } from '@/components/command/CommandPalette'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import type { CommandAction } from '@/hooks/useCommandPalette'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import Finance from '@/pages/Finance'
import Fitness from '@/pages/Fitness'

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const { appMode, toggleAppMode, isSplitView } = useAppStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navigateTo = useCallback((path: string) => {
    if (location.pathname === path) return
    navigate(path)
  }, [navigate, location.pathname])

  const actions: CommandAction[] = [
    // Navigation
    { id: 'nav-dash', title: 'Hub', shortcut: 'D', category: 'Navigation', perform: () => navigateTo('/') },
    { id: 'nav-switch', title: `Switch to ${appMode === 'finance' ? 'Fitness' : 'Finance'}`, shortcut: 'T', category: 'System', perform: () => toggleAppMode() },
    { id: 'nav-settings', title: 'Settings', shortcut: ',', category: 'Navigation', perform: () => navigateTo('/settings') },

    // Finance Actions (only in finance mode or global)
    { id: 'fin-trans', title: 'Add Transaction', shortcut: 'Shift+T', category: 'Finance', perform: () => console.log('Add Transaction') },
    
    // Fitness Actions
    { id: 'fit-work', title: 'Start Workout', shortcut: 'Shift+W', category: 'Fitness', perform: () => console.log('Start Workout') },
  ]

  const { query, setQuery, selectedIndex, setSelectedIndex, filtered } =
    useCommandPalette(actions)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') {
          (target as HTMLElement).blur()
          return
        }
        return
      }

      const key = e.key.toLowerCase()

      // Alt + T to toggle mode
      if (e.altKey && key === 't') {
        e.preventDefault()
        toggleAppMode()
        return
      }

      if (e.metaKey || e.ctrlKey) {
        if (key === 'k') {
          e.preventDefault()
          setCommandOpen(true)
        }
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
  }, [actions, toggleAppMode])

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-700",
      "bg-[#030507]"
    )}>
      <Sidebar />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-500 ease-in-out md:hidden',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      <div className="md:ml-64 flex flex-col min-h-screen">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className={cn(
          "flex-1 p-4 md:p-8 w-full transition-all duration-500",
          isSplitView ? "max-w-none" : "max-w-7xl mx-auto"
        )}>
          {isSplitView ? (
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-140px)]">
              <div className="overflow-auto rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400">Finance</h2>
                </div>
                <div className="p-4">
                  <Finance />
                </div>
              </div>
              <div className="overflow-auto rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-purple-400">Health</h2>
                </div>
                <div className="p-4">
                  <Fitness />
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <TrackerSwitcher />
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
