import { useState } from 'react'
import { Trash2, Pause, Play, Pencil, AlertTriangle, Gem } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/utils'
import type { Subscription } from '@/types/domain'

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
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-violet-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <span>Active Subs</span>
            </div>
            <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{activeSubs.length}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-pink-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-pink-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-pink-400/80 text-sm mb-2">
              <span>Monthly Cost</span>
            </div>
            <p className="text-3xl font-bold text-pink-400 drop-shadow-lg">{formatCurrency(totalMonthly, currency)}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-cyan-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-sky-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-cyan-400/80 text-sm mb-2">
              <span>Yearly Cost</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400 drop-shadow-lg">{formatCurrency(totalMonthly * 12, currency)}</p>
          </div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="py-12 text-center">
          <Gem className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No subscriptions yet</h4>
          <p className="text-sm text-muted mb-4">Track your recurring expenses</p>
          <Button variant="primary" onClick={() => { setEditingSub(null); setFormData({ name: '', amount: '', billingCycle: 'monthly', category: 'other', startDate: new Date().toISOString().split('T')[0] }); setShowModal(true) }}>
            Add Subscription
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div 
            className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all min-h-[100px]"
            onClick={() => { setEditingSub(null); setFormData({ name: '', amount: '', billingCycle: 'monthly', category: 'other', startDate: new Date().toISOString().split('T')[0] }); setShowModal(true) }}
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
              <Gem className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">Add Subscription</p>
          </div>
          {subscriptions.map((sub) => (
            <div key={sub.id} className={`rounded-2xl border border-white/10 p-5 transition-all group relative overflow-hidden ${sub.isActive ? 'bg-white/[0.02]' : 'bg-white/[0.02] opacity-60'}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.02] to-transparent pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl from-purple-500/25 to-pink-500/25 border border-purple-500/30 flex items-center justify-center text-lg shadow-lg" style={{boxShadow: '0 0 20px rgba(168,85,247,0.15)'}}>
                      📱
                    </div>
                    <div>
                      <h4 className="font-semibold text-white tracking-tight">{sub.name}</h4>
                      <p className="text-xs text-gray-500 capitalize flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px] capitalize">
                          {sub.category}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button onClick={() => openEditModal(sub)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingSub(sub)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(sub)} className={`p-2 rounded-lg transition-all ${sub.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:bg-white/10'}`}>
                      {sub.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-2xl font-bold text-white tracking-tight">
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
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingSub ? 'Edit Subscription' : 'Add Subscription'} className="max-w-md">
        <div className="space-y-4">
          <Input
            label="Subscription Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
            placeholder="Netflix, Spotify, Gym"
          />
          <Input
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, amount: e.target.value})}
            placeholder="0.00"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Billing Cycle</label>
            <div className="flex gap-2">
              {billingCycles.map(cycle => (
                <button key={cycle} type="button" onClick={() => setFormData({...formData, billingCycle: cycle})} className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all border ${formData.billingCycle === cycle ? 'border-purple-500/50 bg-purple-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'}`}>
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setFormData({...formData, category: cat})} className={`p-2 rounded-xl text-xs font-medium capitalize transition-all border ${formData.category === cat ? 'border-purple-500/50 bg-purple-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Start Date</label>
            <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="glass-input w-full" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="button" variant="primary" className="flex-1" onClick={handleSubmit}>{editingSub ? 'Update' : 'Add'} Subscription</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingSub} onClose={() => setDeletingSub(null)} title="Delete Subscription?" className="max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-muted text-sm mb-6">
            This will permanently delete <span className="text-white font-medium">{deletingSub?.name}</span>. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeletingSub(null)} className="flex-1">Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}