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
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-lg"
              style={{ backgroundColor: budget.color, boxShadow: `0 0 10px ${budget.color}50` }}
            />
            <div>
              <h4 className="font-semibold text-white tracking-tight">{budget.name}</h4>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px] capitalize">
                  {budget.period}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(budget) }}
              className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(budget) }}
              className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: isOverBudget ? '#EF4444' : isNearLimit ? '#F59E0B' : budget.color,
                boxShadow: isOverBudget ? '0 0 10px rgba(239,68,68,0.4)' : isNearLimit ? '0 0 10px rgba(245,158,11,0.4)' : `0 0 10px ${budget.color}40`,
              }}
            />
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Spent</p>
            <p className="text-sm font-bold text-white tracking-tight">{formatCurrency(budget.spent, currency)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">
              {isOverBudget ? 'Over by' : 'Remaining'}
            </p>
            <p className={`text-sm font-bold tracking-tight ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatCurrency(Math.abs(remaining), currency)}
            </p>
          </div>
        </div>

        {isOverBudget && (
          <p className="mt-2 text-xs text-red-400/80 flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-500/10 text-red-400">
              Exceeded by {formatCurrency(budget.spent - budget.limit, currency)}
            </span>
          </p>
        )}
        {isNearLimit && !isOverBudget && (
          <p className="mt-2 text-xs text-amber-400/80 flex items-center gap-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
              {100 - percentage}% remaining
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
