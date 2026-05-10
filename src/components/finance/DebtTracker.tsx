import { useState } from 'react'
import { CreditCard, TrendingDown, DollarSign, Plus, Pencil, Trash2, AlertTriangle, Calendar, Percent, Flag } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Debt } from '@/lib/storage'
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
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Total Debt</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalDebt, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">{debts.length} debt{debts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-green-400/80 text-sm mb-2">
              <TrendingDown className="w-4 h-4" />
              <span>Paid Off</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{formatCurrency(totalPaid, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">Your progress</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <CreditCard className="w-4 h-4" />
              <span>Progress</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{progressPercent.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">Of total debt paid</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2">
              <Flag className="w-4 h-4" />
              <span>Debt Free By</span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              {earliestPayoffDate || '--'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Estimated payoff</p>
          </div>
        </div>
      </div>

<div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Debt Overview</h3>
        <button onClick={() => { setEditingDebt(null); setFormData({ name: '', type: 'credit_card', totalAmount: '', currentBalance: '', interestRate: '', minimumPayment: '', dueDate: '' }); setShowModal(true) }} className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Debt
        </button>
      </div>

      {debts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-red-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No debts tracked</p>
          <p className="text-gray-500 text-sm">Add your debts to track your payoff journey</p>
        </div>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const paid = debt.totalAmount - debt.currentBalance
            const debtProgress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0
            const typeInfo = debtTypes.find(t => t.id === debt.type)

            return (
              <div key={debt.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-xl">
                      {typeInfo?.icon || '💳'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{debt.name}</h4>
                      <p className="text-sm text-gray-400">
                        {typeInfo?.label} • {debt.interestRate}% APR
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(debt)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingDebt(debt)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Original</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(debt.totalAmount, currency)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-400/80 mb-1">Paid Off</p>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(paid, currency)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400/80 mb-1">Remaining</p>
                    <p className="text-lg font-bold text-red-400">{formatCurrency(debt.currentBalance, currency)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-purple-400/80 mb-1">Progress</p>
                    <p className="text-lg font-bold text-purple-400">{debtProgress.toFixed(1)}%</p>
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
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">{editingDebt ? 'Edit Debt' : 'Add New Debt'}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Debt Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-all" placeholder={debtExamples.join(', ')} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {debtTypes.map((t) => (
                    <button key={t.id} onClick={() => setFormData({...formData, type: t.id as Debt['type']})} className={`relative overflow-hidden p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${formData.type === t.id ? 'bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
                      <span>{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Original Amount</label>
                  <input type="number" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Current Balance</label>
                  <input type="number" value={formData.currentBalance} onChange={e => setFormData({...formData, currentBalance: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Interest Rate (%)</label>
                  <input type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Min. Payment</label>
                  <input type="number" value={formData.minimumPayment} onChange={e => setFormData({...formData, minimumPayment: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Due Date (optional)</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-red-500/50 focus:outline-none transition-all" />
              </div>
              <button onClick={handleSubmit} className="w-full px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-all">
                {editingDebt ? 'Update Debt' : 'Add Debt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingDebt(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Debt?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingDebt.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingDebt(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}