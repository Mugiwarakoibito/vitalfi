import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

export function SettingsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <div className="relative glass-card p-6 rounded-2xl">
          <Settings className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
      <p className="text-muted max-w-sm">
        Configure your preferences, manage your account, and export your data.
      </p>
    </motion.div>
  )
}
