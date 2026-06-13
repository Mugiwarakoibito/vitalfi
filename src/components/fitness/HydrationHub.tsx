import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Droplets, Plus, Trash2,
  Target, ChevronLeft, ChevronRight,
  Calendar, RotateCcw, Brain, Clock,
  TrendingUp, Activity, BarChart3,
  Sparkles as SparklesIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine, PieChart, Pie } from 'recharts'
import { generateId, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>; label?: string }) => {
    if (!active || !payload?.[0]) return null
    const p = payload[0] as any
    return (
      <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl shadow-violet-500/10 min-w-[130px]">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        <div className="relative">
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#A78BFA' }} />
            <p className="text-white font-bold text-sm">{hUnit(p.value)}{hLabel}</p>
          </div>
          {p.payload?.icon && (
            <p className="text-gray-500 text-[10px] mt-0.5">{p.payload.icon} {p.payload.type}</p>
          )}
        </div>
      </div>
    )
  }

  const [showHydraCoach, setShowHydraCoach] = useState(false)
  const [showHydraScope, setShowHydraScope] = useState(false)
  const [hydraChartMode, setHydraChartMode] = useState<'volume' | 'timeline' | 'types'>('volume')
  const [hydraScopeOffset, setHydraScopeOffset] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showCoachPref, setShowCoachPref] = useState(false)
  const [coachPref, setCoachPref] = useState<'morning' | 'evening' | 'spread'>('spread')
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

  const hydraScopeWeek = useMemo(() => {
    const days: { date: string; label: string; amount: number; fullDate: string; hasData: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i + hydraScopeOffset * 7)
      const ds = d.toISOString().split('T')[0]
      const total = hydration.filter(h => h.date === ds).reduce((s, h) => s + Number(h.amount || 0), 0)
      days.push({ date: ds, label: i === 0 && hydraScopeOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }), amount: total, fullDate: ds, hasData: total > 0 })
    }
    return days
  }, [hydration, hydraScopeOffset])

  const isHydraScopeCurrentWeek = hydraScopeOffset === 0

  const hydraScopeWeekTotal = useMemo(() => hydraScopeWeek.reduce((s, d) => s + d.amount, 0), [hydraScopeWeek])
  const hydraScopeAvg = useMemo(() => {
    const withData = hydraScopeWeek.filter(d => d.amount > 0)
    return withData.length > 0 ? Math.round(withData.reduce((s, d) => s + d.amount, 0) / withData.length) : 0
  }, [hydraScopeWeek])
  const hydraScopeGoalMet = useMemo(() => hydraScopeWeek.filter(d => d.amount >= hydGoal).length, [hydraScopeWeek, hydGoal])
  const hydraScopeBestDay = useMemo(() => {
    if (!hydraScopeWeek.length) return { amount: 0, label: '--' }
    return hydraScopeWeek.reduce((best, d) => d.amount > best.amount ? d : best, hydraScopeWeek[0])
  }, [hydraScopeWeek])

  // Timeline: hourly distribution across the week
  const hydraScopeHourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, label: i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`, amount: 0 }))
    hydraScopeWeek.forEach(day => {
      const dayEntries = hydration.filter(h => h.date === day.date)
      dayEntries.forEach(h => {
        const hr = new Date(h.timestamp).getHours()
        hours[hr].amount += h.amount
      })
    })
    return hours
  }, [hydration, hydraScopeWeek])

  // Types: drink type breakdown
  const hydraScopeTypeData = useMemo(() => {
    const typeMap: Record<string, { type: string; amount: number; count: number; icon: string; color: string }> = {
      water: { type: 'Water', amount: 0, count: 0, icon: '💧', color: '#38BDF8' },
      coffee: { type: 'Coffee', amount: 0, count: 0, icon: '☕', color: '#A16207' },
      tea: { type: 'Tea', amount: 0, count: 0, icon: '🍵', color: '#65A30D' },
      juice: { type: 'Juice', amount: 0, count: 0, icon: '🧃', color: '#FB923C' },
      sports: { type: 'Sports', amount: 0, count: 0, icon: '⚡', color: '#F472B6' },
      other: { type: 'Other', amount: 0, count: 0, icon: '🫗', color: '#A78BFA' },
    }
    hydraScopeWeek.forEach(day => {
      const dayEntries = hydration.filter(h => h.date === day.date)
      dayEntries.forEach(h => {
        const t = h.drinkType || 'water'
        if (typeMap[t]) { typeMap[t].amount += h.amount; typeMap[t].count++ }
      })
    })
    return Object.values(typeMap).filter(t => t.count > 0)
  }, [hydration, hydraScopeWeek])

  const hydraScopePeakHour = useMemo(() => {
    if (!hydraScopeHourlyData.some(h => h.amount > 0)) return null
    return hydraScopeHourlyData.reduce((a, b) => a.amount > b.amount ? a : b)
  }, [hydraScopeHourlyData])

  const todayLogs = useMemo(() =>
    [...hydration].filter(h => h.date === today)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  [hydration, today])

  const sorted = useMemo(() =>
    [...hydration].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [hydration])

  const coachInsights = useMemo(() => {
    const tips: { icon: string; text: string; color: string; category: string }[] = []

    // Drinking style preference (always first, even with no data)
    if (coachPref === 'morning') {
      tips.push({ icon: '🌅', text: 'Morning focus selected. Try 500-750ml within 30min of waking to kickstart hydration.', color: 'text-amber-400', category: 'lifestyle' })
    } else if (coachPref === 'evening') {
      tips.push({ icon: '🌙', text: 'Evening focus active. Try shifting 1-2 glasses earlier for better sleep quality.', color: 'text-violet-400', category: 'lifestyle' })
    } else {
      tips.push({ icon: '💧', text: 'Spread evenly selected. Aim for a glass every 1-2 hours for steady hydration.', color: 'text-cyan-400', category: 'lifestyle' })
    }

    if (hydration.length < 2) return tips

    const onTargetDays = hydrationWeek.filter(d => d.amount >= hydGoal).length
    const loggedDays = hydrationWeek.filter(d => d.amount > 0).length
    const adherencePct = Math.round((onTargetDays / Math.max(loggedDays, 1)) * 100) || 0
    const weekAvgVal = weekAvg

    // Consistency assessment
    if (loggedDays >= 5) {
      if (adherencePct >= 80) tips.push({ icon: '🎯', text: `${adherencePct}% goal hit rate — your hydration discipline is elite!`, color: 'text-emerald-400', category: 'consistency' })
      else if (adherencePct >= 50) tips.push({ icon: '📊', text: `${adherencePct}% goal hit rate. ${7 - onTargetDays} more on-target days would hit 80%+.`, color: 'text-amber-400', category: 'consistency' })
      else tips.push({ icon: '🔴', text: `Only ${adherencePct}% of logged days hit your ${hUnit(hydGoal)}${hLabel} goal. Try pre-filling a bottle each morning.`, color: 'text-rose-400', category: 'consistency' })
    } else {
      tips.push({ icon: '⏰', text: `Only ${loggedDays}/7 days logged this week. Consistency is key — log every drop to see the full picture.`, color: 'text-amber-400', category: 'consistency' })
    }

    // Intake assessment
    if (weekAvgVal > 0) {
      if (weekAvgVal >= hydGoal) {
        tips.push({ icon: '💪', text: `Averaging ${hUnit(weekAvgVal)}${hLabel}/day — meeting your ${hUnit(hydGoal)}${hLabel} goal! Outstanding.`, color: 'text-emerald-400', category: 'intake' })
      } else if (weekAvgVal >= hydGoal * 0.8) {
        const gap = hydGoal - weekAvgVal
        tips.push({ icon: '💧', text: `${hUnit(weekAvgVal)}${hLabel}/day avg — just ${hUnit(gap)}${hLabel} shy of goal. One more glass per day would seal it.`, color: 'text-amber-400', category: 'intake' })
      } else {
        const gap = hydGoal - weekAvgVal
        tips.push({ icon: '⚠️', text: `Low avg of ${hUnit(weekAvgVal)}${hLabel}/day (goal: ${hUnit(hydGoal)}${hLabel}). Need +${hUnit(gap)}${hLabel}/day. Try a marked bottle to track.`, color: 'text-rose-400', category: 'intake' })
      }
    }

    // Best day
    if (loggedDays >= 2) {
      const best = hydrationWeek.reduce((a, b) => a.amount > b.amount ? a : b)
      if (best.amount > 0) tips.push({ icon: '🏆', text: `${best.label} is your best hydration day (${hUnit(best.amount)}${hLabel}). What made that day work?`, color: 'text-cyan-400', category: 'pattern' })
    }

    // Streak
    if (streak >= 7) tips.push({ icon: '🔥', text: `${streak}-day streak! Your hydration habit is fully locked in.`, color: 'text-orange-400', category: 'pattern' })
    else if (streak >= 3) tips.push({ icon: '🌱', text: `${streak}-day streak and growing! Keep showing up daily.`, color: 'text-emerald-400', category: 'pattern' })

    // Caffeine awareness
    const recent = sorted.slice(0, Math.min(10, sorted.length))
    const caffeineDays = new Set(recent.filter(h => h.caffeine).map(h => h.date)).size
    const waterDays = new Set(recent.filter(h => h.drinkType === 'water').map(h => h.date)).size
    if (caffeineDays > 0 && waterDays > 0) {
      const ratio = caffeineDays / waterDays
      if (ratio > 0.5) tips.push({ icon: '☕', text: `Caffeine logged on ${caffeineDays} of ${recent.length} recent entries. Each coffee needs ~1.5× water to offset dehydration.`, color: 'text-amber-400', category: 'lifestyle' })
    }

    // Exercise / hot weather
    const exerciseDays = new Set(recent.filter(h => h.exercise).map(h => h.date)).size
    if (exerciseDays > 0) tips.push({ icon: '💪', text: `Exercise logged on ${exerciseDays} days. Add 500-750ml extra on workout days to replace fluid loss.`, color: 'text-blue-400', category: 'lifestyle' })
    const hotDays = new Set(recent.filter(h => h.hotWeather).map(h => h.date)).size
    if (hotDays > 0) tips.push({ icon: '☀️', text: `Hot weather on ${hotDays} days. Increase intake by 300-500ml when temps rise.`, color: 'text-orange-400', category: 'environment' })

    // Drink variety
    const nonWaterEntries = recent.filter(h => h.drinkType && h.drinkType !== 'water' && h.drinkType !== 'other')
    if (nonWaterEntries.length > 0) {
      const topDrink = nonWaterEntries.map(h => h.drinkType).reduce((a: string[], b) => { if (!a.includes(b!)) a.push(b!); return a }, [])
      if (topDrink.includes('coffee')) tips.push({ icon: '☕', text: 'Coffee is your go-to. Great in moderation — but water should make up 80%+ of fluid intake.', color: 'text-amber-400', category: 'lifestyle' })
    }

    // Trend
    if (sorted.length >= 4) {
      const first4 = sorted.slice(0, 4).reduce((s, e) => s + e.amount, 0) / 4
      const last4 = sorted.slice(-4).reduce((s, e) => s + e.amount, 0) / 4
      const diff = last4 - first4
      if (diff > 100) tips.push({ icon: '📈', text: `Hydration trending up by ${hUnit(Math.round(diff))}${hLabel} per day! Excellent improvement.`, color: 'text-emerald-400', category: 'recovery' })
      else if (diff < -100) tips.push({ icon: '📉', text: `Intake dropped ${hUnit(Math.round(Math.abs(diff)))}${hLabel}/day. Try scheduling a mid-day hydration check.`, color: 'text-rose-400', category: 'recovery' })
    }

    // Empty state
    if (tips.length === 0) tips.push({ icon: '🧘', text: 'Keep logging to receive personalized hydration coaching.', color: 'text-gray-400', category: 'general' })
    return tips
  }, [hydration, hydrationWeek, weekAvg, hydGoal, streak, hUnit, hLabel, sorted, coachPref])

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
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setTargetDate(formatDate(new Date()))} className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hydrationWeek.some(d => d.amount > 0) && (
            <button onClick={() => setShowHydraCoach(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showHydraCoach ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="HydraCoach">
              <SparklesIcon className="w-5 h-5" />
            </button>
          )}
          {hydrationWeek.some(d => d.amount > 0) && (
            <button onClick={() => setShowHydraScope(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showHydraScope ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="HydraScope">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowSettings(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Water Target">
              <Target className="w-5 h-5" />
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
                        className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", unit === u ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-white/5 border-white/10 text-gray-400 hover:text-white")}>{u.toUpperCase()}</button>
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

      {/* HydraCoach AI Panel */}
      <AnimatePresence>{hydrationWeek.some(d => d.amount > 0) && showHydraCoach && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/20 to-cyan-500/20 border border-cyan-500/20 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">HYDRACOACH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <button onClick={() => setShowCoachPref(p => !p)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showCoachPref
                      ? coachPref === 'morning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : coachPref === 'evening' ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                    title="Hydration style">
                    <span className="text-[11px] leading-none">{coachPref === 'morning' ? '🌅' : coachPref === 'evening' ? '🌙' : '💧'}</span>
                  </button>
                  {showCoachPref && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachPref(false)} />
                      <div className="absolute right-0 top-8 z-20 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Drinking Style</p>
                        <div className="flex flex-col gap-1">
                          {([
                            { key: 'spread' as const, label: '💧 Spread evenly' },
                            { key: 'morning' as const, label: '🌅 Morning focus' },
                            { key: 'evening' as const, label: '🌙 Evening focus' },
                          ]).map(opt => (
                            <button key={opt.key} onClick={() => { setCoachPref(opt.key); setShowCoachPref(false) }}
                              className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${coachPref === opt.key
                                ? opt.key === 'morning' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : opt.key === 'evening' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats summary bar */}
            <div className="flex items-center gap-4 mb-4 px-1">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Avg</p>
                <p className="text-lg font-bold text-cyan-400">{todayHydration > 0 ? `${hUnit(weekAvg)}${hLabel}` : '--'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Consist.</p>
                <p className={`text-lg font-bold ${daysLogged >= 5 ? 'text-green-400' : daysLogged >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {todayHydration > 0 ? `${Math.round((daysLogged / 7) * 100)}%` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Goal Hit</p>
                <p className="text-lg font-bold text-amber-400">{todayHydration > 0 ? `${Math.round((goalMetThisWeek / Math.max(daysLogged, 1)) * 100)}%` : '--'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Streak</p>
                <p className={`text-lg font-bold ${streak >= 7 ? 'text-emerald-400' : streak >= 3 ? 'text-cyan-400' : 'text-gray-400'}`}>
                  {streak > 0 ? `${streak}d` : '--'}
                </p>
              </div>
            </div>

            {/* Coach cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-gray-400">Optimal Timing</span>
                </div>
                {(() => {
                  if (todayHydration === 0) return <p className="text-sm font-bold text-gray-500">No data</p>
                  if (todayLogs.length > 0) {
                    const lastDrink = new Date(todayLogs[todayLogs.length - 1].timestamp)
                    const hours = lastDrink.getHours()
                    const mins = lastDrink.getMinutes()
                    const period = hours >= 12 ? 'PM' : 'AM'
                    const displayHr = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
                    if (todayHydration < hydGoal) {
                      const remaining = hydGoal - todayHydration
                      return (
                        <>
                          <p className="text-sm font-bold text-cyan-400 drop-shadow-lg">{remaining > 0 ? `${hUnit(remaining)}${hLabel} to go` : 'Goal met!'}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Last logged: {displayHr}:{mins.toString().padStart(2, '0')} {period}</p>
                        </>
                      )
                    }
                    return (
                      <>
                        <p className="text-sm font-bold text-emerald-400 drop-shadow-lg">Goal met! 🎯</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{hUnit(todayHydration)}{hLabel} today — keep sipping</p>
                      </>
                    )
                  }
                  return <p className="text-sm font-bold text-gray-500">No drinks yet</p>
                })()}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-gray-400">Quality Trend</span>
                </div>
                {(() => {
                  if (sorted.length < 2) return (
                    <>
                      <p className="text-sm font-bold text-gray-500 drop-shadow-lg">Log to begin</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Track hydration to see trends</p>
                    </>
                  )
                  const half = Math.ceil(sorted.length / 2)
                  const first = sorted.slice(0, half)
                  const last = sorted.slice(half)
                  const firstAvg = first.reduce((s, e) => s + e.amount, 0) / first.length
                  const lastAvg = last.reduce((s, e) => s + e.amount, 0) / last.length
                  const diff = Math.round((lastAvg - firstAvg) * 10) / 10
                  if (Math.abs(diff) < 50) return (
                    <>
                      <p className="text-sm font-bold text-gray-400 drop-shadow-lg">Stable —</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Avg {hUnit(Math.round(lastAvg))}{hLabel} per log</p>
                    </>
                  )
                  return (
                    <>
                      <p className={`text-sm font-bold ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'} drop-shadow-lg`}>
                        {diff > 0 ? 'Improving ↗' : 'Declining ↘'}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {diff > 0 ? `+${hUnit(Math.round(diff))}${hLabel} gain — great progress!` : `${hUnit(Math.round(Math.abs(diff)))}${hLabel} drop — consider adjusting`}
                      </p>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* AI TIPS */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <SparklesIcon className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/70">AI TIPS</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {coachInsights.slice(0, 3).map((tip, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <span className="flex-shrink-0">{tip.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={tip.color}>{tip.text}</p>
                      <span className={`text-[9px] inline-block mt-0.5 px-1.5 py-[1px] rounded-full ${tip.category === 'consistency' || tip.category === 'environment' ? 'bg-blue-500/10 text-blue-400' : tip.category === 'lifestyle' ? 'bg-amber-500/10 text-amber-400' : tip.category === 'recovery' ? 'bg-emerald-500/10 text-emerald-400' : tip.category === 'pattern' ? 'bg-violet-500/10 text-violet-400' : tip.category === 'intake' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-500/10 text-gray-500'}`}>
                        {tip.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* HydraScope Panel */}
      <AnimatePresence>
        {hydrationWeek.some(d => d.amount > 0) && showHydraScope && (
          <motion.div key="hydrascope"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            {!hydraScopeWeek.some(d => d.hasData) ? (
              <div className="relative flex flex-col items-center justify-center h-48 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-7 h-7 text-violet-400/30" />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-1">No drinks this week</p>
                <p className="text-gray-500 text-xs">Log some water to unlock your HydraScope</p>
              </div>
            ) : (
              <div className="relative">
                {/* Header with title + week nav + mode toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                    <BarChart3 className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">HydraScope</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setHydraScopeOffset(o => o + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                      {new Date(hydraScopeWeek[0].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(hydraScopeWeek[6].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <button onClick={() => setHydraScopeOffset(o => o - 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {!isHydraScopeCurrentWeek && (
                      <button onClick={() => setHydraScopeOffset(0)} className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="This week">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
                    {(['volume', 'timeline', 'types'] as const).map(mode => (
                      <button key={mode} onClick={() => setHydraChartMode(mode)}
                        className={`relative px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                          hydraChartMode === mode
                            ? mode === 'volume'
                              ? 'text-violet-300 bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/25 shadow-lg shadow-violet-500/8'
                              : mode === 'timeline'
                                ? 'text-cyan-300 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 shadow-lg shadow-cyan-500/8'
                                : 'text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/8'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                        }`}>
                        <span className="relative z-10 flex items-center gap-1.5">
                          <span className={hydraChartMode === mode ? '' : 'opacity-50'}>{mode === 'volume' ? '📊' : mode === 'timeline' ? '⏱' : '🧃'}</span>
                          {mode === 'volume' ? 'Volume' : mode === 'timeline' ? 'Timeline' : 'Types'}
                        </span>
                        {hydraChartMode === mode && <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />}
                      </button>
                    ))}
                  </div>
                </div>

              {/* Charts */}
              <div className="h-56 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.04] p-3" style={{ minHeight: '220px' }}>
                {hydraChartMode === 'volume' ? (
                  hydraScopeWeek.some(d => d.hasData) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hydraScopeWeek.filter(d => d.hasData)} barGap={8} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.025)" vertical={false} strokeWidth={1} />
                        <XAxis dataKey="label" tick={{ fill: '#e5e7eb', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} dy={6} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, Math.max(hydGoal * 1.4, ...hydraScopeWeek.filter(d => d.hasData).map(d => d.amount))]} tickFormatter={v => `${hUnit(v)}`} width={48} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.15)', radius: 10 }} />
                        <defs>
                          <linearGradient id="volGradGoal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D8B4FE" stopOpacity={1} /><stop offset="50%" stopColor="#A78BFA" stopOpacity={0.85} /><stop offset="100%" stopColor="#7C3AED" stopOpacity={0.2} /></linearGradient>
                          <linearGradient id="volGradMiss" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A5B4FC" stopOpacity={0.85} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0.15} /></linearGradient>
                          <linearGradient id="volLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#C084FC" stopOpacity={0} /><stop offset="50%" stopColor="#C084FC" stopOpacity={1} /><stop offset="100%" stopColor="#C084FC" stopOpacity={0} /></linearGradient>
                          <filter id="glowGoal"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        <ReferenceLine y={hydGoal} stroke="url(#volLineGrad)" strokeWidth={2.5} strokeDasharray="6 4" label={{ value: `🎯 ${hUnit(hydGoal)}${hLabel}`, fill: '#D8B4FE', fontSize: 11, fontWeight: 800, position: 'right' }} />
                        <Bar dataKey="amount" radius={[12, 12, 0, 0]} maxBarSize={40} animationDuration={800} animationEasing="ease-out">
                          {hydraScopeWeek.filter(d => d.hasData).map((entry, idx) => (
                            <Cell key={idx} fill={entry.amount >= hydGoal ? 'url(#volGradGoal)' : 'url(#volGradMiss)'} filter={entry.amount >= hydGoal ? 'url(#glowGoal)' : undefined} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">No hydration data this week</div>
                  )
                ) : hydraChartMode === 'timeline' ? (
                  hydraScopeHourlyData.some(h => h.amount > 0) ? (
                    <div className="flex flex-col h-full justify-center px-2">
                      <div className="grid grid-cols-6 gap-2 w-full">
                        {hydraScopeHourlyData.map((h) => {
                          const maxAmt = hydraScopeHourlyData.reduce((m, x) => Math.max(m, x.amount), 0)
                          const pct = maxAmt > 0 ? h.amount / maxAmt : 0
                          const size = 20 + pct * 32
                          const isPeak = h.amount === maxAmt && maxAmt > 0
                          const [r, g, b] = isPeak ? [251, 191, 36] : pct > 0.6 ? [52, 211, 153] : pct > 0.3 ? [34, 211, 238] : [129, 140, 248]
                          return (
                            <div key={h.hour} className="flex flex-col items-center gap-0.5">
                              <div className="relative flex items-center justify-center transition-all duration-300 rounded-full"
                                style={{
                                  width: h.amount > 0 ? `${size}px` : '14px',
                                  height: h.amount > 0 ? `${size}px` : '14px',
                                  background: h.amount > 0
                                    ? `radial-gradient(circle at 35% 30%, rgba(${r},${g},${b},${0.3 + pct * 0.5}), rgba(${r},${g},${b},${0.1 + pct * 0.3}))`
                                    : 'rgba(255,255,255,0.03)',
                                  border: isPeak ? `1.5px solid rgba(${r},${g},${b},0.7)` : h.amount > 0 ? `1px solid rgba(${r},${g},${b},0.2)` : '1px solid rgba(255,255,255,0.03)',
                                  boxShadow: h.amount > 0 ? `0 0 ${isPeak ? 16 : 8}px rgba(${r},${g},${b},0.25)` : 'none',
                                }}
                              >
                                {h.amount > 0 && (
                                  <span className="text-[7px] font-bold leading-none text-white/80">{hUnit(h.amount)}</span>
                                )}
                              </div>
                              <span className={`text-[7px] font-semibold ${h.amount > 0 ? 'text-gray-400' : 'text-gray-600'}`}>{h.label}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-4 mt-2 text-[8px] text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400/70" /> Low</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400/70" /> Med</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-emerald-400/80" /> High</span>
                        {hydraScopePeakHour && <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/40" /> Peak</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">No timing data available</div>
                  )
                ) : (
                  hydraScopeTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {hydraScopeTypeData.map((entry, idx) => (
                            <linearGradient key={idx} id={`typeDonutGrad${idx}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                            </linearGradient>
                          ))}
                          <filter id="glowDonut"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        <Pie data={hydraScopeTypeData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="amount" nameKey="type" animationDuration={800} animationEasing="ease-out" stroke="rgba(255,255,255,0.06)" strokeWidth={1.5}>
                          {hydraScopeTypeData.map((_, idx) => (
                            <Cell key={idx} fill={`url(#typeDonutGrad${idx})`} filter="url(#glowDonut)" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <text x="50%" y="47%" textAnchor="middle" fill="#d1d5db" fontSize={11} fontWeight={700}>
                          {hydraScopeTypeData.length}
                        </text>
                        <text x="50%" y="56%" textAnchor="middle" fill="#6b7280" fontSize={9} fontWeight={600}>
                          types
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log different drink types to see breakdown</div>
                  )
                )}
              </div>

              {/* Stats strip - Premium Glass */}
              {hydraScopeWeek.some(d => d.hasData) && (
                <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                  <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                    {hydraChartMode === 'volume' && (
                      <>
                        <span>📊 Avg <span className={`font-semibold ${hydraScopeAvg >= hydGoal ? 'text-emerald-400' : hydraScopeAvg >= hydGoal * 0.7 ? 'text-amber-400' : 'text-rose-400'}`}>{hUnit(hydraScopeAvg)}{hLabel}</span> / {hUnit(hydGoal)}{hLabel}</span>
                        <span>🏆 Best <span className="text-emerald-400 font-semibold">{hydraScopeBestDay.label}</span> <span className="text-gray-600">({hUnit(hydraScopeBestDay.amount)}{hLabel})</span></span>
                        <span>🎯 Hit <span className={`font-semibold ${hydraScopeGoalMet >= 5 ? 'text-emerald-400' : hydraScopeGoalMet >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{hydraScopeGoalMet}/7</span></span>
                        <span>💧 Total <span className="font-semibold text-violet-400">{hUnit(hydraScopeWeekTotal)}{hLabel}</span></span>
                      </>
                    )}
                    {hydraChartMode === 'timeline' && hydraScopePeakHour && (
                      <>
                        <span>⏰ Peak <span className="font-semibold text-cyan-400">{hydraScopePeakHour.label}</span> <span className="text-gray-600">({hUnit(hydraScopePeakHour.amount)}{hLabel})</span></span>
                        <span>🕐 Active <span className="font-semibold text-cyan-400">{hydraScopeHourlyData.filter(h => h.amount > 0).length}h</span> / 24h</span>
                        <span>📈 Avg/h <span className="font-semibold text-gray-300">{hUnit(Math.round(hydraScopeWeekTotal / Math.max(hydraScopeHourlyData.filter(h => h.amount > 0).length, 1)))}{hLabel}</span></span>
                      </>
                    )}
                    {hydraChartMode === 'types' && (
                      <>
                        <span>🧃 Types <span className="font-semibold text-emerald-400">{hydraScopeTypeData.length}</span></span>
                        <span>⭐ Top <span className="font-semibold text-emerald-400">{hydraScopeTypeData.sort((a, b) => b.amount - a.amount)[0]?.type || '--'}</span> <span className="text-gray-600">({hydraScopeTypeData.length > 0 ? `${Math.round(hydraScopeTypeData.sort((a, b) => b.amount - a.amount)[0].amount / hydraScopeWeekTotal * 100)}%` : '--'})</span></span>
                        <span>📋 Entries <span className="font-semibold text-gray-300">{hydraScopeTypeData.reduce((s, t) => s + t.count, 0)}</span></span>
                      </>
                    )}
                  </div>
                  {/* Progress mini-bar */}
                  <div className="relative h-0.5 bg-white/[0.03]">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(hydraScopeGoalMet / 7 * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State / Logged Entries */}
      {hydration.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-xl p-10 text-center overflow-hidden relative">
          <Card className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Droplets className="w-8 h-8 text-violet-400/50" />
            </div>
            <p className="text-gray-400 mb-1">No drinks logged yet</p>
            <p className="text-gray-500 text-sm mb-4">Start tracking your hydration</p>
            <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
              Log Your First Water
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {todayLogs.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Droplets className="w-8 h-8 text-violet-400/50" />
                </div>
                <p className="text-gray-400 mb-1">No drinks logged today</p>
                <p className="text-gray-500 text-sm mb-4">Check your HydraScope for this week's data</p>
                <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
                  Log Water
                </Button>
              </Card>
            </motion.div>
          ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {[...todayLogs].reverse().map((entry, i) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.02 }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${entry.amount >= hydGoal * 0.25 ? 'bg-cyan-500/10' : 'bg-amber-500/10'}`}>
                    {entry.drinkType === 'coffee' ? '☕' : entry.drinkType === 'tea' ? '🍵' : entry.drinkType === 'juice' ? '🧃' : entry.drinkType === 'sports' ? '⚡' : '💧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{hUnit(entry.amount)}{hLabel}</span>
                      {entry.drinkType && entry.drinkType !== 'water' && (
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{entry.drinkType}</span>
                      )}
                      {entry.withMeal && <span className="text-[9px] text-amber-400/70">🍽️ with meal</span>}
                      {entry.caffeine && <span className="text-[9px] text-orange-400/70">☕ caffeine</span>}
                      {entry.hotWeather && <span className="text-[9px] text-rose-400/70">🌡️ hot</span>}
                      {entry.exercise && <span className="text-[9px] text-emerald-400/70">💪 exercise</span>}
                      {entry.thirst && entry.thirst !== 'none' && (
                        <span className={`text-[9px] ${entry.thirst === 'very' ? 'text-rose-400/70' : entry.thirst === 'thirsty' ? 'text-amber-400/70' : 'text-gray-500'}`}>
                          {entry.thirst === 'very' ? '🔥 very thirsty' : entry.thirst === 'thirsty' ? '💧 thirsty' : '💧 slight thirst'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {entry.note && <span className="ml-2">— {entry.note}</span>}
                    </p>
                  </div>
                  <button onClick={() => setDeletingEntry(entry)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-500/10 text-gray-600 hover:text-rose-400 transition-all"
                    title="Delete entry">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    )}

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
