import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Plus, Trash2,
  Target, ChevronLeft, ChevronRight,
  Calendar, RotateCcw, Brain, Clock,
  TrendingUp, TrendingDown, Activity, BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
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

  const [showInsights, setShowInsights] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formAmount, setFormAmount] = useState(0)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formTime, setFormTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
  const [formNote, setFormNote] = useState('')
  const [formDrinkType, setFormDrinkType] = useState<'water' | 'coffee' | 'tea' | 'juice' | 'sports' | 'other'>('water')
  const [formThirst, setFormThirst] = useState<'none' | 'slight' | 'thirsty' | 'very'>('none')
  const [formExercise, setFormExercise] = useState(false)
  const [formHotWeather, setFormHotWeather] = useState(false)
  const [formCaffeine, setFormCaffeine] = useState(false)
  const [formWithMeal, setFormWithMeal] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<HydrationEntry | null>(null)
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])

  const [hydGoal, setHydGoal] = useState(() => {
    const saved = localStorage.getItem('vitalfi_hydration_goal')
    return saved ? parseInt(saved) : HYDRATION_GOAL_DEFAULT
  })
  const [unit, setUnit] = useState<'ml' | 'oz'>(() => {
    return (localStorage.getItem('vitalfi_hydration_unit') as 'ml' | 'oz') || 'ml'
  })
  const [quickAmounts, setQuickAmounts] = useState<number[]>([240, 480, 720, 960])
  const [insightTab, setInsightTab] = useState<'metrics' | 'analyzer' | 'projections'>('metrics')

  useEffect(() => { localStorage.setItem('vitalfi_hydration_goal', hydGoal.toString()) }, [hydGoal])
  useEffect(() => { localStorage.setItem('vitalfi_hydration_unit', unit) }, [unit])
  useEffect(() => { localStorage.setItem('vitalfi_quick_water', JSON.stringify(quickAmounts)) }, [quickAmounts])

  const today = new Date().toISOString().split('T')[0]
  const hUnit = (ml: number) => unit === 'oz' ? Math.round(ml / 29.57) : ml
  const hLabel = unit

  const todayHydration = useMemo(() =>
    hydration.filter(h => h.date === today).reduce((s, h) => s + h.amount, 0),
  [hydration, today])

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
  const daysLogged = useMemo(() => hydrationWeek.filter(d => d.amount > 0).length, [hydrationWeek])
  const goalMetThisWeek = useMemo(() => hydrationWeek.filter(d => d.amount >= hydGoal).length, [hydrationWeek, hydGoal])
  const weekAvg = useMemo(() => {
    const withData = hydrationWeek.filter(d => d.amount > 0)
    return withData.length > 0 ? Math.round(withData.reduce((s, d) => s + d.amount, 0) / withData.length) : 0
  }, [hydrationWeek])

  const bestDay = useMemo(() => {
    if (!hydrationWeek.length) return { amount: 0, label: '--' }
    return hydrationWeek.reduce((best, d) => d.amount > best.amount ? d : best, hydrationWeek[0])
  }, [hydrationWeek])

  const qualityScore = useMemo(() => {
    if (!daysLogged) return 0
    const consistencyWeight = 0.4
    const goalHitWeight = 0.6
    const consistency = daysLogged / 7
    const goalHitRate = goalMetThisWeek / Math.max(daysLogged, 1)
    return Math.round((consistency * consistencyWeight + goalHitRate * goalHitWeight) * 100)
  }, [daysLogged, goalMetThisWeek])

  const todayLogs = useMemo(() =>
    [...hydration].filter(h => h.date === today)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  [hydration, today])

  const resetForm = () => {
    setFormAmount(0); setFormDate(new Date().toISOString().split('T')[0])
    setFormTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    setFormNote(''); setFormDrinkType('water'); setFormThirst('none')
    setFormExercise(false); setFormHotWeather(false); setFormCaffeine(false); setFormWithMeal(false)
  }

  const addWater = (amount: number, date?: string, time?: string, note?: string) => {
    const entryDate = date || today
    const entryTime = time || new Date().toISOString()
    const timestamp = entryTime.includes('T') ? entryTime : `${entryDate}T${entryTime}:00`
    addHydration({
      id: generateId(), date: entryDate, amount, timestamp,
      drinkType: formDrinkType, thirst: formThirst,
      exercise: formExercise || undefined,
      hotWeather: formHotWeather || undefined,
      caffeine: formCaffeine || undefined,
      withMeal: formWithMeal || undefined,
      note: note || undefined,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  }

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const navigateDate = (dir: number) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + dir)
    setTargetDate(formatDate(d))
  }

  const isToday = targetDate === formatDate(new Date())

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
          <button onClick={() => setShowInsights(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showInsights ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="HydraScope">
            <Brain size={16} />
          </button>
          <div className="relative">
            <button onClick={() => setShowSettings(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
              title="Hydration Target">
              <Target size={16} />
            </button>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-10 z-20 w-72 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-4">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-3">WATER TARGET</p>
                  <input type="range" min={500} max={5000} step={100} value={hydGoal}
                    onChange={e => setHydGoal(Number(e.target.value))}
                    className="w-full accent-violet-500" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-gray-500">{hUnit(500)}{hLabel}</span>
                    <span className="text-sm font-bold text-violet-400 drop-shadow-lg">{hUnit(hydGoal)}{hLabel}</span>
                    <span className="text-[11px] text-gray-500">{hUnit(5000)}{hLabel}</span>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                    {(['ml', 'oz'] as const).map(u => (
                      <button key={u} onClick={() => {
                        if (u !== unit) {
                          setHydGoal(u === 'oz' ? Math.round(hydGoal / 29.57) : Math.round(hydGoal * 29.57 / 50) * 50)
                          setQuickAmounts(prev => prev.map(a => u === 'oz' ? Math.round(a / 29.57) : Math.round(a * 29.57 / 10) * 10))
                          setUnit(u)
                        }
                      }}
                        className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", unit === u ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white")}>{u.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Water
          </Button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {/* Today */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-cyan-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-cyan-400/80 text-sm mb-1">
              <Droplets className="w-4 h-4" />
              <span>Today</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400 drop-shadow-lg">{todayHydration > 0 ? `${hUnit(todayHydration)}` : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{todayHydration > 0 ? hLabel : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{todayHydration > 0 ? `${Math.round((todayHydration / hydGoal) * 100)}% of ${hUnit(hydGoal)}${hLabel}` : 'No drinks logged'}</p>
          </div>
        </div>
        {/* Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-violet-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-1">
              <Target className="w-4 h-4" />
              <span>Progress</span>
            </div>
            <p className="text-3xl font-bold text-violet-400 drop-shadow-lg">{todayHydration > 0 ? `${Math.round((todayHydration / hydGoal) * 100)}` : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{todayHydration > 0 ? '%' : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{todayHydration >= hydGoal ? 'Goal reached!' : todayHydration > 0 ? `${hUnit(hydGoal - todayHydration)}${hLabel} to go` : 'No data'}</p>
          </div>
        </div>
        {/* Streak */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Streak</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{streak > 0 ? streak : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{streak > 0 ? 'd' : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{streak > 0 ? `${streak}-day streak` : 'No streak'}</p>
          </div>
        </div>
        {/* Week Avg */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-sky-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Week Avg</span>
            </div>
            <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">{todayHydration > 0 ? `${hUnit(weekAvg)}` : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{todayHydration > 0 ? hLabel : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{todayHydration > 0 ? `${goalMetThisWeek}/${daysLogged} on goal` : 'No data'}</p>
          </div>
        </div>
        {/* Quality */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
              <Brain className="w-4 h-4" />
              <span>Quality</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{daysLogged >= 3 ? qualityScore : '--'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {todayHydration > 0 ? (daysLogged >= 7 ? 'Consistent' : daysLogged >= 3 ? 'Building' : daysLogged > 0 ? 'Getting started' : 'No data') : 'No data'}
            </p>
          </div>
        </div>
        {/* Best Day */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Best Day</span>
            </div>
            <p className="text-3xl font-bold text-rose-400 drop-shadow-lg">{todayHydration > 0 ? `${hUnit(bestDay.amount)}` : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{todayHydration > 0 ? hLabel : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{bestDay.amount > 0 ? bestDay.label : 'No data'}</p>
          </div>
        </div>
      </motion.div>

      {/* Empty State / Logged Entries */}
      {todayLogs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-xl p-10 text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5 pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
              <Droplets className="w-7 h-7 text-cyan-400/70" />
            </div>
            <p className="text-gray-400 text-sm mb-1">No drinks logged</p>
            <p className="text-gray-500 text-xs mb-4">Tap Log Water to start tracking</p>
            <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1.5" />
              Log Your First Water
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {[...todayLogs].reverse().map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(6,182,212,0.15)' }}>
                        <Droplets className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white tracking-tight">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-[10px] font-medium">
                            +{hUnit(entry.amount)}{hLabel}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {todayHydration > 0 && `${hUnit(todayLogs.filter(l => new Date(l.timestamp).getTime() <= new Date(entry.timestamp).getTime()).reduce((s, l) => s + l.amount, 0))} total today`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { deleteHydration(entry.id) }}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                      💧 {hUnit(entry.amount)}{hLabel}
                    </span>
                    {(() => {
                      const runningTotal = todayLogs.filter(l => new Date(l.timestamp).getTime() <= new Date(entry.timestamp).getTime()).reduce((s, l) => s + l.amount, 0)
                      const pct = Math.round((runningTotal / hydGoal) * 100)
                      return (
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${pct >= 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                          {pct >= 100 ? '✅ Goal met' : `${Math.round((hydGoal - runningTotal) / (entry.amount || 1))} more to goal`}
                        </span>
                      )
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* HydraScope Insights Panel */}
      <AnimatePresence>{showInsights && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-sky-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💧</span>
                  <h4 className="text-xs font-semibold text-white">HydraScope</h4>
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
                  {(['metrics', 'analyzer', 'projections'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInsightTab(tab)}
                      className={`px-2 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider transition-all ${
                        insightTab === tab
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/30'
                          : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      {tab === 'metrics' ? 'Consistency' : tab === 'analyzer' ? 'Analyzer' : 'Projections'}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const logged = hydrationWeek.filter(d => d.amount > 0)
                if (!logged.length) {
                  return (
                    <div className="text-center py-6">
                      <p className="text-[11px] text-gray-500">Log drinks this week to see analytics & insights</p>
                    </div>
                  )
                }

                const onTarget = hydrationWeek.filter(d => d.amount >= hydGoal).length
                const adherencePct = Math.round((onTarget / Math.max(logged.length, 1)) * 100) || 0

                let dataStreak = 0
                for (let i = hydrationWeek.length - 1; i >= 0; i--) {
                  if (hydrationWeek[i].amount > 0) dataStreak++
                  else if (dataStreak > 0) break
                }

                return (
                  <AnimatePresence mode="wait">
                    {insightTab === 'metrics' && (
                      <motion.div
                        key="metrics"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="rounded-xl bg-white/5 border border-white/5 p-2.5 flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Avg Intake</span>
                              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div className="my-1.5 text-center">
                              <p className="text-xl font-black text-cyan-400">
                                {hUnit(weekAvg)} <span className="text-[10px] font-bold text-gray-500">{hLabel}</span>
                              </p>
                            </div>
                            <div className="space-y-1">
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                                  style={{ width: `${Math.min((weekAvg / hydGoal) * 100, 100)}%` }} />
                              </div>
                              <div className="flex justify-between text-[8px] text-gray-600 leading-none">
                                <span>Goal: {hUnit(hydGoal)}</span>
                                <span>{Math.round((weekAvg / hydGoal) * 100)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl bg-white/5 border border-white/5 p-2.5 flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Adherence</span>
                              <Target className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <div className="my-1.5 text-center">
                              <p className={`text-xl font-black ${
                                adherencePct >= 80 ? 'text-emerald-400' :
                                adherencePct >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {adherencePct}%
                              </p>
                            </div>
                            <span className="text-[8px] text-gray-600 block text-center leading-tight">
                              Days hitting goal
                            </span>
                          </div>

                          <div className="rounded-xl bg-white/5 border border-white/5 p-2.5 flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Streak</span>
                              <Droplets className={`w-3.5 h-3.5 ${
                                dataStreak >= 3 ? 'text-cyan-400 animate-pulse' : 'text-gray-500'
                              }`} />
                            </div>
                            <div className="my-1.5 text-center">
                              <p className="text-xl font-black text-cyan-400">
                                {dataStreak} <span className="text-[10px] font-bold text-gray-500">days</span>
                              </p>
                            </div>
                            <span className="text-[8px] text-gray-600 block text-center leading-tight">
                              {dataStreak >= 5 ? '🔥 Hydration master!' : dataStreak >= 3 ? '🔥 Building habit' : '🎯 Log daily to grow'}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white/5 border border-white/5 p-2.5 flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-gray-500 uppercase">Logged</span>
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div className="my-1.5 text-center">
                              <p className="text-xl font-black text-blue-400">
                                {logged.length} <span className="text-[10px] font-bold text-gray-500">/ 7</span>
                              </p>
                            </div>
                            <span className="text-[8px] text-gray-600 block text-center leading-tight font-medium">
                              Days logged this week
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white/5 border border-white/5 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-gray-500 uppercase">Weekly Hydration Breakdown</span>
                            <span className="text-[8px] text-gray-500">Daily intake vs goal</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-2">
                            {hydrationWeek.map(d => {
                              const pct = hydGoal > 0 ? Math.round((d.amount / hydGoal) * 100) : 0
                              return (
                                <div key={d.date} className="space-y-1 bg-black/10 border border-white/5 rounded-lg p-2 hover:bg-black/20 hover:border-white/10 transition-all">
                                  <div className="flex justify-between text-[9px] font-medium">
                                    <span className="text-gray-300 font-semibold">{d.label.slice(0, 3)}</span>
                                    <span className={d.amount >= hydGoal ? 'text-emerald-400' : d.amount > 0 ? 'text-amber-400' : 'text-gray-500'}>{hUnit(d.amount)}{hLabel}</span>
                                  </div>
                                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${
                                      d.amount >= hydGoal ? 'bg-emerald-500' : d.amount > 0 ? 'bg-amber-500' : 'bg-gray-600'
                                    }`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {insightTab === 'analyzer' && (
                      <motion.div
                        key="analyzer"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-cyan-400">💡</span>
                          <span className="text-[9px] font-semibold text-gray-500 uppercase">AI-Powered Hydration Analyzer</span>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {weekAvg < hydGoal * 0.8 ? (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">⚠️</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-amber-300">Low Hydration Detected</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  Your average daily intake is <span className="text-white font-semibold">{hUnit(weekAvg)}{hLabel}</span> (goal: {hUnit(hydGoal)}{hLabel}).
                                  Try setting a glass of water by your workspace or setting hourly reminders to stay on track.
                                </p>
                              </div>
                            </div>
                          ) : weekAvg >= hydGoal ? (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">🎯</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-emerald-300">Hydration Goal Mastery</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  Your weekly average of <span className="text-white font-semibold">{hUnit(weekAvg)}{hLabel}</span> meets your hydration target! Excellent work maintaining proper hydration.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">💧</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-amber-300">Getting Close to Goal</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You're averaging <span className="text-white font-semibold">{hUnit(weekAvg)}{hLabel}</span> (goal: {hUnit(hydGoal)}{hLabel}). Adding just one more glass of water per day will put you right on track!
                                </p>
                              </div>
                            </div>
                          )}

                          {adherencePct < 50 ? (
                            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">📅</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-rose-300">Inconsistent Hydration</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You're hitting your goal on only <span className="text-white font-semibold">{adherencePct}%</span> of days. Try linking water drinking to your daily routines — like a glass after every bathroom break or meal.
                                </p>
                              </div>
                            </div>
                          ) : adherencePct >= 80 ? (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">🌟</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-emerald-300">Consistency Champion</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You consistently hit your hydration goal on {adherencePct}% of days! This level of consistency is excellent for your health and energy levels.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">📈</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-blue-300">Building Consistency</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You hit your goal on {adherencePct}% of days. Small improvements each week will build a lasting hydration habit!
                                </p>
                              </div>
                            </div>
                          )}

                          {streak >= 7 ? (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">🔥</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-emerald-300">Impressive Streak!</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You're on a <span className="text-white font-semibold">{streak}-day</span> hydration streak! Your body is reaping the benefits of consistent hydration.
                                </p>
                              </div>
                            </div>
                          ) : streak >= 3 ? (
                            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">💪</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-cyan-300">Streak Growing</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You're on a <span className="text-white font-semibold">{streak}-day</span> streak! Keep it going — consistency is key to forming a habit.
                                </p>
                              </div>
                            </div>
                          ) : streak > 0 ? (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">🌱</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-amber-300">Getting Started</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  You're on a <span className="text-white font-semibold">{streak}-day</span> streak. Every day counts — keep logging to build momentum!
                                </p>
                              </div>
                            </div>
                          ) : null}

                          {weekAvg > 0 && (
                            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 flex gap-2.5 items-start">
                              <div className="text-lg shrink-0 mt-0.5">⏰</div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-bold text-purple-300">Spread Your Intake</p>
                                <p className="text-[10px] text-gray-400 leading-normal">
                                  For optimal hydration, spread your {hUnit(weekAvg)}{hLabel} throughout the day rather than drinking large amounts at once. Your body absorbs water more efficiently in smaller, regular doses.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {insightTab === 'projections' && (
                      <motion.div
                        key="projections"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-indigo-400">📈</span>
                          <span className="text-[9px] font-semibold text-gray-500 uppercase">Hydration Projections</span>
                        </div>

                        {(() => {
                          const projectedMonthly = weekTotal * 4.33
                          const projectedQuarterly = weekTotal * 13
                          const goalPct = hydGoal > 0 ? Math.round((weekAvg / hydGoal) * 100) : 0

                          return (
                            <div className="space-y-3">
                              <div className="rounded-xl bg-white/5 border border-white/5 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs text-white">
                                  <span>Weekly Avg Intake:</span>
                                  <span className="font-bold">{hUnit(weekAvg)}{hLabel}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-white">
                                  <span>Daily Goal:</span>
                                  <span className="font-bold text-gray-400">{hUnit(hydGoal)}{hLabel}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                                  <span>Goal Achievement:</span>
                                  <span className={`font-bold ${goalPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {goalPct}%
                                  </span>
                                </div>
                              </div>

                              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2.5">
                                <div className="flex items-center gap-2">
                                  {goalPct >= 100 ? (
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-amber-400" />
                                  )}
                                  <p className="text-[11px] font-bold text-cyan-300">
                                    {goalPct >= 100 ? 'Sustaining Hydration' : 'Room for Improvement'}
                                  </p>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                  At your current rate, you'll consume approximately <span className="text-white font-semibold">{hUnit(projectedMonthly)}{hLabel}</span> per month and <span className="text-white font-semibold">{hUnit(projectedQuarterly)}{hLabel}</span> per quarter.
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <div className="rounded-lg bg-black/35 p-2 border border-white/5 text-center">
                                    <p className={`text-base font-bold ${goalPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {hUnit(projectedMonthly)}{hLabel}
                                    </p>
                                    <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">4 Weeks</p>
                                  </div>
                                  <div className="rounded-lg bg-black/35 p-2 border border-white/5 text-center">
                                    <p className={`text-lg font-black ${goalPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {hUnit(projectedQuarterly)}{hLabel}
                                    </p>
                                    <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold">12 Weeks</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )
              })()}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Log Water Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => { resetForm(); setShowForm(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative w-full max-w-lg my-8"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal card */}
              <div className="relative rounded-2xl border border-white/[0.08] bg-gray-900/90 backdrop-blur-xl p-[1px] shadow-2xl shadow-violet-500/5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative rounded-2xl bg-gray-950/90 backdrop-blur-xl p-5 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* ── Header ── */}
                  <div className="relative flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.04]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-500/10 flex items-center justify-center border border-violet-500/20">
                      <Droplets className="w-4 h-4 text-violet-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Log Water</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Track every sip you take</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">

                    {/* ── TIME & AMOUNT ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center">
                            <Clock className="w-3 h-3 text-violet-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300/70">Time &amp; Amount</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Date</label>
                            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15] [color-scheme:dark]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Time</label>
                            <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15] [color-scheme:dark]" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Amount ({hLabel})</label>
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <input type="number" value={formAmount || ''} onChange={e => setFormAmount(Number(e.target.value))}
                                placeholder={`Enter amount in ${hLabel}`}
                                className="w-full px-2.5 py-2 pr-8 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15]" />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">{hLabel}</span>
                            </div>
                            <div className="flex gap-1">
                              {(['ml', 'oz'] as const).map(u => (
                                <button key={u} onClick={() => {
                                  if (u !== unit) {
                                    setHydGoal(u === 'oz' ? Math.round(hydGoal / 29.57) : Math.round(hydGoal * 29.57 / 50) * 50)
                                    setQuickAmounts(prev => prev.map(a => u === 'oz' ? Math.round(a / 29.57) : Math.round(a * 29.57 / 10) * 10))
                                    setUnit(u)
                                  }
                                }}
                                  className={`px-2 py-1.5 rounded text-[9px] font-bold border transition-all ${
                                    unit === u ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/[0.04] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.15]'
                                  }`}>{u}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── BEVERAGE ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-sky-500/15 flex items-center justify-center">
                            <span className="text-xs leading-none">🥤</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-sky-300/70">Beverage</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {([
                            { value: 'water' as const, icon: '💧', label: 'Water' },
                            { value: 'coffee' as const, icon: '☕', label: 'Coffee' },
                            { value: 'tea' as const, icon: '🍵', label: 'Tea' },
                            { value: 'juice' as const, icon: '🧃', label: 'Juice' },
                            { value: 'sports' as const, icon: '⚡', label: 'Sports' },
                            { value: 'other' as const, icon: '🥤', label: 'Other' },
                          ]).map(({ value, icon, label }) => (
                            <motion.button key={value} type="button"
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setFormDrinkType(value)}
                              className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                                formDrinkType === value ? 'bg-sky-500/15 border-sky-500/40' : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                              }`}>
                              <span className="text-sm leading-none">{icon}</span>
                              <span className={`text-[8px] font-semibold ${formDrinkType === value ? 'text-sky-300' : 'text-gray-500'}`}>{label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── THIRST LEVEL ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                            <span className="text-xs leading-none">😐</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-300/70">Thirst Level</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {([
                            { value: 'none' as const, icon: '😐', label: 'None' },
                            { value: 'slight' as const, icon: '🤏', label: 'Slight' },
                            { value: 'thirsty' as const, icon: '🥵', label: 'Thirsty' },
                            { value: 'very' as const, icon: '🏜️', label: 'Very' },
                          ]).map(({ value, icon, label }) => (
                            <motion.button key={value} type="button"
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setFormThirst(value)}
                              className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                                formThirst === value ? 'bg-amber-500/15 border-amber-500/40' : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                              }`}>
                              <span className="text-sm leading-none">{icon}</span>
                              <span className={`text-[8px] font-semibold ${formThirst === value ? 'text-amber-300' : 'text-gray-500'}`}>{label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── CONTEXT ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                            <span className="text-xs leading-none">🏃</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300/70">Context</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <motion.button type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setFormExercise(p => !p)}
                            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all text-xs ${
                              formExercise ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                            }`}>
                            <span className="text-xs">🏃</span>
                            <span className="font-semibold flex-1">Exercise</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              formExercise ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.05] text-gray-600'
                            }`}>{formExercise ? 'Yes' : 'No'}</span>
                          </motion.button>
                          <motion.button type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setFormHotWeather(p => !p)}
                            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all text-xs ${
                              formHotWeather ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                            }`}>
                            <span className="text-xs">🌡️</span>
                            <span className="font-semibold flex-1">Hot Weather</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              formHotWeather ? 'bg-orange-500/20 text-orange-300' : 'bg-white/[0.05] text-gray-600'
                            }`}>{formHotWeather ? 'Yes' : 'No'}</span>
                          </motion.button>
                          <motion.button type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setFormCaffeine(p => !p)}
                            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all text-xs ${
                              formCaffeine ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                            }`}>
                            <span className="text-xs">☕</span>
                            <span className="font-semibold flex-1">Caffeine</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              formCaffeine ? 'bg-violet-500/20 text-violet-300' : 'bg-white/[0.05] text-gray-600'
                            }`}>{formCaffeine ? 'Yes' : 'No'}</span>
                          </motion.button>
                          <motion.button type="button" whileTap={{ scale: 0.97 }}
                            onClick={() => setFormWithMeal(p => !p)}
                            className={`flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all text-xs ${
                              formWithMeal ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                            }`}>
                            <span className="text-xs">🍽️</span>
                            <span className="font-semibold flex-1">With Meal</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              formWithMeal ? 'bg-amber-500/20 text-amber-300' : 'bg-white/[0.05] text-gray-600'
                            }`}>{formWithMeal ? 'Yes' : 'No'}</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* ── NOTES ── */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                            <span className="text-xs leading-none">📝</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400/70">Notes</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                        </div>
                        <textarea value={formNote} onChange={e => setFormNote(e.target.value)}
                          placeholder="Any additional notes..."
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15] resize-none h-14" />
                      </div>
                    </div>

                  </div>

                  {/* ── Actions ── */}
                  <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.04]">
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { resetForm(); setShowForm(false) }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] transition-all text-xs font-semibold">
                      Cancel
                    </motion.button>
                    <motion.button whileTap={{ scale: formAmount > 0 ? 0.97 : 1 }}
                      onClick={() => { if (formAmount > 0) { addWater(formAmount, formDate, formTime, formNote); resetForm(); setShowForm(false) } }}
                      disabled={!formAmount || formAmount <= 0}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600/30 to-violet-500/20 border border-violet-500/30 text-violet-300 font-bold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed overflow-hidden group">
                      <span className="flex items-center justify-center gap-1.5">
                        {formAmount > 0 ? `Log Entry ${hUnit(formAmount)}${hLabel}` : 'Select Amount'}
                        {formAmount > 0 && <span className="text-violet-400 group-hover:translate-x-0.5 transition-transform">→</span>}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeletingEntry(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-white mb-2">Delete Entry?</h3>
              <p className="text-sm text-gray-400 mb-5">
                This will remove {hUnit(deletingEntry.amount)}{hLabel} from your hydration log.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingEntry(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">
                  Cancel
                </button>
                <button onClick={() => { deleteHydration(deletingEntry.id); setDeletingEntry(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-all text-sm">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
