import { useState, useMemo, useEffect } from 'react'
import { Target, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
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
setFormData({ name: '', target: '', current: '', category: 'other', deadline: '' })
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
      target: goal.target.toString() || '0.00',
      current: goal.current.toString() || '0.00',
      category: 'other',
      deadline: goal.deadline,
    })
    setShowModal(true)
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
              <span>Total Goals</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{financialGoals.length}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <span>Total Saved</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalSaved, currency)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-blue-400/80 text-sm mb-2">
              <span>Overall Progress</span>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {financialGoals.length === 0 ? (
        <Card className="py-12 text-center">
          <Target className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No financial goals yet</h4>
          <p className="text-sm text-muted mb-4">Set your first savings goal</p>
          <Button variant="primary" onClick={() => { setEditingGoal(null); setFormData({ name: '', target: '', current: '', category: 'other', deadline: '' }); setShowModal(true) }}>
            Create Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all min-h-[140px]"
            onClick={() => { setEditingGoal(null); setFormData({ name: '', target: '', current: '', category: 'other', deadline: '' }); setShowModal(true) }}
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">Add Goal</p>
          </div>
          {financialGoals.map((goal) => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
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
                    <div className="h-2.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progressColor,
                          boxShadow: `0 0 10px ${progressColor}40`
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Saved</p>
                      <p className="text-sm font-bold text-white tracking-tight">{formatCurrency(goal.current, currency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
                      <p className="text-sm font-bold tracking-tight text-purple-400">{formatCurrency(goal.target - goal.current, currency)}</p>
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
              onBlur={(e) => !e.target.value && setFormData({...formData, target: '0.00'})}
              placeholder="0.00"
            />
            <Input
              label="Current Saved"
              type="number"
              value={formData.current}
              onChange={(e) => setFormData({...formData, current: e.target.value})}
              onBlur={(e) => !e.target.value && setFormData({...formData, current: '0.00'})}
              placeholder="0.00"
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