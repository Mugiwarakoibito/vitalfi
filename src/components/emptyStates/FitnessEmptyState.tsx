import { motion } from 'framer-motion'
import { Dumbbell, Apple, Droplets, Moon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface FitnessEmptyStateProps {
  onLogWorkout?: () => void
  onLogMeal?: () => void
}

export function FitnessEmptyState({ onLogWorkout, onLogMeal }: FitnessEmptyStateProps) {
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
          <Dumbbell className="w-10 h-10 text-primary-light" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Ignite Your Potential</h3>
      <p className="text-muted max-w-sm mb-6">
        Log your first workout, track your nutrition, and monitor your progress towards your fitness goals.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="primary" size="sm" onClick={onLogWorkout}>
          <Plus size={16} /> Log Workout
        </Button>
        <Button variant="ghost" size="sm" onClick={onLogMeal}>
          <Plus size={16} /> Log Meal
        </Button>
      </div>
    </motion.div>
  )
}

export function WorkoutsEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Dumbbell className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No workouts logged</p>
      <p className="text-xs text-muted/60 mt-1">Press W to log your first workout</p>
    </div>
  )
}

export function NutritionEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Apple className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No meals logged</p>
      <p className="text-xs text-muted/60 mt-1">Press M to log your first meal</p>
    </div>
  )
}

export function HydrationEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Droplets className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No hydration tracked</p>
      <p className="text-xs text-muted/60 mt-1">Log your water intake to stay hydrated</p>
    </div>
  )
}

export function SleepEmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Moon className="w-12 h-12 text-primary/40 mb-4" />
      <p className="text-muted font-medium">No sleep logged</p>
      <p className="text-xs text-muted/60 mt-1">Track your sleep to optimize recovery</p>
    </div>
  )
}
