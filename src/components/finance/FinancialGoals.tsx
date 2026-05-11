import { useState, useMemo, useEffect } from 'react'
import { Target, Plus, Pencil, Trash2, AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import type { Goal } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'

const goalCategories = [
  { id: 'emergency', label: 'Emergency Fund', icon: '🛡️' },
  { id: 'vacation', label: 'Vacation', icon: '✈️' },
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'retirement', label: 'Retirement', icon: '🏖️' },
  { id: 'debt', label: 'Pay Off Debt', icon: '💳' },
  { id: 'other', label: 'Other', icon: '🎯' },
]

export function FinancialGoals({ initialShow = false }: { initialShow?: boolean }) {
  const { goals, settings, addGoal, updateGoal, deleteGoal } = useAppStore()
  const financialGoals = goals.filter(g => g.type === 'financial')
  
  const [showModal, setShowModal] = useState(initialShow)
  
  useEffect(() => {
    if (initialShow) setShowModal(true)
  }, [initialShow])
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    current: '',
    category: 'other',
    deadline: '',
  })

  const currency = settings.currency || 'USD'

  const totalSaved = useMemo(() => financialGoals.reduce((sum, g) => sum + g.current, 0), [financialGoals])
  const totalTarget = useMemo(() => financialGoals.reduce((sum, g) => sum + g.target, 0), [financialGoals])

  const handleSubmit = async () => {
    if (!formData.name || !formData.target) return
    
    const goal: Goal = {
      id: editingGoal?.id || Math.random().toString(36).substring(2, 15),
      type: 'financial',
      name: formData.name,
      target: parseFloat(formData.target) || 0,
      current: parseFloat(formData.current) || 0,
      deadline: formData.deadline || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: editingGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (editingGoal) await updateGoal(goal)
    else await addGoal(goal)
    
    setShowModal(false)
    setEditingGoal(null)
setFormData({ name: '', target: '0', current: '0', category: 'other', deadline: '' })
  }

  const handleDelete = async () => {
    if (!deletingGoal) return
    await deleteGoal(deletingGoal.id)
    setDeletingGoal(null)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      name: goal.name,
      target: goal.target.toString() || '0',
      current: goal.current.toString() || '0',
      category: 'other',
      deadline: goal.deadline,
    })
    setShowModal(true)
  }

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return '#10B981'
    if (percent >= 75) return '#3B82F6'
    if (percent >= 50) return '#F59E0B'
    return '#8B5CF6'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <Target className="w-4 h-4" />
              <span>Total Goals</span>
            </div>
            <p className="text-3xl font-bold text-white">{financialGoals.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Total Saved</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalSaved, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">Across all goals</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-400/80 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>Overall Progress</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Of total target</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Your Goals</h3>
        <button 
          onClick={() => { setEditingGoal(null); setFormData({ name: '', target: '', current: '', category: 'other', deadline: '' }); setShowModal(true) }} 
          className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm flex items-center gap-2 hover:bg-purple-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      {financialGoals.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-purple-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No financial goals yet</p>
          <p className="text-gray-500 text-sm">Set your first savings goal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {financialGoals.map((goal) => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
            const daysLeft = getDaysRemaining(goal.deadline)
            const progressColor = getProgressColor(progress)
            const category = goalCategories.find(c => c.id === goal.category) || goalCategories[7]
            
            return (
              <div key={goal.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/25 to-violet-500/25 border border-purple-500/30 flex items-center justify-center text-xl shadow-lg" style={{boxShadow: '0 0 20px rgba(139,92,246,0.15)'}}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{goal.name}</h4>
                        <p className="text-xs text-gray-500">{category.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={() => openEdit(goal)} className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingGoal(goal)} className="rounded-lg p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{formatCurrency(goal.current, currency)}</span>
                      <span className="text-gray-400">{formatCurrency(goal.target, currency)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progressColor,
                          boxShadow: `0 0 12px ${progressColor}60`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm font-medium" style={{ color: progressColor }}>{progress.toFixed(1)}%</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingGoal ? 'Edit Goal' : 'Add Financial Goal'} className="max-w-md">
        <div className="space-y-4">
          <Input
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Emergency Fund, Vacation, New Car"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Amount"
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              placeholder="0"
            />
            <Input
              label="Current Saved"
              type="number"
              value={formData.current}
              onChange={(e) => setFormData({...formData, current: e.target.value})}
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Target Date</label>
            <input 
              type="date" 
              value={formData.deadline} 
              onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
              className="glass-input w-full"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="button" variant="primary" className="flex-1" onClick={handleSubmit}>
              {editingGoal ? 'Update' : 'Add'} Goal
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingGoal} onClose={() => setDeletingGoal(null)} title="Delete Goal?" className="max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-muted text-sm mb-6">
            Delete <span className="text-white font-medium">{deletingGoal?.name}</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeletingGoal(null)} className="flex-1">Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}