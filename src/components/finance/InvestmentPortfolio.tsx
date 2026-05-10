import { useState } from 'react'
import { TrendingUp, TrendingDown, Plus, Wallet, PieChart, Pencil, Trash2, AlertTriangle } from 'lucide-react'
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
    quantity: '0.00',
    purchasePrice: '0.00',
    currentPrice: '0.00',
    purchaseDate: new Date().toISOString().split('T')[0],
  })

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
    setFormData({ name: '', symbol: '', type: 'stock', quantity: '0.00', purchasePrice: '0.00', currentPrice: '0.00', purchaseDate: new Date().toISOString().split('T')[0] })
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
              <Wallet className="w-4 h-4" />
              <span>Total Value</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalValue, currency)}</p>
            <p className="text-xs text-gray-500 mt-1">{investments.length} holding{investments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-2">
              <PieChart className="w-4 h-4" />
              <span>Total Gain/Loss</span>
            </div>
            <p className={`text-3xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain, currency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Since purchase</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-2">
              {totalGainPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>Return</span>
            </div>
            <p className={`text-3xl font-bold ${totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">ROI</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Investment Portfolio</h3>
        <button onClick={() => { setEditingInvestment(null); setShowModal(true) }} className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 hover:bg-emerald-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No investments yet</p>
          <p className="text-gray-500 text-sm">Add your first investment to track your portfolio</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investments.map((inv) => {
            const value = inv.quantity * inv.currentPrice
            const cost = inv.quantity * inv.purchasePrice
            const gain = value - cost
            const gainPercent = cost > 0 ? (gain / cost) * 100 : 0
            const typeInfo = investmentTypes.find(t => t.id === inv.type)

            return (
              <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                      {typeInfo?.icon || '💎'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{inv.name}</h4>
                        {inv.symbol && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            {inv.symbol}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{typeInfo?.label} • {inv.quantity} shares</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(inv)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingInvestment(inv)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Current</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(inv.currentPrice, currency)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Total Value</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(value, currency)}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${gain >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <p className="text-xs mb-1">{gain >= 0 ? 'Gain' : 'Loss'}</p>
                    <p className={`text-sm font-bold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {gain >= 0 ? '+' : ''}{formatCurrency(gain, currency)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Cost basis: {formatCurrency(cost, currency)}</span>
                  <span className={`font-medium ${gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">{editingInvestment ? 'Edit Investment' : 'Add New Investment'}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Investment Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all" placeholder="Apple Inc., Microsoft, Bitcoin, Vanguard ETF, Real Estate Property" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Symbol (optional)</label>
                <input type="text" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all" placeholder={formData.name.toLowerCase().includes('apple') ? 'AAPL' : formData.name.toLowerCase().includes('microsoft') ? 'MSFT' : formData.name.toLowerCase().includes('google') ? 'GOOGL' : formData.name.toLowerCase().includes('amazon') ? 'AMZN' : formData.name.toLowerCase().includes('bitcoin') ? 'BTC' : formData.name.toLowerCase().includes('ethereum') ? 'ETH' : 'AAPL, MSFT, GOOGL'} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {investmentTypes.map((t) => (
                    <button key={t.id} onClick={() => setFormData({...formData, type: t.id as Investment['type']})} className={`relative overflow-hidden p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${formData.type === t.id ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10'}`}>
                      <span>{t.icon}</span>
                      <span className="truncate">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                  <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Current Price</label>
                  <input type="number" value={formData.currentPrice} onChange={e => setFormData({...formData, currentPrice: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Purchase Price</label>
                  <input type="number" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Purchase Date</label>
                  <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none transition-all" />
                </div>
              </div>
              <button onClick={handleSubmit} className="w-full px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all">
                {editingInvestment ? 'Update Investment' : 'Add Investment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingInvestment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingInvestment(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Investment?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              This will permanently delete <span className="text-white font-medium">{deletingInvestment.name}</span>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingInvestment(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">
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