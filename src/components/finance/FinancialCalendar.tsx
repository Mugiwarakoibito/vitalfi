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
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-xs mb-1">
              <TrendingUp size={14} />
              <span>Income</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalIncomeMonth, settings.currency || 'USD')}
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full -mr-8 -mt-8" />
          <div className="relative">
            <div className="flex items-center gap-2 text-red-400/80 text-xs mb-1">
              <TrendingDown size={14} />
              <span>Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
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
                    {day.transactions.map(txn => (
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
    </div>
  )
}