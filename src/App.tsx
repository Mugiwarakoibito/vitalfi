import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/hooks/useToast'
import Dashboard from '@/pages/Dashboard'
import Finance from '@/pages/Finance'
import Fitness from '@/pages/Fitness'
import Insights from '@/pages/Insights'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/fitness" element={<Fitness />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  )
}
