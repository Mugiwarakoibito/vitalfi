import { useState } from 'react'
import { TrendingUp, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import type { Investment } from '@/lib/storage'
import { formatCurrency } from '@/lib/utils'

const investmentTypes = [
  { id: 'stock', label: 'Stock', icon: '📈' },
  { id: 'etf', label: 'ETF', icon: '🎯' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'bond', label: 'Bond', icon: '📜' },
  { id: 'realestate', label: 'Real Estate', icon: '🏠' },
  { id: 'other', label: 'Other', icon: '💎' },
]

export function InvestmentPortfolio() {
  const { investments, addInvestment, updateInvestment, deleteInvestment, settings } = useAppStore()
  const currency = settings.currency || 'USD'
  const [showModal, setShowModal] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock' as Investment['type'],
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  })

  const investmentExamples = ['Apple Inc.', 'Microsoft', 'Bitcoin']

  const getSymbolPlaceholder = () => {
    const n = formData.name.toLowerCase()
    if (n.includes('apple')) return 'AAPL'
    if (n.includes('microsoft')) return 'MSFT'
    if (n.includes('google') || n.includes('alphabet')) return 'GOOGL'
    if (n.includes('amazon')) return 'AMZN'
    if (n.includes('bitcoin')) return 'BTC'
    if (n.includes('ethereum')) return 'ETH'
    if (n.includes('nvidia')) return 'NVDA'
    if (n.includes('tesla')) return 'TSLA'
    if (n.includes('facebook') || n.includes('meta')) return 'META'
    if (n.includes('netflix')) return 'NFLX'
    if (n.includes('spotify')) return 'SPOT'
    return 'AAPL, MSFT, BTC'
  }

  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0)
  const totalCost = investments.reduce((sum, inv) => sum + inv.quantity * inv.purchasePrice, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const openEditModal = (inv: Investment) => {
    setEditingInvestment(inv)
    setFormData({
      name: inv.name,
      symbol: inv.symbol || '',
      type: inv.type,
      quantity: inv.quantity.toString(),
      purchasePrice: inv.purchasePrice.toString(),
      currentPrice: inv.currentPrice.toString(),
      purchaseDate: inv.purchaseDate,
    })
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.quantity || !formData.currentPrice) return

    if (editingInvestment) {
      updateInvestment({
        ...editingInvestment,
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice) || 0,
        currentPrice: Number(formData.currentPrice),
        purchaseDate: formData.purchaseDate,
        updatedAt: new Date().toISOString(),
      })
    } else {
      addInvestment({
        id: crypto.randomUUID(),
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice) || 0,
        currentPrice: Number(formData.currentPrice),
        purchaseDate: formData.purchaseDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    setShowModal(false)
    setEditingInvestment(null)
    setFormData({ name: '', symbol: '', type: 'stock', quantity: '', purchasePrice: '', currentPrice: '', purchaseDate: new Date().toISOString().split('T')[0] })
  }

  const handleDelete = async () => {
    if (!deletingInvestment) return
    await deleteInvestment(deletingInvestment.id)
    setDeletingInvestment(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <span>Total Value</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalValue, currency)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2">
              <span>Total Gain/Loss</span>
            </div>
            <p className={`text-3xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, currency)}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              <span>Return</span>
            </div>
            <p className={`text-3xl font-bold ${totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {investments.length === 0 ? (
        <Card className="py-12 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-muted/50 mb-3" />
          <h4 className="text-white font-medium mb-1">No investments yet</h4>
          <p className="text-sm text-muted mb-4">Add your first investment to track your portfolio</p>
          <Button variant="primary" onClick={() => { setEditingInvestment(null); setFormData({ name: '', symbol: '', type: 'stock', quantity: '', purchasePrice: '', currentPrice: '', purchaseDate: new Date().toISOString().split('T')[0] }); setShowModal(true) }}>
            Add Investment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div 
            className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.05] transition-all min-h-[100px]"
            onClick={() => { setEditingInvestment(null); setFormData({ name: '', symbol: '', type: 'stock', quantity: '', purchasePrice: '', currentPrice: '', purchaseDate: new Date().toISOString().split('T')[0] }); setShowModal(true) }}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-400">Add Investment</p>
          </div>
          {investments.map((inv) => {
            const value = inv.quantity * inv.currentPrice
            const cost = inv.quantity * inv.purchasePrice
            const gain = value - cost
            const gainPercent = cost > 0 ? (gain / cost) * 100 : 0
            const typeInfo = investmentTypes.find(t => t.id === inv.type)

            return (
              <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/30 flex items-center justify-center text-xl shadow-lg" style={{boxShadow: '0 0 20px rgba(16,185,129,0.15)'}}>
                        {typeInfo?.icon || '💎'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white tracking-tight">{inv.name}</h4>
                          {inv.symbol && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                              {inv.symbol}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]">
                            {typeInfo?.label}
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">{inv.quantity} shares</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={() => openEditModal(inv)} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingInvestment(inv)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">Cost Basis</p>
                      <p className="text-sm font-bold text-white tracking-tight">{formatCurrency(cost, currency)}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${gain >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <p className="text-xs mb-1">{gain >= 0 ? 'Gain' : 'Loss'}</p>
                      <p className={`text-sm font-bold tracking-tight ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Current: {formatCurrency(inv.currentPrice, currency)}/share</span>
                    <span className={`font-medium tracking-wide px-2 py-1 rounded-lg ${gainPercent >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                      {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingInvestment ? 'Edit Investment' : 'Add New Investment'} className="max-w-md">
        <div className="space-y-4">
          <Input
            label="Investment Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
            placeholder={investmentExamples.join(', ')}
          />
          <Input
            label="Symbol (optional)"
            value={formData.symbol}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, symbol: e.target.value})}
            placeholder={getSymbolPlaceholder()}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-muted">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {investmentTypes.map((t) => (
                <button key={t.id} type="button" onClick={() => setFormData({...formData, type: t.id as Investment['type']})} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all border ${formData.type === t.id ? 'border-emerald-500/50 bg-emerald-500/20 text-white' : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'}`}>
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, quantity: e.target.value})}
              placeholder="0.00"
            />
            <Input
              label="Current Price"
              type="number"
              value={formData.currentPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, currentPrice: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Purchase Price"
              type="number"
              value={formData.purchasePrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, purchasePrice: e.target.value})}
              placeholder="0.00"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Purchase Date</label>
              <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="glass-input w-full" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button type="button" variant="primary" className="flex-1" onClick={handleSubmit}>{editingInvestment ? 'Update' : 'Add'} Investment</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingInvestment} onClose={() => setDeletingInvestment(null)} title="Delete Investment?" className="max-w-sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-muted text-sm mb-6">
            This will permanently delete <span className="text-white font-medium">{deletingInvestment?.name}</span>. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setDeletingInvestment(null)} className="flex-1">Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}