import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Goal } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'
import { Target, Trash2, TrendingUp, Dumbbell, Pencil } from 'lucide-react'
import { useState } from 'react'
import { GoalForm } from './GoalForm'
import { storage } from '@/lib/storage'

interface GoalListProps {
  goals: Goal[]
  currency: string
  onGoalsChange: () => void
}

export function GoalList({ goals, currency, onGoalsChange }: GoalListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const handleDelete = async (id: string) => {
    await storage.delete('goals', id)
    onGoalsChange()
  }

  const handleProgressUpdate = async (goal: Goal, delta: number) => {
    const next = { ...goal, current: Math.max(0, Math.min(goal.target, goal.current + delta)) }
    await storage.put('goals', next)
    onGoalsChange()
  }

  const financial = goals.filter((g) => g.type === 'financial')
  const fitness = goals.filter((g) => g.type === 'fitness')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Goals</h3>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + New Goal
        </Button>
      </div>

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">
              No goals yet. Create one to start tracking.
            </p>
          </CardContent>
        </Card>
      )}

      {financial.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={12} />
            Financial
          </h4>
          {financial.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={currency}
              onDelete={handleDelete}
              onUpdateProgress={handleProgressUpdate}
              onEdit={(g) => { setEditingGoal(g); setShowForm(true) }}
            />
          ))}
        </div>
      )}

      {fitness.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Dumbbell size={12} />
            Fitness
          </h4>
          {fitness.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={currency}
              onDelete={handleDelete}
              onUpdateProgress={handleProgressUpdate}
              onEdit={(g) => { setEditingGoal(g); setShowForm(true) }}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingGoal(null) }} title={editingGoal ? 'Edit Goal' : 'New Goal'}>
        <GoalForm
          initial={editingGoal ?? undefined}
          onSaved={() => {
            setShowForm(false)
            setEditingGoal(null)
            onGoalsChange()
          }}
        />
      </Modal>
    </div>
  )
}

function GoalCard({
  goal,
  currency,
  onDelete,
  onUpdateProgress,
  onEdit,
}: {
  goal: Goal
  currency: string
  onDelete: (id: string) => void
  onUpdateProgress: (goal: Goal, delta: number) => void
  onEdit: (goal: Goal) => void
}) {
  const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
  return (
    <Card hover={false} className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{goal.name}</p>
          <p className="text-xs text-muted">
            {goal.type === 'financial'
              ? `${formatCurrency(goal.current, currency)} / ${formatCurrency(goal.target, currency)}`
              : `${goal.current} / ${goal.target}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted">{pct}%</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateProgress(goal, -1)}
            className="px-2 py-0.5 rounded-md bg-white/[0.04] text-xs text-muted hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            -
          </button>
          <button
            onClick={() => onUpdateProgress(goal, 1)}
            className="px-2 py-0.5 rounded-md bg-white/[0.04] text-xs text-muted hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </Card>
  )
}
