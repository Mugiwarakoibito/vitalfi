import { useState, useEffect } from 'react'
import { CreditCard, TrendingDown, DollarSign, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { storage, type Debt } from '@/lib/storage'

const debtTypes = [
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'loan', label: 'Personal Loan' },
  { id: 'mortgage', label: 'Mortgage' },
  { id: 'student', label: 'Student Loan' },
  { id: 'other', label: 'Other' },
]

export function DebtTracker() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card' as Debt['type'],
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
  })

  useEffect(() => {
    loadDebts()
  }, [])

  const loadDebts = async () => {
    const data = await storage.getAll('debts')
    setDebts(data)
  }

  const handleSubmit = async () => {
    const debt: Debt = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: formData.name,
      type: formData.type,
      totalAmount: Number(formData.totalAmount),
      currentBalance: Number(formData.currentBalance),
      interestRate: Number(formData.interestRate),
      minimumPayment: Number(formData.minimumPayment),
      dueDate: formData.dueDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('debts', debt)
    loadDebts()
    setShowModal(false)
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Total Debt
            </div>
            <div className="text-2xl font-bold text-red-400">
              ${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <TrendingDown className="w-4 h-4" />
              Total Paid Off
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-purple-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <CreditCard className="w-4 h-4" />
              Progress
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {progressPercent.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Debt Overview</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Debt
        </Button>
      </div>

      {debts.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No debts tracked</p>
            <p className="text-gray-500 text-sm">Add your debts to track your payoff journey</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const paid = debt.totalAmount - debt.currentBalance
            const debtProgress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0

            return (
              <Card key={debt.id} className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{debt.name}</h4>
                      <p className="text-sm text-gray-400">
                        {debtTypes.find(t => t.id === debt.type)?.label} • {debt.interestRate}% APR
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Remaining</div>
                      <div className="text-xl font-bold text-white">
                        ${debt.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{debtProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${debtProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Min. Payment: ${debt.minimumPayment}/mo</span>
                      <span className="text-gray-500">Original: ${debt.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Debt">
        <div className="space-y-4">
          <Input
            label="Debt Name"
            placeholder="e.g., Chase Credit Card"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {debtTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id as Debt['type'] })}
                  className={`p-2 rounded-lg text-xs transition-all ${
                    formData.type === t.id
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Original Amount"
              type="number"
              placeholder="0.00"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
            />
            <Input
              label="Current Balance"
              type="number"
              placeholder="0.00"
              value={formData.currentBalance}
              onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Interest Rate (%)"
              type="number"
              step="0.1"
              placeholder="0.0"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
            />
            <Input
              label="Min. Payment"
              type="number"
              placeholder="0.00"
              value={formData.minimumPayment}
              onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
            />
          </div>
          <Input
            label="Due Date (optional)"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <Button variant="primary" onClick={handleSubmit} className="w-full">
            Add Debt
          </Button>
        </div>
      </Modal>
    </div>
  )
}