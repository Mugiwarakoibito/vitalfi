import { useState } from 'react'
import { CreditCard, Pencil, Trash2, AlertTriangle, Calendar, Percent, Flag } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import type { Debt } from '@/types/domain'
import { formatCurrency } from '@/lib/utils'

const debtTypes = [
  { id: 'credit_card', label: 'Credit Card', icon: '💳' },
  { id: 'loan', label: 'Personal Loan', icon: '💵' },
  { id: 'mortgage', label: 'Mortgage', icon: '🏠' },
  { id: 'student', label: 'Student Loan', icon: '🎓' },
  { id: 'other', label: 'Other', icon: '📋' },
]

const calculatePayoffDate = (balance: number, monthlyPayment: number, interestRate: number): string | null => {
  if (monthlyPayment <= 0 || balance <= 0) return null
  if (monthlyPayment >= balance) return new Date().toISOString().split('T')[0]
  
  const monthlyRate = interestRate / 100 / 12
  let months = 0
  let currentBalance = balance
  
  while (currentBalance > 0 && months < 600) {
    const interest = currentBalance * monthlyRate
    currentBalance = currentBalance + interest - monthlyPayment
    months++
  }
  
  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + months)
  return payoffDate.toISOString().split('T')[0]
}

export function DebtTracker() {
  const { debts, addDebt, updateDebt, deleteDebt, settings } = useAppStore()
  const currency = settings.currency || 'USD'
  const [showModal, setShowModal] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card' as Debt['type'],
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'credit_card',
      totalAmount: '',
      currentBalance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: '',
    })
  }

  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0)
  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0)
  const totalPaid = totalOriginal - totalDebt
  const progressPercent = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0

  const earliestPayoffDate = debts
    .filter(d => d.minimumPayment > 0 && d.currentBalance > 0)
    .map(d => calculatePayoffDate(d.currentBalance, d.minimumPayment, d.interestRate))
    .filter(Boolean)
    .sort()[0] || null

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt)
    setFormData({
      name: debt.name,
      type: debt.type,
      totalAmount: debt.totalAmount.toString(),
      currentBalance: debt.currentBalance.toString(),
      interestRate: debt.interestRate.toString(),
      minimumPayment: debt.minimumPayment.toString(),
      dueDate: debt.dueDate || '',
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.totalAmount || !formData.currentBalance) return

    const debtData = {
      name: formData.name,
      type: formData.type,
      totalAmount: Number(formData.totalAmount),
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate) || 0,
      minimumPayment: Number(formData.minimumPayment) || 0,
      dueDate: formData.dueDate || undefined,
    }

    if (editingDebt) {
      updateDebt({
        ...editingDebt,
        ...debtData,
        updatedAt: new Date().toISOString(),
      })
    } else {
      addDebt({
        id: crypto.randomUUID(),
        ...debtData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    
    setShowModal(false)
    setEditingDebt(null)
    resetForm()
  }

  const handleDelete = async () => {
    if (!deletingDebt) return
    await deleteDebt(deletingDebt.id)
    setDeletingDebt(null)
  }

  const debtExamples = ['Chase Card', 'Car Loan', 'Mortgage']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <span>Total Debt</span>
            </div>
            <p className="text-3xl font-bold text-red-400 drop-shadow-lg">{formatCurrency(totalDebt, currency)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-green-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-green-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green-400/80 text-sm mb-2">
              <span>Paid Off</span>
            </div>
            <p className="text-3xl font-bold text-green-400 drop-shadow-lg">{formatCurrency(totalPaid, currency)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-violet-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <span>Progress</span>
            </div>
            <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{progressPercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2">
              <span>Debt Free By</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">
              {earliestPayoffDate || '--'}
            </p>
            </div>
        </div>
      </div>

{debts.length === 0 ? (
        <Card className="py-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No debts yet</h4>
          <p className="text-sm text-muted mb-4">Track your debts and monitor your progress</p>
          <Button variant="primary" onClick={() => { setEditingDebt(null); resetForm(); setShowModal(true) }}>
            Add Debt
          </Button>
        </Card>
) : (
        <div className="space-y-4">
          <div 
            className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all min-h-[100px]"
            onClick={() => { setEditingDebt(null); resetForm(); setShowModal(true) }}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-sm text-gray-400">Add Debt</p>
          </div>
          {debts.map((debt) => {
            const paid = debt.totalAmount - debt.currentBalance
            const debtProgress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0
            const typeInfo = debtTypes.find(t => t.id === debt.type)

            return (
              <div key={debt.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl from-red-500/25 to-orange-500/25 border border-red-500/30 flex items-center justify-center text-xl shadow-lg" style={{boxShadow: '0 0 20px rgba(239,68,68,0.15)'}}>
                        {typeInfo?.icon || '💳'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white tracking-tight">{debt.name}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]">
                            {typeInfo?.label}
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-red-400/80">{debt.interestRate}% APR</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={() => openEditModal(debt)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingDebt(debt)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">Original</p>
                      <p className="text-lg font-bold text-white tracking-tight">{formatCurrency(debt.totalAmount, currency)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-400/80 mb-1">Paid Off</p>
                      <p className="text-lg font-bold text-green-400 tracking-tight">{formatCurrency(paid, currency)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-400/80 mb-1">Remaining</p>
                      <p className="text-lg font-bold text-red-400 tracking-tight">{formatCurrency(debt.currentBalance, currency)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-purple-400/80 mb-1">Progress</p>
                      <p className="text-lg font-bold text-purple-400 tracking-tight">{debtProgress.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${debtProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: {debt.dueDate || 'Not set'}</span>
                        </div>
                        {debt.minimumPayment > 0 && debt.currentBalance > 0 && (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <Flag className="w-3.5 h-3.5" />
                            <span>Estimated: {calculatePayoffDate(debt.currentBalance, debt.minimumPayment, debt.interestRate) || '--'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Percent className="w-3.5 h-3.5" />
                        <span>Min. {formatCurrency(debt.minimumPayment, currency)}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDebt ? 'Edit Debt' : 'Add New Debt'} className="max-w-md">
        <div className="space-y-4">
          <Input
            label="Debt Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
            placeholder={debtExamples.join(', ')}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {debtTypes.map((t) => (
                <button key={t.id} type="button" onClick={() => setFormData({...formData, type: t.id as Debt['type']})} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${formData.type === t.id ? 'border-red-500/50 bg-red-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'}`}>
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Original Amount"
              type="number"
              value={formData.totalAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, totalAmount: e.target.value})}
              placeholder="0.00"
            />
            <Input
              label="Current Balance"
              type="number"
              value={formData.currentBalance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, currentBalance: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.1"
              value={formData.interestRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, interestRate: e.target.value})}
              placeholder="0.00"
            />
            <Input
              label="Min. Payment"
              type="number"
              value={formData.minimumPayment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, minimumPayment: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Due Date (optional)</label>
            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="glass-input w-full" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="button" variant="primary" className="flex-1" onClick={handleSubmit}>{editingDebt ? 'Update' : 'Add'} Debt</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingDebt} onClose={() => setDeletingDebt(null)} title="Delete Debt?" className="max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-muted text-sm mb-6">
            This will permanently delete <span className="text-white font-medium">{deletingDebt?.name}</span>. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeletingDebt(null)} className="flex-1">Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}