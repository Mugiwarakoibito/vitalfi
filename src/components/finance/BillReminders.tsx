import { useState } from 'react'
import { Calendar, CheckCircle, AlertCircle, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import type { Bill } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'

const billCategories = [
  { id: 'utilities', label: 'Utilities', icon: '⚡' },
  { id: 'rent', label: 'Rent/Mortgage', icon: '🏠' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' },
  { id: 'subscription', label: 'Subscription', icon: '📺' },
  { id: 'loan', label: 'Loan', icon: '💳' },
  { id: 'other', label: 'Other', icon: '📄' },
]

export function BillReminders() {
  const { bills, addBill, updateBill, deleteBill, settings } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null)
  const currency = settings.currency || 'USD'
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDay: '',
    category: '' as Bill['category'],
    reminders: '',
  })

  const getUpcomingBills = () => {
    const today = new Date()
    const currentDay = today.getDate()
    return bills.filter(bill => {
      if (bill.isPaid) return false
      const daysUntilDue = bill.dueDay - currentDay
      return daysUntilDue >= 0 && daysUntilDue <= 7
    })
  }

  const getOverdueBills = () => {
    const today = new Date()
    const currentDay = today.getDate()
    return bills.filter(bill => {
      if (bill.isPaid) return false
      return bill.dueDay < currentDay
    })
  }

  const totalUpcoming = getUpcomingBills().reduce((sum, b) => sum + b.amount, 0)
  const totalOverdue = getOverdueBills().reduce((sum, b) => sum + b.amount, 0)
  const monthlyTotal = bills.reduce((sum, b) => sum + b.amount, 0)

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill)
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      dueDay: bill.dueDay.toString(),
      category: bill.category,
      reminders: bill.reminders[0]?.toString() || '',
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.amount || !formData.dueDay) return

    if (editingBill) {
      updateBill({
        ...editingBill,
        name: formData.name,
        amount: Number(formData.amount),
        dueDay: Number(formData.dueDay),
        category: formData.category,
        reminders: formData.reminders ? [Number(formData.reminders)] : [],
        updatedAt: new Date().toISOString(),
      })
    } else {
      addBill({
        id: crypto.randomUUID(),
        name: formData.name,
        amount: Number(formData.amount),
        dueDay: Number(formData.dueDay),
        category: formData.category,
        isPaid: false,
        reminders: formData.reminders ? [Number(formData.reminders)] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    setShowModal(false)
    setEditingBill(null)
    setFormData({ name: '', amount: '', dueDay: '', category: '' as Bill['category'], reminders: '' })
  }

  const handleDelete = async () => {
    if (!deletingBill) return
    await deleteBill(deletingBill.id)
    setDeletingBill(null)
  }

  const markAsPaid = (bill: Bill) => {
    updateBill({ ...bill, isPaid: true, lastPaidDate: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() })
  }

  const markAsUnpaid = (bill: Bill) => {
    updateBill({ ...bill, isPaid: false, lastPaidDate: undefined, updatedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-yellow-400/80 text-sm mb-2">
              <Calendar className="w-4 h-4" />
              <span>Monthly Total</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(monthlyTotal, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">{bills.length} bill{bills.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-orange-400/80 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Due This Week</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">{formatCurrency(totalUpcoming, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">{getUpcomingBills().length} upcoming</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Overdue</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(totalOverdue, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">{getOverdueBills().length} overdue</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Bills & Reminders</h3>
        <button type="button" onClick={() => { setEditingBill(null); setFormData({ name: '', amount: '', dueDay: '', category: 'other', reminders: '' }); setShowModal(true) }} className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm flex items-center gap-2 hover:bg-yellow-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No bills yet</p>
          <p className="text-gray-500 text-sm">Add recurring bills to track and get reminders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const cat = billCategories.find(c => c.id === bill.category)
            const today = new Date()
            const currentDay = today.getDate()
            const daysUntilDue = bill.dueDay - currentDay
            const isOverdue = daysUntilDue < 0 && !bill.isPaid

            return (
              <div key={bill.id} className={`rounded-2xl border p-5 transition-all ${bill.isPaid ? 'border-green-500/20 bg-green-500/5' : isOverdue ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bill.isPaid ? 'bg-green-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
                      {cat?.icon || '📄'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{bill.name}</h4>
                      <p className="text-sm text-gray-400">Due day {bill.dueDay} • {cat?.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(bill)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingBill(bill)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-bold text-white">{formatCurrency(bill.amount, currency)}</p>
                    <p className="text-xs text-gray-500">Per month</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {bill.isPaid ? (
                      <button onClick={() => markAsUnpaid(bill)} className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium flex items-center gap-1.5 hover:bg-green-500/30 transition-all">
                        <CheckCircle className="w-4 h-4" />
                        Paid
                      </button>
                    ) : isOverdue ? (
                      <button onClick={() => markAsPaid(bill)} className="px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                        Mark as Paid
                      </button>
                    ) : daysUntilDue <= 3 ? (
                      <button onClick={() => markAsPaid(bill)} className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                        Due in {daysUntilDue} days
                      </button>
                    ) : (
                      <button onClick={() => markAsPaid(bill)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-all">
                        Mark as Paid
                      </button>
                    )}
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
            <h3 className="text-lg font-semibold text-white mb-6">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h3>
            <div className="space-y-5">
              <Input
                label="Bill Name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                placeholder="Rent, Electric, Internet"
              />
              <Input
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
              />
              <Input
                label="Due Day of Month"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, dueDay: e.target.value})}
                placeholder="1"
              />
              <Input
                label="Remind me (days before)"
                type="number"
                min="1"
                max="30"
                value={formData.reminders}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, reminders: e.target.value})}
                placeholder="3"
              />
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {billCategories.map((cat) => (
                    <button key={cat.id} onClick={() => setFormData({...formData, category: cat.id as Bill['category']})} className={`relative overflow-hidden p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${formData.category === cat.id ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSubmit} className="w-full px-4 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-medium hover:bg-yellow-500/30 transition-all mt-6">
              {editingBill ? 'Update Bill' : 'Add Bill'}
            </button>
          </div>
        </div>
      )}

      {deletingBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingBill(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Bill?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingBill.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingBill(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
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
