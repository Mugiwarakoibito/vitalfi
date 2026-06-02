import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Plus, X, Flame, TrendingUp, RefreshCw,
  BarChart3, Settings, Target, Sparkles, ChevronLeft, ChevronRight,
  Calendar, RotateCcw, Brain, Star,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { HydrationEntry } from '@/types/fitness'

const HYDRATION_GOAL_DEFAULT = 2500

function getStreak(hydration: HydrationEntry[], goal: number): number {
  let streak = 0; const d = new Date()
  while (streak < 365) {
    const ds = d.toISOString().split('T')[0]
    const total = hydration.filter(h => h.date === ds).reduce((s, h) => s + h.amount, 0)
    if (total < goal - 100) break
    streak++; d.setDate(d.getDate() - 1)
  }
  return streak
}

export function HydrationHub() {
  const { hydration, addHydration, deleteHydration } = useAppStore()

  const [showIntake, setShowIntake] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [chartMode, setChartMode] = useState<'bar' | 'area'>('area')
  const [showGoalLine, setShowGoalLine] = useState(true)
  const [customAmount, setCustomAmount] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])

  const [hydGoal, setHydGoal] = useState(() => {
    const saved = localStorage.getItem('vitalfi_hydration_goal')
    return saved ? parseInt(saved) : HYDRATION_GOAL_DEFAULT
  })
  const [unit, setUnit] = useState<'ml' | 'oz'>(() => {
    return (localStorage.getItem('vitalfi_hydration_unit') as 'ml' | 'oz') || 'ml'
  })
  const [quickAmounts, setQuickAmounts] = useState<number[]>(() => {
    const saved = localStorage.getItem('vitalfi_quick_water')
    return saved ? JSON.parse(saved) : [250, 500, 750, 1000]
  })

  useEffect(() => { localStorage.setItem('vitalfi_hydration_goal', hydGoal.toString()) }, [hydGoal])
  useEffect(() => { localStorage.setItem('vitalfi_hydration_unit', unit) }, [unit])
  useEffect(() => { localStorage.setItem('vitalfi_quick_water', JSON.stringify(quickAmounts)) }, [quickAmounts])

  const today = new Date().toISOString().split('T')[0]
  const hUnit = (ml: number) => unit === 'oz' ? Math.round(ml / 29.57) : ml
  const hLabel = unit

  const todayHydration = useMemo(() =>
    hydration.filter(h => h.date === today).reduce((s, h) => s + h.amount, 0),
  [hydration, today])

  const todayProgress = useMemo(() => Math.min(todayHydration / hydGoal, 1), [todayHydration, hydGoal])

  const hydrationWeek = useMemo(() => {
    const days: { date: string; label: string; amount: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const total = hydration.filter(h => h.date === ds).reduce((s, h) => s + h.amount, 0)
      days.push({ date: ds, label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }), amount: total })
    }
    return days
  }, [hydration])

  const streak = useMemo(() => getStreak(hydration, hydGoal), [hydration, hydGoal])

  const weekTotal = useMemo(() => hydrationWeek.reduce((s, d) => s + d.amount, 0), [hydrationWeek])
  const weekAvg = useMemo(() => {
    const withData = hydrationWeek.filter(d => d.amount > 0)
    return withData.length > 0 ? Math.round(withData.reduce((s, d) => s + d.amount, 0) / withData.length) : 0
  }, [hydrationWeek])
  const goalDays = useMemo(() => hydrationWeek.filter(d => d.amount >= hydGoal).length, [hydrationWeek, hydGoal])

  const todayLogs = useMemo(() =>
    [...hydration].filter(h => h.date === today)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  [hydration, today])

  const targetLogs = useMemo(() =>
    [...hydration].filter(h => h.date === targetDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  [hydration, targetDate])

  const hydMostUsed = useMemo(() => {
    const amounts = hydration.filter(h => h.amount > 0).map(h => h.amount)
    if (!amounts.length) return 250
    const freq: Record<number, number> = {}
    amounts.forEach(a => { freq[a] = (freq[a] || 0) + 1 })
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
  }, [hydration])

  const hydLastAmount = useMemo(() => {
    if (!todayLogs.length) return 0
    return todayLogs[todayLogs.length - 1].amount
  }, [todayLogs])

  const suggestedAmount = useMemo(() => {
    if (todayHydration >= hydGoal) return 0
    const remaining = hydGoal - todayHydration
    if (remaining <= 250) return remaining
    if (hydLastAmount && hydLastAmount > 0) return hydLastAmount
    return hydMostUsed
  }, [todayHydration, hydGoal, hydLastAmount, hydMostUsed])

  const qualityScore = useMemo(() => {
    if (hydration.length < 3) return 0
    const consistency = goalDays / 7
    const regularity = weekAvg > 0 ? Math.min(weekAvg / hydGoal, 1) : 0
    return Math.round((consistency * 0.4 + regularity * 0.3 + todayProgress * 0.3) * 100)
  }, [hydration, goalDays, weekAvg, hydGoal, todayProgress])

  const sortedPresets = useMemo(() => {
    const freq: Record<number, number> = {}
    hydration.forEach(h => { freq[h.amount] = (freq[h.amount] || 0) + 1 })
    return [...quickAmounts].sort((a, b) => (freq[b] || 0) - (freq[a] || 0))
  }, [quickAmounts, hydration])

  const addWater = (amount: number) => {
    addHydration({
      id: generateId(), date: today, amount, timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  }

  const clearToday = () => {
    todayLogs.forEach(h => deleteHydration(h.id))
  }

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const navigateDate = (dir: number) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + dir)
    setTargetDate(formatDate(d))
  }

  const isToday = targetDate === formatDate(new Date())
  const usableLogs = isToday ? todayLogs : targetLogs

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setTargetDate(formatDate(new Date()))} className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowIntake(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showIntake ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Intake Dashboard">
            <Droplets className="w-5 h-5" />
          </button>
          <button onClick={() => setShowHistory(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showHistory ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="7-Day History">
            <BarChart3 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowInsights(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showInsights ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Quality Insights">
            <Brain className="w-5 h-5" />
          </button>
          <div className="relative">
            <button onClick={() => setShowSettings(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-10 z-20 w-72 rounded-xl bg-slate-900 border border-white/10 shadow-2xl p-4">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Hydration Settings</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-400">Daily goal</span><span className="text-cyan-400 font-bold">{hUnit(hydGoal)}{hLabel}</span></div>
                      <input type="range" min={500} max={5000} step={100} value={hydGoal}
                        onChange={e => setHydGoal(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-cyan-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg" />
                      <div className="flex justify-between text-[10px] text-slate-600 mt-0.5"><span>0.5L</span><span>3L</span><span>5L</span></div>
                    </div>
                    <div className="flex gap-2">
                      {(['ml', 'oz'] as const).map(u => (
                        <button key={u} onClick={() => {
                          if (u !== unit) {
                            setHydGoal(u === 'oz' ? Math.round(hydGoal / 29.57) : hydGoal * 29.57)
                            setQuickAmounts(prev => prev.map(a => u === 'oz' ? Math.round(a / 29.57) : Math.round(a * 29.57)))
                            setUnit(u)
                          }
                        }}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", unit === u ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white")}>{u.toUpperCase()}</button>
                      ))}
                    </div>
                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] text-slate-500 mb-2">Quick amounts</p>
                      <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((amount, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input type="number" value={amount} min={25} max={2000} step={25}
                              onChange={e => { const a = [...quickAmounts]; a[i] = Number(e.target.value); setQuickAmounts(a) }}
                              className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-center focus:border-cyan-500/50 focus:outline-none" />
                            <span className="text-[10px] text-slate-500">{hLabel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => {
            if (suggestedAmount > 0) addWater(suggestedAmount)
            else addWater(250)
          }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Water
          </Button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Today', value: `${hUnit(todayHydration)}${hLabel}`, sub: `${Math.round(todayProgress * 100)}% of ${hUnit(hydGoal)}${hLabel}`, color: '#06b6d4', icon: Droplets },
          { label: 'Progress', value: `${Math.round(todayProgress * 100)}%`, sub: todayHydration >= hydGoal ? 'Goal met!' : `${hUnit(hydGoal - todayHydration)}${hLabel} to go`, color: '#22d3ee', icon: Target },
          { label: 'Streak', value: `${streak}d`, sub: streak === 1 ? '1 day' : `${streak} day streak`, color: '#f59e0b', icon: Flame },
          { label: 'Week Avg', value: `${hUnit(weekAvg)}${hLabel}`, sub: `${goalDays}/7 on goal`, color: '#a855f7', icon: TrendingUp },
          { label: 'Quality', value: qualityScore > 0 ? `${qualityScore}` : '--', sub: qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Building', color: '#10b981', icon: Sparkles },
          { label: 'Best Day', value: (() => { const best = [...hydrationWeek].sort((a, b) => b.amount - a.amount)[0]; return best && best.amount > 0 ? hUnit(best.amount) + hLabel : '--' })(), sub: (() => { const best = [...hydrationWeek].sort((a, b) => b.amount - a.amount)[0]; return best && best.amount > 0 ? best.label : 'No data' })(), color: '#f43f5e', icon: Star },
        ].map((stat) => (
          <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg min-h-[7.5rem]">
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 blur-xl" style={{ background: `${stat.color}20` }} />
            <div className="relative h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1" style={{ color: stat.color }}><stat.icon size={14} /><span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">{stat.label}</span></div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Intake Dashboard Panel */}
      <AnimatePresence>{showIntake && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5 pointer-events-none" />
            <div className="relative space-y-4">
              {/* Today's Status */}
              <div className="flex items-center gap-4 bg-cyan-500/[0.03] rounded-xl border border-cyan-500/10 p-4">
                <div className="relative shrink-0">
                  <svg width="64" height="64" className="transform -rotate-90" style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }}>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#06b6d4" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 26}`} strokeDashoffset={`${2 * Math.PI * 26 * (1 - todayProgress)}`}
                      strokeLinecap="round" className="transition-all duration-700" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-black text-cyan-400">
                    {Math.round(todayProgress * 100)}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-white">{hUnit(todayHydration)}</span>
                    <span className="text-sm text-slate-500">of {hUnit(hydGoal)}{hLabel}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="text-cyan-400 font-bold">{hUnit(weekTotal)}</span> this week
                    </span>
                    <span className="w-px h-3 bg-white/[0.06]" />
                    <span className="flex items-center gap-1">
                      <span className={goalDays >= 5 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{goalDays}</span>/7 days
                    </span>
                    {todayLogs.length > 0 && (
                      <><span className="w-px h-3 bg-white/[0.06]" /><span>{todayLogs.length} drinks</span></>
                    )}
                  </div>
                  {todayHydration < hydGoal && (
                    <p className="text-xs text-cyan-400/70 mt-2">
                      {hUnit(hydGoal - todayHydration)}{hLabel} remaining
                    </p>
                  )}
                </div>
              </div>

              {/* Log Water */}
              <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/[0.03] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60" />
                  <h4 className="text-sm font-bold text-cyan-400/70 uppercase tracking-wider">Log Water</h4>
                </div>

                {isToday && todayHydration < hydGoal && suggestedAmount > 0 && (
                  <motion.button
                    onClick={() => addWater(suggestedAmount)}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="w-full mb-3 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-500/25 hover:to-sky-500/25 transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Log {hUnit(suggestedAmount)}{hLabel}
                    {todayHydration > 0 && <span className="text-xs text-cyan-400/60 font-normal">(suggested)</span>}
                  </motion.button>
                )}

                {isToday && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                    {sortedPresets.map(amount => (
                      <motion.button key={amount} onClick={() => addWater(amount)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                        className="py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-all text-sm font-bold"
                      >+{hUnit(amount)}{hLabel}</motion.button>
                    ))}
                  </div>
                )}

                {isToday && hydLastAmount > 0 && (
                  <motion.button onClick={() => addWater(hydLastAmount)} whileTap={{ scale: 0.95 }}
                    className="mb-2 text-xs text-cyan-400/60 hover:text-cyan-400 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw size={11} /> Repeat last: +{hUnit(hydLastAmount)}{hLabel}
                  </motion.button>
                )}

                <div className="flex gap-2 mt-2 pt-2 border-t border-white/[0.05]">
                  <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                    placeholder={`Custom amount (${hLabel})`}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:border-cyan-500/50 focus:outline-none transition-all" />
                  <motion.button onClick={() => { if (customAmount) { addWater(Number(customAmount)); setCustomAmount('') } }}
                    className="px-5 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/25 transition-all text-sm font-bold flex items-center gap-1.5 shrink-0"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Plus size={15} />Log
                  </motion.button>
                </div>

                {/* Today's/Date's drinks */}
                {usableLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs text-slate-500 font-semibold">
                        {isToday ? "Today's drinks" : new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </h5>
                      {isToday && (
                        <button onClick={clearToday}
                          className="text-[10px] text-slate-600 hover:text-rose-400 transition-all">Clear today</button>
                      )}
                    </div>
                    {(() => {
                      let cum = 0
                      return usableLogs.slice(-8).map((h) => {
                        cum += h.amount
                        return (
                          <div key={h.id} className="flex items-center justify-between py-0.5 text-xs border-b border-white/[0.02] last:border-0">
                            <span className="text-slate-400">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-cyan-300 font-bold">+{hUnit(h.amount)}{hLabel}</span>
                              <span className="text-[10px] text-slate-500">{hUnit(cum)}{hLabel}</span>
                              <button onClick={() => deleteHydration(h.id)} className="text-slate-600 hover:text-rose-400 transition-all"><X size={10} /></button>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>{showHistory && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-violet-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">7-Day History</h3>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button onClick={() => setChartMode(p => p === 'bar' ? 'area' : 'bar')}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border transition-all", chartMode === 'area' ? "bg-violet-500/15 border-violet-500/25 text-violet-400" : "text-slate-500 border-slate-700/50 hover:text-slate-300")}>
                    {chartMode === 'bar' ? 'Bar' : 'Area'}
                  </button>
                  <button onClick={() => setShowGoalLine(p => !p)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border transition-all", showGoalLine ? "bg-violet-500/15 border-violet-500/25 text-violet-400" : "text-slate-500 border-slate-700/50 hover:text-slate-300")}>
                    Goal
                  </button>
                </div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'area' ? (
                    <AreaChart data={hydrationWeek} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, hydGoal * 1.3]} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [`${hUnit(value)}${hLabel}`, 'Hydration']} labelFormatter={(l) => `${l}`} />
                      <defs><linearGradient id="hydAreaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                      <Area type="monotone" dataKey="amount" stroke="#22d3ee" fill="url(#hydAreaGrad)" strokeWidth={2}
                        dot={{ fill: '#22d3ee', r: 3, strokeWidth: 0 }} />
                      {showGoalLine && <ReferenceLine y={hydGoal} stroke="#22d3ee" strokeDasharray="4 3" strokeWidth={1.5} />}
                    </AreaChart>
                  ) : (
                    <BarChart data={hydrationWeek} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, hydGoal * 1.3]} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [`${hUnit(value)}${hLabel}`, 'Hydration']} labelFormatter={(l) => `${l}`} />
                      <defs>{hydrationWeek.map((entry, idx) => {
                        const meetsGoal = entry.amount >= hydGoal
                        return (<linearGradient key={idx} id={`hydBarGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={entry.amount > 0 ? (meetsGoal ? '#22d3ee' : '#fbbf24') : '#1e293b'} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={entry.amount > 0 ? (meetsGoal ? '#0891b2' : '#d97706') : '#1e293b'} stopOpacity={0.35} />
                        </linearGradient>)
                      })}</defs>
                      <Bar dataKey="amount" radius={[3, 3, 0, 0]} maxBarSize={28}>
                        {hydrationWeek.map((entry, idx) => (
                          <rect key={idx} fill={`url(#hydBarGrad${idx})`} rx={3}
                            style={entry.amount > 0 ? { filter: `drop-shadow(0 0 ${entry.amount >= hydGoal ? '5px' : '2px'} ${entry.amount >= hydGoal ? '#22d3ee' : '#fbbf24'}40)` } : undefined} />
                        ))}
                      </Bar>
                      {showGoalLine && <ReferenceLine y={hydGoal} stroke="#22d3ee" strokeDasharray="4 3" strokeWidth={1.5} />}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-white/[0.05]">
                <span>Total: <span className="font-bold text-violet-400">{hUnit(weekTotal)}{hLabel}</span></span>
                <span>Avg: <span className="font-bold text-violet-400">{hUnit(weekAvg)}{hLabel}</span></span>
                <span>Goals: <span className={goalDays >= 5 ? "font-bold text-emerald-400" : "font-bold text-amber-400"}>{goalDays}/7</span></span>
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Insights Panel */}
      <AnimatePresence>{showInsights && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <Brain size={14} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quality Insights</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Hydration Score', value: qualityScore > 0 ? `${qualityScore}/100` : '--', color: qualityScore >= 80 ? '#10b981' : qualityScore >= 50 ? '#f59e0b' : '#6b7280', desc: qualityScore >= 80 ? 'Excellent habits' : qualityScore >= 50 ? 'Building consistency' : 'Need more data' },
                  { label: 'Goal Adherence', value: `${Math.round(goalDays / 7 * 100)}%`, color: goalDays >= 5 ? '#10b981' : '#f59e0b', desc: `${goalDays}/7 days hit goal` },
                  { label: 'Consistency', value: hydration.length > 0 ? `${Math.round(hydration.filter(h => {
                    const d = new Date(h.date)
                    const wk = new Date(); wk.setDate(wk.getDate() - 7)
                    return d >= wk
                  }).length > 0 ? (hydrationWeek.filter(d => d.amount > 0).length / 7) * 100 : 0)}%` : '--', color: '#06b6d4', desc: 'Days with data this week' },
                  { label: 'Streak Status', value: streak > 0 ? `${streak}d` : 'None', color: streak >= 7 ? '#10b981' : streak > 0 ? '#f59e0b' : '#6b7280', desc: streak >= 14 ? 'Legend' : streak >= 7 ? 'Consistent' : streak > 0 ? 'Starting' : 'Log to start!' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">{item.label}</p>
                    <p className="text-xl font-black text-white" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
                {hydrationWeek.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={cn("w-3 h-3 rounded-full",
                      d.amount >= hydGoal ? "bg-cyan-400 shadow-[0_0_6px_#06b6d4]" :
                      d.amount > 0 ? "bg-amber-500/60" : "bg-slate-700")} />
                    <span className="text-[10px] text-slate-500 font-medium">{d.label.slice(0, 2)}</span>
                  </div>
                ))}
                <span className="text-[10px] text-slate-600 ml-auto">Goal • Partial • Miss</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

    </div>
  )
}
