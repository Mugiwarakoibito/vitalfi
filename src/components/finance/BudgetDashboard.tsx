import { useState, useEffect, useCallback } from 'react'
import { Target, Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { storage, type Budget } from '@/lib/storage'
import { formatCurrency, generateId } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { ALL_CATEGORIES } from '@/lib/categories'
import { BudgetEnvelope } from './BudgetEnvelope'
import type { FinanceBudget } from '@/types/finance'

const BUDGET_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#A78BFA', '#22C55E', '#F97316',
]

export function BudgetDashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<{ amount: number; category: string; type: string }[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)
  const { settings } = useAppStore()

  const loadData = useCallback(async () => {
    const [b, t] = await Promise.all([
      storage.getAll('budgets'),
      storage.getAll('transactions'),
    ])
    setBudgets(b)
    setTransactions(t)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Recalculate spent amounts from transactions
  const computedBudgets: FinanceBudget[] = budgets.map((budget) => {
    const spent = transactions
      .filter((t) => t.type === 'expense')
      .filter((t) => {
        const txCategory = ALL_CATEGORIES.find((c) => c.name === t.category)
        return txCategory?.name === budget.category || txCategory?.subcategories.some((s) => t.category.includes(s))
      })
      .reduce((s, t) => s + t.amount, 0)

    return {
      ...budget,
      spent,
    }
  })

  const totalBudgeted = computedBudgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = computedBudgets.reduce((s, b) => s + b.spent, 0)

  const handleDelete = async () => {
    if (!deletingBudget) return
    await storage.delete('budgets', deletingBudget.id)
    await loadData()
    setDeletingBudget(null)
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-xs text-purple-400/80 text-center">Total Budgeted</p>
            <p className="text-3xl font-bold text-white text-center mt-1">
              {formatCurrency(totalBudgeted, settings.currency || 'USD')}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-xs text-red-400/80 text-center">Total Spent</p>
            <p className="text-3xl font-bold text-red-400 text-center mt-1">
              {formatCurrency(totalSpent, settings.currency || 'USD')}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <p className="text-xs text-emerald-400/80 text-center">Remaining</p>
            <p className="text-3xl font-bold text-emerald-400 text-center mt-1">
              {formatCurrency(Math.max(0, totalBudgeted - totalSpent), settings.currency || 'USD')}
            </p>
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      {computedBudgets.length === 0 ? (
        <Card className="py-12 text-center">
          <Target className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No budgets yet</h4>
          <p className="text-sm text-muted mb-4">Create a budget to track spending limits</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Create Budget
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all min-h-[140px]"
            onClick={() => setShowForm(true)}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">Add Budget</p>
          </div>
          {computedBudgets.map((budget) => (
            <BudgetEnvelope
              key={budget.id}
              budget={budget}
              currency={settings.currency || 'USD'}
              onEdit={setEditingBudget}
              onDelete={setDeletingBudget}
            />
          ))}
        </div>
      )}

      <BudgetForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={loadData}
      />
      <BudgetForm
        isOpen={!!editingBudget}
        onClose={() => setEditingBudget(null)}
        onSave={loadData}
        budget={editingBudget}
      />

      <Modal
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        title="Delete Budget?"
        className="max-w-sm"
      >
        <p className="text-muted text-sm mb-5">
          Remove the <strong className="text-white">{deletingBudget?.name}</strong> budget envelope?
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeletingBudget(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function BudgetForm({
  isOpen,
  onClose,
  onSave,
  budget,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  budget?: Budget | null
}) {
  const [name, setName] = useState(budget?.name || '')
  const [category, setCategory] = useState(budget?.category || '')
  const [limit, setLimit] = useState(budget?.limit.toString() || '')
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(budget?.period || 'monthly')
  const [color, setColor] = useState(budget?.color || BUDGET_COLORS[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (budget) {
      setName(budget.name)
      setCategory(budget.category)
      setLimit(budget.limit.toString())
      setPeriod(budget.period)
      setColor(budget.color)
    } else {
      setName('')
      setCategory('')
      setLimit('')
      setPeriod('monthly')
      setColor(BUDGET_COLORS[0])
      setErrors({})
    }
  }, [budget, isOpen])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name required'
    if (!category) errs.category = 'Category required'
    if (!limit || isNaN(parseFloat(limit)) || parseFloat(limit) <= 0) errs.limit = 'Valid limit required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const b: Budget = {
      id: budget?.id || generateId(),
      name: name.trim(),
      category,
      limit: parseFloat(limit),
      spent: budget?.spent || 0,
      period,
      color,
      createdAt: budget?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await storage.put('budgets', b)
    onSave()
    onClose()
  }

  const budgetExamples = ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Healthcare', 'Travel', 'Subscriptions']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? 'Edit Budget' : 'New Budget'} className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Budget Name"
          placeholder={budgetExamples[Math.floor(Math.random() * budgetExamples.length)]}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full"
          >
            <option value="">Select category</option>
            {ALL_CATEGORIES.filter((c) => c.type === 'expense').map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-error-light">{errors.category}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Limit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            error={errors.limit}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Period</label>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              {(['weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg py-2 text-xs font-medium capitalize transition-all ${
                    period === p
                      ? 'bg-primary/15 text-primary-light'
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 transition-all ${
                  color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  )
}

