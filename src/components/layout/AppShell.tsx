import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ToastContainer } from '@/components/ui/Toast'
import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    </div>
  )
}
