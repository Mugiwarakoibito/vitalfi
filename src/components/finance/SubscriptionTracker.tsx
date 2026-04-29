import { useState, useEffect } from 'react'
import { RefreshCw, Calendar, DollarSign, Pause, Play, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { storage, type Subscription } from '@/lib/storage'

const billingCycles = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
]

const categories = [
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'productivity', label: 'Productivity', icon: '💼' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'cloud', label: 'Cloud Storage', icon: '☁️' },
  { id: 'other', label: 'Other', icon: '📦' },
]

const logos: Record<string, string> = {
  netflix: '🔴',
  spotify: '🎵',
  youtube: '▶️',
  amazon: '📦',
  disney: '🏰',
  apple: '🍎',
  google: '🔍',
  microsoft: '💻',
  adobe: '🎨',
  dropbox: '📁',
}

export function SubscriptionTracker() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly' as Subscription['billingCycle'],
    category: 'other' as Subscription['category'],
    startDate: new Date().toISOString().split('T')[0],
    logo: '',
  })

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    const data = await storage.getAll('subscriptions')
    setSubscriptions(data)
  }

  const handleSubmit = async () => {
    const nextBillingDate = calculateNextBillingDate(formData.startDate, formData.billingCycle)
    const subscription: Subscription = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: formData.name,
      amount: Number(formData.amount),
      billingCycle: formData.billingCycle,
      category: formData.category,
      startDate: formData.startDate,
      nextBillingDate,
      isActive: true,
      logoUrl: formData.logo || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('subscriptions', subscription)
    loadSubscriptions()
    setShowModal(false)
    setFormData({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      category: 'other',
      startDate: new Date().toISOString().split('T')[0],
      logo: '',
    })
  }

  const calculateNextBillingDate = (startDate: string, cycle: string): string => {
    const start = new Date(startDate)
    const now = new Date()
    let next = new Date(start)

    while (next <= now) {
      if (cycle === 'weekly') next.setDate(next.getDate() + 7)
      else if (cycle === 'monthly') next.setMonth(next.getMonth() + 1)
      else next.setFullYear(next.getFullYear() + 1)
    }
    return next.toISOString().split('T')[0]
  }

  const toggleActive = async (sub: Subscription) => {
    const updated = { ...sub, isActive: !sub.isActive, updatedAt: new Date().toISOString() }
    await storage.put('subscriptions', updated)
    loadSubscriptions()
  }

  const getMonthlyAmount = (sub: Subscription): number => {
    if (sub.billingCycle === 'weekly') return sub.amount * 4.33
    if (sub.billingCycle === 'yearly') return sub.amount / 12
    return sub.amount
  }

  const activeSubs = subscriptions.filter(s => s.isActive)
  const totalMonthly = activeSubs.reduce((sum, s) => sum + getMonthlyAmount(s), 0)
  const totalYearly = totalMonthly * 12

  const getLogo = (name: string): string => {
    const key = name.toLowerCase().split(' ')[0]
    return logos[key] || '📱'
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <RefreshCw className="w-4 h-4" />
              Active Subs
            </div>
            <div className="text-2xl font-bold text-white">{activeSubs.length}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Monthly Cost
            </div>
            <div className="text-2xl font-bold text-purple-400">
              ${totalMonthly.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Yearly Cost
            </div>
            <div className="text-2xl font-bold text-white">
              ${totalYearly.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Subscriptions</h3>
        <Button variant="primary" onClick={() => setShowModal(false)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Subscription
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No subscriptions yet</p>
            <p className="text-gray-500 text-sm">Track your recurring subscriptions in one place</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {subscriptions.map((sub) => {
            const cat = categories.find(c => c.id === sub.category)
            const monthlyAmount = getMonthlyAmount(sub)

            return (
              <Card 
                key={sub.id} 
                className={`backdrop-blur-xl border ${
                  sub.isActive 
                    ? 'bg-gray-900/50 border-gray-700/50' 
                    : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getLogo(sub.name)}</div>
                      <div>
                        <h4 className="font-semibold text-white">{sub.name}</h4>
                        <p className="text-xs text-gray-400">{cat?.icon} {cat?.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(sub)}
                      className={`p-2 rounded-lg ${sub.isActive ? 'text-green-400' : 'text-gray-500'}`}
                    >
                      {sub.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xl font-bold text-white">
                        ${sub.amount.toFixed(2)}
                        <span className="text-sm text-gray-400 font-normal">
                          /{sub.billingCycle === 'weekly' ? 'wk' : sub.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        ~${monthlyAmount.toFixed(2)}/mo
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Next billing</div>
                      <div className="text-sm text-purple-400">{sub.nextBillingDate}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Subscription">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Netflix"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Billing Cycle</label>
              <div className="flex gap-2">
                {billingCycles.map((cycle) => (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: cycle.id as Subscription['billingCycle'] })}
                    className={`flex-1 p-2 rounded-lg text-xs transition-all ${
                      formData.billingCycle === cycle.id
                        ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                        : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                    }`}
                  >
                    {cycle.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id as Subscription['category'] })}
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
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Button variant="primary" onClick={handleSubmit} className="w-full">
            Add Subscription
          </Button>
        </div>
      </Modal>
    </div>
  )
}