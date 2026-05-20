import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { Wallet, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TrackerSwitcher() {
  const { appMode, toggleAppMode } = useAppStore()
  const navigate = useNavigate()

  const handleClick = () => {
    const targetPath = appMode === 'finance' ? '/' : '/'
    navigate(targetPath)
    toggleAppMode()
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "relative h-20 w-20 rounded-full glass-card flex items-center justify-center group overflow-hidden border-2",
          appMode === 'finance' ? "border-purple-500/30 neon-glow-purple" : "border-cyan-500/30 neon-glow-cyan"
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={appMode}
            initial={{ y: 20, opacity: 0, rotateY: 180 }}
            animate={{ y: 0, opacity: 1, rotateY: 0 }}
            exit={{ y: -20, opacity: 0, rotateY: -180 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="flex items-center justify-center"
          >
            {appMode === 'finance' ? (
              <Dumbbell className="w-8 h-8 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            ) : (
              <Wallet className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Hover Label */}
        <div className="absolute -top-12 right-0 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">
            Switch to {appMode === 'finance' ? 'Fitness' : 'Finance'}
          </p>
        </div>
      </motion.button>
    </div>
  )
}
