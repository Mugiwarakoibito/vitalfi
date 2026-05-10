import { Flame } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function StreakStatus() {
  const { appMode, workouts, meals, sleep, transactions, accounts } = useAppStore()
  
  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0
    const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < sortedDates.length; i++) {
      const checkDate = new Date(currentDate)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      if (dates.includes(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      } else {
        return 0
      }
    }
    return streak
  }
  
  const financeDates = transactions.map(t => t.date.split('T')[0])
  const fitnessDates = [
    ...workouts.map(w => w.date.split('T')[0]),
    ...meals.map(m => m.date.split('T')[0]),
    ...sleep.map(s => s.date.split('T')[0])
  ]
  
  const financeStreak = calculateStreak(financeDates)
  const fitnessStreak = calculateStreak(fitnessDates)
  const globalStreak = Math.max(financeStreak, fitnessStreak)
  
  const hasData = transactions.length > 0 || accounts.length > 0 || workouts.length > 0 || meals.length > 0 || sleep.length > 0
  
  if (!hasData) return null
  
  return (
    <div className="flex items-center gap-6 glass-card px-6 py-3 border-white/5 bg-white/[0.02] w-fit">
      <div className="flex items-center gap-3 pr-6 border-r border-white/10">
        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
          <Flame size={18} fill={globalStreak > 0 ? "currentColor" : "none"} />
        </div>
        <div>
          <p className="text-xl font-black text-white tracking-tighter">{globalStreak > 0 ? globalStreak : '--'}</p>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Current Streak</p>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
           <div className={cn("h-1.5 w-1.5 rounded-full", appMode === 'finance' ? "bg-cyan-500" : "bg-slate-700")} />
           <div>
              <p className="text-xs font-black text-white leading-none">{financeStreak > 0 ? financeStreak : '--'}</p>
              <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Finance Streak</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={cn("h-1.5 w-1.5 rounded-full", appMode === 'fitness' ? "bg-purple-500" : "bg-slate-700")} />
           <div>
              <p className="text-xs font-black text-white leading-none">{fitnessStreak > 0 ? fitnessStreak : '--'}</p>
              <p className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">Fitness Streak</p>
           </div>
        </div>
      </div>
    </div>
  )
}
