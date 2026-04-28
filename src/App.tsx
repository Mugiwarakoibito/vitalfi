import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/hooks/useToast'
import { LicenseGate } from '@/components/auth/LicenseGate'
import { OnboardingFlow } from '@/components/auth/OnboardingFlow'
import { useAppStore } from '@/store/useAppStore'
import Dashboard from '@/pages/Dashboard'
import Finance from '@/pages/Finance'
import Fitness from '@/pages/Fitness'
import Insights from '@/pages/Insights'
import Settings from '@/pages/Settings'

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { isOnboarded, loadSettings, isLoading } = useAppStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    if (!isLoading && isOnboarded) {
      setShowOnboarding(false)
    } else if (!isLoading && !isOnboarded) {
      setShowOnboarding(true)
    }
  }, [isLoading, isOnboarded])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/fitness" element={<Fitness />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <LicenseGate>
        <AppContent />
      </LicenseGate>
    </ToastProvider>
  )
}
