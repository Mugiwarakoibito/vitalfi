import { motion } from 'framer-motion'
import { BarChart3, Sparkles } from 'lucide-react'

export function InsightsEmptyState() {
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
          <BarChart3 className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Insights Awaiting Data</h3>
      <p className="text-muted max-w-sm mb-6">
        Add transactions, log workouts, and track your meals to unlock AI-powered insights about your financial and fitness health.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Sparkles className="w-4 h-4 text-primary-light animate-pulse" />
        <span className="text-sm text-muted">Insights get smarter with more data</span>
      </div>
    </motion.div>
  )
}

export function InsightsCardEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <p className="text-xs text-muted/60">{label}</p>
    </div>
  )
}
