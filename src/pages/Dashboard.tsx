import { useAppStore } from '@/store/useAppStore'
import { FinanceDashboard } from './dashboards/FinanceDashboard'
import { FitnessDashboard } from './dashboards/FitnessDashboard'
import { motion, AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const { appMode, isSplitView } = useAppStore()

  if (isSplitView) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-none">
        <div className="space-y-6">
           <div className="flex items-center gap-3 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
<h2 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">Financial Hub</h2>
            </div>
            <FinanceDashboard />
         </div>
         <div className="space-y-6 border-l border-white/5 pl-12">
            <div className="flex items-center gap-3 px-2">
               <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
               <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em]">LifeHub</h2>
           </div>
           <FitnessDashboard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full" key={appMode}>
      <AnimatePresence mode="wait">
        <motion.div
          key={appMode}
          initial={{ opacity: 0, x: appMode === 'finance' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: appMode === 'finance' ? 20 : -20 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {appMode === 'finance' ? <FinanceDashboard /> : <FitnessDashboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}