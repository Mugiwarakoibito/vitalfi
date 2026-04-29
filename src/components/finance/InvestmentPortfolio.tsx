import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Plus, Wallet, PieChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { storage, type Investment } from '@/lib/storage'

const investmentTypes = [
  { id: 'stock', label: 'Stock' },
  { id: 'etf', label: 'ETF' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'bond', label: 'Bond' },
  { id: 'realestate', label: 'Real Estate' },
  { id: 'other', label: 'Other' },
]

export function InvestmentPortfolio() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock' as Investment['type'],
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadInvestments()
  }, [])

  const loadInvestments = async () => {
    const data = await storage.getAll('investments')
    setInvestments(data)
  }

  const handleSubmit = async () => {
    const investment: Investment = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name: formData.name,
      symbol: formData.symbol,
      type: formData.type,
      quantity: Number(formData.quantity),
      purchasePrice: Number(formData.purchasePrice),
      currentPrice: Number(formData.currentPrice),
      purchaseDate: formData.purchaseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('investments', investment)
    loadInvestments()
    setShowModal(false)
    setFormData({
      name: '',
      symbol: '',
      type: 'stock',
      quantity: '',
      purchasePrice: '',
      currentPrice: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    })
  }

  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0)
  const totalCost = investments.reduce((sum, inv) => sum + inv.quantity * inv.purchasePrice, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Wallet className="w-4 h-4" />
              Total Value
            </div>
            <div className="text-2xl font-bold text-white">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <PieChart className="w-4 h-4" />
              Total Gain/Loss
            </div>
            <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              {totalGainPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              Return %
            </div>
            <div className={`text-2xl font-bold ${totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Portfolio</h3>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Investment
        </Button>
      </div>

      {investments.length === 0 ? (
        <Card className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
          <CardContent className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No investments yet</p>
            <p className="text-gray-500 text-sm">Add your first investment to track your portfolio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {investments.map((inv) => {
            const value = inv.quantity * inv.currentPrice
            const cost = inv.quantity * inv.purchasePrice
            const gain = value - cost
            const gainPercent = cost > 0 ? (gain / cost) * 100 : 0
            return (
              <Card key={inv.id} className="backdrop-blur-xl bg-gray-900/50 border border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{inv.name}</h4>
                        {inv.symbol && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            {inv.symbol}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {inv.quantity} shares @ ${inv.currentPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">
                        ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {gain >= 0 ? '+' : ''}${gain.toFixed(2)} ({gainPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Investment">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Apple Inc."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Symbol (optional)"
            placeholder="e.g., AAPL"
            value={formData.symbol}
            onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {investmentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t.id as Investment['type'] })}
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
              label="Quantity"
              type="number"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <Input
              label="Purchase Price"
              type="number"
              placeholder="0.00"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Current Price"
              type="number"
              placeholder="0.00"
              value={formData.currentPrice}
              onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
            />
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
          <Button variant="primary" onClick={handleSubmit} className="w-full">
            Add Investment
          </Button>
        </div>
      </Modal>
    </div>
  )
}