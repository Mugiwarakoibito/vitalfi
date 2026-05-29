import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, cn } from '@/lib/utils'

interface CalendarDay {
  date: string
  day: number
  transactions: { id: string; type: 'income' | 'expense' | 'transfer'; amount: number; description: string; category?: string }[]
  totalIncome: number
  totalExpense: number
}

interface FinancialCalendarProps {
  initialTransactions?: { id: string; type: 'income' | 'expense' | 'transfer'; amount: number; description: string; date: string; category?: string }[]
}

export function FinancialCalendar({ initialTransactions = [] }: FinancialCalendarProps) {
  const storeTransactions = useAppStore().transactions
  const transactions = initialTransactions.length > 0 ? initialTransactions : storeTransactions
  const { settings } = useAppStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: CalendarDay[] = []

    // Get all transactions for this month
    const monthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate.getFullYear() === year && txDate.getMonth() === month
    })

    // Build calendar days
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(year, month, i + 1)
      const dateStr = date.toISOString().split('T')[0]
      const dayTxns = monthTransactions.filter(t => t.date.startsWith(dateStr))

      days.push({
        date: dateStr,
        day: i + 1,
        transactions: dayTxns,
        totalIncome: dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        totalExpense: dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      })
    }

    return { days, startingDay, daysInMonth, monthName: monthNames[month], year }
  }, [transactions, currentDate])

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const totalIncomeMonth = calendarData.days.reduce((s, d) => s + d.totalIncome, 0)
  const totalExpenseMonth = calendarData.days.reduce((s, d) => s + d.totalExpense, 0)

  return (
    <div className="space-y-5">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <h3 className="text-lg font-bold text-white min-w-[160px] text-center">
            {calendarData.monthName} {calendarData.year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-xs font-medium text-muted hover:text-white transition-colors"
        >
          Today
        </button>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <TrendingUp size={16} />
              <span>Income</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">
              {formatCurrency(totalIncomeMonth, settings.currency || 'USD')}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-sm mb-2">
              <TrendingDown size={16} />
              <span>Expenses</span>
            </div>
            <p className="text-3xl font-bold text-red-400 drop-shadow-lg">
              {formatCurrency(totalExpenseMonth, settings.currency || 'USD')}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-[10px] font-bold text-muted uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before first of month */}
          {Array(calendarData.startingDay).fill(null).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] bg-white/[0.02]" />
          ))}

          {/* Actual days */}
          {calendarData.days.map(day => {
            const isToday = day.date === new Date().toISOString().split('T')[0]
            const hasTransactions = day.transactions.length > 0
            const isExpenseDay = day.totalExpense > day.totalIncome
            const isIncomeDay = day.totalIncome > day.totalExpense

            return (
              <div
                key={day.date}
                className={cn(
                  "min-h-[100px] p-2 border-t border-r border-white/5 hover:bg-white/[0.02] transition-colors",
                  hasTransactions && "cursor-pointer"
                )}
              >
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isToday ? "text-purple-400" : "text-slate-500"
                )}>
                  {day.day}
                </div>
                
                {hasTransactions && (
                  <div className="space-y-1">
                    {day.transactions.slice(0, 3).map(txn => (
                      <div
                        key={txn.id}
                        className={cn(
                          "text-[10px] px-1 py-0.5 rounded truncate",
                          txn.type === 'income' 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-red-500/20 text-red-400"
                        )}
                      >
                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, settings.currency || 'USD')}
                      </div>
                    ))}
                    {day.transactions.length > 3 && (
                      <div 
                        onClick={() => setSelectedDay(day)}
                        className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white font-medium cursor-pointer hover:bg-white/20"
                      >
                        +{day.transactions.length - 3} more
                      </div>
                    )}
                  </div>
                )}

                {/* Daily indicator */}
                {hasTransactions && (
                  <div className="flex gap-1 mt-1">
                    {isIncomeDay && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    {isExpenseDay && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Expense</span>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedDay(null)}>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDay.transactions.map(txn => (
                <div key={txn.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <span className="text-white text-sm">{txn.description || txn.category || 'Transaction'}</span>
                  <span className={cn("font-medium", txn.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, settings.currency || 'USD')}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedDay(null)} className="mt-4 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}