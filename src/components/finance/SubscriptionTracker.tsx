import { useState } from 'react'
import { Trash2, Pause, Play, Plus, Pencil } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'
import type { Subscription } from '@/lib/storage'

const billingCycles = ['weekly', 'monthly', 'yearly'] as const
const categories = ['entertainment', 'productivity', 'fitness', 'news', 'cloud', 'other'] as const

export function SubscriptionTracker() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, settings } = useAppStore()
  const currency = settings.currency || 'USD'
  const [showModal, setShowModal] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly' as typeof billingCycles[number],
    category: 'other' as typeof categories[number],
    startDate: new Date().toISOString().split('T')[0],
  })

  const activeSubs = subscriptions.filter(s => s.isActive)
  const totalMonthly = activeSubs.reduce((sum, s) => {
    const amount = s.amount
    if (s.billingCycle === 'weekly') return sum + amount * 4
    if (s.billingCycle === 'yearly') return sum + amount / 12
    return sum + amount
  }, 0)

  const getCycleLabel = (cycle: string) => {
    if (cycle === 'weekly') return 'wk'
    if (cycle === 'yearly') return 'yr'
    return 'mo'
  }

  const calculateNextBilling = (startDate: string, cycle: string): string => {
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

  const openEditModal = (sub: Subscription) => {
    setEditingSub(sub)
    setFormData({
      name: sub.name,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      category: sub.category,
      startDate: sub.startDate,
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.amount) return
    
    const nextBillingDate = calculateNextBilling(formData.startDate, formData.billingCycle)

    if (editingSub) {
      updateSubscription({
        ...editingSub,
        name: formData.name,
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        category: formData.category,
        startDate: formData.startDate,
        nextBillingDate,
        updatedAt: new Date().toISOString(),
      })
    } else {
      addSubscription({
        id: crypto.randomUUID(),
        name: formData.name,
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        category: formData.category,
        startDate: formData.startDate,
        nextBillingDate,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    
    setShowModal(false)
    setEditingSub(null)
    setFormData({ name: '', amount: '', billingCycle: 'monthly', category: 'other', startDate: new Date().toISOString().split('T')[0] })
  }

  const handleDelete = async () => {
    if (!deletingSub) return
    await deleteSubscription(deletingSub.id)
    setDeletingSub(null)
  }

  const toggleActive = (sub: Subscription) => {
    updateSubscription({ ...sub, isActive: !sub.isActive, updatedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <span>Active Subs</span>
            </div>
            <p className="text-3xl font-bold text-white">{activeSubs.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-pink-400/80 text-sm mb-2">
              <span>Monthly Cost</span>
            </div>
            <p className="text-3xl font-bold text-pink-400">{formatCurrency(totalMonthly, currency)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-400/80 text-sm mb-2">
              <span>Yearly Cost</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{formatCurrency(totalMonthly * 12, currency)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Subscriptions</h3>
        <button onClick={() => { setEditingSub(null); setFormData({ name: '', amount: '', billingCycle: 'monthly', category: 'other', startDate: new Date().toISOString().split('T')[0] }); setShowModal(true) }} className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm flex items-center gap-2 hover:bg-purple-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <p className="text-gray-400 mb-1">No subscriptions yet</p>
          <p className="text-gray-500 text-sm">Track your recurring expenses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className={`rounded-2xl border border-white/10 p-5 transition-all ${sub.isActive ? 'bg-white/5' : 'bg-white/5 opacity-60'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
                    📱
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{sub.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{sub.category}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(sub)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingSub(sub)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(sub)} className={`p-2 rounded-lg transition-all ${sub.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/10'}`}>
                    {sub.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(sub.amount, currency)}
                    <span className="text-sm text-gray-400 font-normal ml-1">/{getCycleLabel(sub.billingCycle)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Next: {sub.nextBillingDate}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${sub.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {sub.isActive ? 'Active' : 'Paused'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Subscription Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all" placeholder="Netflix, Spotify, Gym, Amazon Prime, Adobe" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none transition-all" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Billing Cycle</label>
                <div className="flex gap-2">
                  {billingCycles.map(cycle => (
                    <button key={cycle} onClick={() => setFormData({...formData, billingCycle: cycle})} className={`flex-1 relative overflow-hidden p-3 rounded-xl text-sm font-medium transition-all ${formData.billingCycle === cycle ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
                      {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setFormData({...formData, category: cat})} className={`relative overflow-hidden p-2 rounded-xl text-xs font-medium capitalize transition-all ${formData.category === cat ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none transition-all" />
              </div>
              <button onClick={handleSubmit} className="w-full px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/50 text-white font-medium hover:bg-purple-500/30 transition-all">
                {editingSub ? 'Update Subscription' : 'Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingSub(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Delete Subscription?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingSub.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingSub(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
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