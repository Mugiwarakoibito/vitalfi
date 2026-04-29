import { useState, useEffect } from 'react'
import { Calendar, Bell, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { storage, type Bill } from '@/lib/storage'

const billCategories = [
  { id: 'utilities', label: 'Utilities', icon: '⚡' },
  { id: 'rent', label: 'Rent/Mortgage', icon: '🏠' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' },
  { id: 'subscription', label: 'Subscription', icon: '📺' },
  { id: 'loan', label: 'Loan', icon: '💳' },
  { id: 'other', label: 'Other', icon: '📄' },
]

export function BillReminders() {
  const [bills, setBills] = useState<Bill[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDay: '1',
    category: 'other' as Bill['category'],
    reminders: '3',
  })

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    const data = await storage.getAll('bills')
    setBills(data)
  }

  const handleSubmit = async () => {
    const bill: Bill = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: formData.name,
      amount: Number(formData.amount),
      dueDay: Number(formData.dueDay),
      category: formData.category,
      isPaid: false,
      reminders: [Number(formData.reminders)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('bills', bill)
    loadBills()
    setShowModal(false)
    setFormData({
      name: '',
      amount: '',
      dueDay: '1',
      category: 'other',
      reminders: '3',
    })
  }

  const markAsPaid = async (bill: Bill) => {
    const updated = { ...bill, isPaid: true, lastPaidDate: new Date().toISOString().split('T')[0] }
    await storage.put('bills', updated)
    loadBills()
  }

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Monthly Total
            </div>
            <div className="text-2xl font-bold text-white">
              ${monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-yellow-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Due This Week
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              ${totalUpcoming.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-red-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Overdue
            </div>
            <div className="text-2xl font-bold text-red-400">
              ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Bills & Reminders</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Bell className="w-4 h-4 mr-1" />
          Add Bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No bills yet</p>
            <p className="text-gray-500 text-sm">Add recurring bills to track and get reminders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const cat = billCategories.find(c => c.id === bill.category)
            const today = new Date()
            const currentDay = today.getDate()
            const daysUntilDue = bill.dueDay - currentDay
            const isOverdue = daysUntilDue < 0 && !bill.isPaid

            return (
              <Card 
                key={bill.id} 
                className={`backdrop-blur-xl border ${
                  bill.isPaid 
                    ? 'bg-green-900/20 border-green-700/30' 
                    : isOverdue 
                      ? 'bg-red-900/20 border-red-700/50'
                      : 'bg-gray-900/50 border-gray-700/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{cat?.icon || '📄'}</div>
                      <div>
                        <h4 className="font-semibold text-white">{bill.name}</h4>
                        <p className="text-sm text-gray-400">
                          Due on day {bill.dueDay} • {cat?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          ${bill.amount.toFixed(2)}
                        </div>
                        {bill.isPaid ? (
                          <div className="text-sm text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </div>
                        ) : isOverdue ? (
                          <div className="text-sm text-red-400">Overdue</div>
                        ) : daysUntilDue <= 3 ? (
                          <div className="text-sm text-yellow-400">Due soon</div>
                        ) : null}
                      </div>
                      {!bill.isPaid && (
                        <Button variant="ghost" size="sm" onClick={() => markAsPaid(bill)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Bill">
        <div className="space-y-4">
          <Input
            label="Bill Name"
            placeholder="e.g., Electric Bill"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
          <Input
            label="Due Day of Month"
            type="number"
            min="1"
            max="31"
            value={formData.dueDay}
            onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {billCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id as Bill['category'] })}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    formData.category === cat.id
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Remind me (days before)"
            type="number"
            min="1"
            max="30"
            value={formData.reminders}
            onChange={(e) => setFormData({ ...formData, reminders: e.target.value })}
          />
          <Button variant="primary" onClick={handleSubmit} className="w-full">
            Add Bill
          </Button>
        </div>
      </Modal>
    </div>
  )
}