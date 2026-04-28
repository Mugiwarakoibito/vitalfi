import { motion } from 'framer-motion'
import { TrendingUp, Dumbbell, Target, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function DashboardEmptyState() {
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
          <Sparkles className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Welcome to VitalFi</h3>
      <p className="text-muted max-w-sm mb-6">
        Your unified dashboard is waiting for data. Start by adding an account and your first transaction to see your financial overview.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" size="sm" onClick={() => window.location.href = '/finance'}>
          Add Account
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.location.href = '/fitness'}>
          Log Workout
        </Button>
      </div>
    </motion.div>
  )
}

export function FinancialOverviewEmpty() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <TrendingUp className="w-8 h-8 text-primary/60 mb-3" />
      <p className="text-sm text-muted">No financial data yet</p>
      <p className="text-xs text-muted/60 mt-1">Add accounts and transactions to see your overview</p>
    </div>
  )
}

export function FitnessOverviewEmpty() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Dumbbell className="w-8 h-8 text-primary/60 mb-3" />
      <p className="text-sm text-muted">No fitness data yet</p>
      <p className="text-xs text-muted/60 mt-1">Log workouts and meals to see your overview</p>
    </div>
  )
}

export function GoalsOverviewEmpty() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <Target className="w-8 h-8 text-primary/60 mb-3" />
      <p className="text-sm text-muted">No goals yet</p>
      <p className="text-xs text-muted/60 mt-1">Create a goal to start tracking your progress</p>
    </div>
  )
}
