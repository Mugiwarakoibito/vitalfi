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
import Settings from '@/pages/Settings'
import Movement from '@/pages/trackers/Movement'
import Nutrition from '@/pages/trackers/Nutrition'
import Recovery from '@/pages/trackers/Recovery'
import Mindset from '@/pages/trackers/Mindset'
import Social from '@/pages/trackers/Social'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0F1419] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500/20 blur-[40px] rounded-full animate-pulse" />
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin relative z-10" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl font-black text-white tracking-tighter">LifeSync <span className="gradient-text">Pro</span></p>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] animate-pulse">Initializing Directives...</p>
      </div>
    </div>
  )
}

function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { isOnboarded, initialize, isLoading } = useAppStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading) {
      setShowOnboarding(!isOnboarded)
    }
  }, [isLoading, isOnboarded])

  if (isLoading) return <LoadingScreen />

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <LicenseGate>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/finance/:tab" element={<Finance />} />
          <Route path="/fitness" element={<Fitness />} />
          <Route path="/fitness/:tab" element={<Fitness />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pillars/movement" element={<Movement />} />
          <Route path="/pillars/nutrition" element={<Nutrition />} />
          <Route path="/pillars/recovery" element={<Recovery />} />
          <Route path="/pillars/mindset" element={<Mindset />} />
          <Route path="/pillars/social" element={<Social />} />
        </Routes>
      </AppShell>
    </LicenseGate>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}