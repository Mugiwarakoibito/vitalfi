import { useState } from 'react'
import { Calendar, CheckCircle, AlertCircle, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
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

  // handleSubmit removed - inline logic used instead

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
              <div key={bill.id} className={`rounded-2xl border p-5 transition-all group relative overflow-hidden ${bill.isPaid ? 'border-green-500/20 bg-green-500/5' : isOverdue ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-lg ${bill.isPaid ? 'bg-green-500/20' : isOverdue ? 'bg-red-500/20' : 'bg-yellow-500/20'}`} style={!bill.isPaid && !isOverdue ? {boxShadow: '0 0 20px rgba(234,179,8,0.2)'} : {}}>
                      {cat?.icon || '📄'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{bill.name}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]">
                          Due day {bill.dueDay}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{cat?.label}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={() => openEditModal(bill)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingBill(bill)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(bill.amount, currency)}</p>
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBill ? 'Edit Bill' : 'Add New Bill'} className="max-w-md">
        <div className="space-y-4">
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
            <label className="mb-1.5 block text-sm font-medium text-muted">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {billCategories.map((cat) => (
                <button key={cat.id} type="button" onClick={() => setFormData({...formData, category: cat.id as Bill['category']})} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${formData.category === cat.id ? 'border-yellow-500/50 bg-yellow-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'}`}>
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button type="button" variant="primary" className="flex-1" onClick={() => { 
                if (!formData.name || !formData.amount || !formData.dueDay) {
                  alert('Please fill in name, amount and due day');
                  return;
                }
                if (editingBill) {
                  updateBill({
                    ...editingBill,
                    name: formData.name,
                    amount: Number(formData.amount),
                    dueDay: Number(formData.dueDay),
                    category: formData.category,
                    reminders: formData.reminders ? [Number(formData.reminders)] : [],
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  addBill({
                    id: crypto.randomUUID(),
                    name: formData.name,
                    amount: Number(formData.amount),
                    dueDay: Number(formData.dueDay),
                    category: formData.category || 'other',
                    isPaid: false,
                    reminders: formData.reminders ? [Number(formData.reminders)] : [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  });
                }
                setShowModal(false);
                setEditingBill(null);
                setFormData({ name: '', amount: '', dueDay: '', category: 'other', reminders: '' });
              }}>{editingBill ? 'Update' : 'Add'} Bill</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingBill} onClose={() => setDeletingBill(null)} title="Delete Bill?" className="max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-muted text-sm mb-6">
            This will permanently delete <span className="text-white font-medium">{deletingBill?.name}</span>. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeletingBill(null)} className="flex-1">Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
