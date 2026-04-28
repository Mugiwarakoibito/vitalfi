import { formatCurrency } from '@/lib/utils'
import type { FinanceBudget } from '@/types/finance'
import { Trash2, Pencil } from 'lucide-react'

interface BudgetEnvelopeProps {
  budget: FinanceBudget
  currency: string
  onEdit: (budget: FinanceBudget) => void
  onDelete: (budget: FinanceBudget) => void
}

export function BudgetEnvelope({ budget, currency, onEdit, onDelete }: BudgetEnvelopeProps) {
  const percentage = Math.min(100, Math.round((budget.spent / budget.limit) * 100))
  const remaining = budget.limit - budget.spent
  const isOverBudget = budget.spent > budget.limit
  const isNearLimit = percentage >= 80 && !isOverBudget

  return (
    <div className="glass-card-hover p-5 rounded-2xl relative group cursor-pointer" onClick={() => onEdit(budget)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          <div>
            <h4 className="font-medium text-white">{budget.name}</h4>
            <p className="text-xs text-muted capitalize">{budget.period}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(budget) }}
            className="rounded-lg p-1.5 text-muted hover:text-white hover:bg-white/[0.06]"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(budget) }}
            className="rounded-lg p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: isOverBudget ? '#EF4444' : isNearLimit ? '#F59E0B' : budget.color,
            }}
          />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted mb-0.5">Spent</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(budget.spent, currency)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted mb-0.5">
            {isOverBudget ? 'Over by' : 'Remaining'}
          </p>
          <p className={`text-sm font-semibold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatCurrency(Math.abs(remaining), currency)}
          </p>
        </div>
      </div>

      {isOverBudget && (
        <p className="mt-2 text-xs text-red-400/80">
          Exceeded by {formatCurrency(budget.spent - budget.limit, currency)}
        </p>
      )}
      {isNearLimit && !isOverBudget && (
        <p className="mt-2 text-xs text-amber-400/80">
          {100 - percentage}% remaining
        </p>
      )}
    </div>
  )
}
