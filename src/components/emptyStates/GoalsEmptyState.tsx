import { motion } from 'framer-motion'
import { Target, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface GoalsEmptyStateProps {
  onAddGoal?: () => void
}

export function GoalsEmptyState({ onAddGoal }: GoalsEmptyStateProps) {
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
          <Target className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Set Your First Goal</h3>
      <p className="text-muted max-w-sm mb-6">
        Goals help you stay motivated. Create financial or fitness goals and track your progress over time.
      </p>
      <Button variant="primary" size="sm" onClick={onAddGoal}>
        <Plus size={16} /> Create Goal
      </Button>
    </motion.div>
  )
}

export function GoalsListEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Target className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No goals yet</p>
      <p className="text-xs text-muted/60 mt-1">Press Y to create your first goal</p>
    </div>
  )
}
