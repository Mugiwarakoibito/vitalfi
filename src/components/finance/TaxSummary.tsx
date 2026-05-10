import { useMemo } from 'react'
import { Scale, Receipt, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { useAppStore } from '@/store/useAppStore'

export function TaxSummary() {
  const { transactions, subscriptions, investments } = useAppStore()

  const taxData = useMemo(() => {
    const year = new Date().getFullYear()
    
    const yearIncome = transactions.filter(t => {
      const d = new Date(t.date)
      return t.type === 'income' && d.getFullYear() === year
    }).reduce((sum, t) => sum + t.amount, 0)

    const yearExpenses = transactions.filter(t => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getFullYear() === year
    }).reduce((sum, t) => sum + t.amount, 0)

    const deductibleExpenses = yearExpenses * 0.3

    const annualSubs = subscriptions.reduce((sum, s) => sum + (s.amount * 12), 0)
    const annualInvestments = investments.reduce((sum, i) => sum + ((i.quantity * i.currentPrice) - (i.quantity * i.purchasePrice)), 0)

    const estimatedTax = (yearIncome - deductibleExpenses - 14600) * 0.22

    return {
      year,
      grossIncome: yearIncome,
      totalExpenses: yearExpenses,
      deductibleAmount: deductibleExpenses,
      annualSubscriptions: annualSubs,
      capitalGains: annualInvestments > 0 ? annualInvestments : 0,
      estimatedTax: Math.max(0, estimatedTax),
      effectiveRate: yearIncome > 0 ? (Math.max(0, estimatedTax) / yearIncome) * 100 : 0,
    }
  }, [transactions, subscriptions, investments])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-xl">
          <Scale className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Tax Summary {taxData.year}</h2>
          <p className="text-xs text-slate-500">Estimated tax liability</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Gross Income</p>
                <p className="text-xl font-black text-white">${taxData.grossIncome.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-xl">
                <Receipt className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Deductible (Est.)</p>
                <p className="text-xl font-black text-white">${taxData.deductibleAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Percent className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Est. Tax</p>
                <p className="text-xl font-black text-white">${taxData.estimatedTax.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">{taxData.effectiveRate.toFixed(1)}% effective rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/5">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Deduction Breakdown</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Standard Deduction</span>
              <span className="text-white font-bold">$14,600</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Business Expenses (Est. 30%)</span>
              <span className="text-white font-bold">${taxData.deductibleAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">Subscriptions (Business)</span>
              <span className="text-white font-bold">${taxData.annualSubscriptions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">Capital Gains</span>
              <span className="text-white font-bold">${taxData.capitalGains.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-600 text-center">
        * This is an estimate only. Consult a tax professional for accurate filing.
      </p>
    </div>
  )
}