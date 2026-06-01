import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Star, Clock, Plus, Trash2, AlertTriangle, Brain, Target, Activity, BarChart3, Coffee, Dumbbell, Sparkles as SparklesIcon, ChevronLeft, ChevronRight, Calendar, RotateCcw, RefreshCw, Settings, Pencil } from 'lucide-react'
import { generateId, formatSleepDuration } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { SleepEntry } from '@/types/fitness'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

const qualityLabel = (q: number) =>
  q === 1 ? 'Poor' : q === 2 ? 'Fair' : q === 3 ? 'Okay' : q === 4 ? 'Good' : 'Great'

const qualityColor = (q: number) =>
  q >= 4 ? 'text-green-400' : q >= 3 ? 'text-amber-400' : 'text-red-400'

function calcSleepScore(avgDuration: number, avgQuality: number): number {
  let durationScore = 0
  if (avgDuration >= 7 && avgDuration <= 9) durationScore = 50
  else if (avgDuration < 7) durationScore = (avgDuration / 7) * 50
  else durationScore = Math.max(0, 50 - (avgDuration - 9) * 25)
  const qualityScore = avgQuality * 10
  return Math.round(Math.min(100, durationScore + qualityScore))
}

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

interface EnvData {
  caffeine: boolean
  exercise: boolean
}

function parseEnvFromNotes(notes?: string): EnvData | null {
  if (!notes) return null
  const parts = notes.split('|__ENV__|')
  if (parts.length < 2) return null
  try {
    const parsed = JSON.parse(parts[1])
    if (typeof parsed.caffeine === 'boolean' && typeof parsed.exercise === 'boolean') {
      return { caffeine: parsed.caffeine, exercise: parsed.exercise }
    }
    return null
  } catch {
    return null
  }
}

function stripEnvFromNotes(notes?: string): string {
  if (!notes) return ''
  return notes.split('|__ENV__|')[0].trim()
}

export function SleepLogger() {
  const { sleep, addSleep, deleteSleep, clearSleep } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formDuration, setFormDuration] = useState('')
  const [formQuality, setFormQuality] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [formBedTime, setFormBedTime] = useState('')
  const [formWakeTime, setFormWakeTime] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formCaffeine, setFormCaffeine] = useState(false)
  const [formExercise, setFormExercise] = useState(false)
  const [formOnset, setFormOnset] = useState('')
  const [formWakings, setFormWakings] = useState('')
  const [formMorningFeel, setFormMorningFeel] = useState<'refreshed' | 'tired' | 'groggy' | 'foggy' | ''>('')
  const [formScreenTime, setFormScreenTime] = useState(false)
  const [formRoomTemp, setFormRoomTemp] = useState<'cold' | 'cool' | 'neutral' | 'warm' | 'hot' | ''>('')
  const [formDreamRecall, setFormDreamRecall] = useState(false)
  const [formAlcohol, setFormAlcohol] = useState(false)
  const [formMeditation, setFormMeditation] = useState(false)
  const [formHeavyMeal, setFormHeavyMeal] = useState(false)
  const [deletingEntry, setDeletingEntry] = useState<SleepEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null)
  const [showTrendScope, setShowTrendScope] = useState(false)
  const [showSleepCoach, setShowSleepCoach] = useState(false)
  const [trendChartMode, setTrendChartMode] = useState<'duration' | 'quality' | 'onset' | 'wakings'>('duration')
  const [trendWeekOffset, setTrendWeekOffset] = useState(0)
  const [coachPref, setCoachPref] = useState<'balanced' | 'early_bird' | 'night_owl'>('balanced')
  const [showCoachPref, setShowCoachPref] = useState(false)
  const [coachRefreshKey, setCoachRefreshKey] = useState(0)
  const [showSleepSettings, setShowSleepSettings] = useState(false)
  const [targetHours, setTargetHours] = useState(() => {
    const saved = localStorage.getItem('vitalfi_sleep_target')
    return saved ? parseFloat(saved) : 8
  })

  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + dir)
    setSelectedDate(formatDate(d))
  }
  const jumpToToday = () => setSelectedDate(formatDate(new Date()))

  useEffect(() => {
    localStorage.setItem('vitalfi_sleep_target', targetHours.toString())
  }, [targetHours])

  // Auto-calculate duration from bed/wake times
  useEffect(() => {
    if (formBedTime && formWakeTime) {
      const bed = timeToMinutes(formBedTime)
      let wake = timeToMinutes(formWakeTime)
      if (wake <= bed) wake += 1440
      const hours = ((wake - bed) / 60).toFixed(1)
      setFormDuration(hours)
    }
  }, [formBedTime, formWakeTime])

  const sorted = useMemo(
    () => [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sleep]
  )

  const avgDuration = useMemo(
    () => (sleep.length > 0 ? sleep.reduce((s, e) => s + e.duration, 0) / sleep.length : 0),
    [sleep]
  )

  const avgQuality = useMemo(
    () => (sleep.length > 0 ? sleep.reduce((s, e) => s + e.quality, 0) / sleep.length : 0),
    [sleep]
  )

  const sleepScore = useMemo(
    () => calcSleepScore(avgDuration, avgQuality),
    [avgDuration, avgQuality]
  )

  const consistency = useMemo(() => {
    const withBed = sleep.filter(e => e.bedTime)
    if (withBed.length < 2) return { pct: 0, total: withBed.length }
    const avgMins = withBed.reduce((s, e) => s + timeToMinutes(e.bedTime!), 0) / withBed.length
    const consistent = withBed.filter(e => Math.abs(timeToMinutes(e.bedTime!) - avgMins) <= 60)
    return { pct: Math.round((consistent.length / withBed.length) * 100), total: withBed.length }
  }, [sleep])

  const sleepDebt = useMemo(() => {
    const debt = sleep.reduce((d, e) => (e.duration < targetHours ? d + (targetHours - e.duration) : d), 0)
    return Math.round(debt * 10) / 10
  }, [sleep, targetHours])

  const recentWeek = useMemo(() => sleep.filter(e => {
    const d = new Date(e.date)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }), [sleep])

  const daysToRecover = sleepDebt > 0 ? Math.ceil(sleepDebt / 0.5) : 0

  const last7GoalHit = recentWeek.filter(e => e.duration >= targetHours).length
  const last7GoalPct = recentWeek.length > 0 ? Math.round((last7GoalHit / recentWeek.length) * 100) : 0

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0])
    setFormDuration('')
    setFormQuality(3)
    setFormBedTime('')
    setFormWakeTime('')
    setFormNotes('')
    setFormCaffeine(false)
    setFormExercise(false)
    setFormOnset('')
    setFormWakings('')
    setFormMorningFeel('')
    setFormScreenTime(false)
    setFormRoomTemp('')
    setFormDreamRecall(false)
    setFormAlcohol(false)
    setFormMeditation(false)
    setFormHeavyMeal(false)
  }

  const handleEdit = (entry: SleepEntry) => {
    setFormDate(entry.date)
    setFormDuration(entry.duration.toString())
    setFormQuality(entry.quality as 1|2|3|4|5)
    setFormBedTime(entry.bedTime || '')
    setFormWakeTime(entry.wakeTime || '')
    setFormOnset(entry.onsetMinutes?.toString() || '')
    setFormWakings(entry.nightWakings?.toString() || '')
    setFormMorningFeel(entry.morningFeel || '')
    setFormScreenTime(entry.screenTime || false)
    setFormRoomTemp(entry.roomTemp || '')
    setFormDreamRecall(entry.dreamRecall || false)
    setFormAlcohol(entry.alcohol || false)
    setFormMeditation(entry.meditation || false)
    setFormHeavyMeal(entry.heavyMeal || false)
    const env = parseEnvFromNotes(entry.notes)
    setFormCaffeine(env?.caffeine || false)
    setFormExercise(env?.exercise || false)
    setFormNotes(stripEnvFromNotes(entry.notes))
    setEditingEntry(entry)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formDuration || isNaN(parseFloat(formDuration))) return
    const hasEnv = formCaffeine || formExercise
    const envSuffix = hasEnv ? `|__ENV__|${JSON.stringify({ caffeine: formCaffeine, exercise: formExercise })}` : ''
    const fullNotes = formNotes ? `${formNotes} ${envSuffix}`.trim() : envSuffix
    const now = new Date().toISOString()

    if (editingEntry) {
      deleteSleep(editingEntry.id)
    }

    addSleep({
      id: editingEntry ? editingEntry.id : generateId(),
      date: formDate,
      duration: parseFloat(formDuration),
      quality: formQuality,
      bedTime: formBedTime || undefined,
      wakeTime: formWakeTime || undefined,
      onsetMinutes: formOnset ? parseInt(formOnset) : undefined,
      nightWakings: formWakings ? parseInt(formWakings) : undefined,
      morningFeel: formMorningFeel || undefined,
      screenTime: formScreenTime || undefined,
      roomTemp: formRoomTemp || undefined,
      dreamRecall: formDreamRecall || undefined,
      alcohol: formAlcohol || undefined,
      meditation: formMeditation || undefined,
      heavyMeal: formHeavyMeal || undefined,
      notes: fullNotes || undefined,
      createdAt: editingEntry ? editingEntry.createdAt : now,
      updatedAt: now,
    })
    resetForm()
    setEditingEntry(null)
    setShowForm(false)
  }

  const handleDelete = () => {
    if (!deletingEntry) return
    deleteSleep(deletingEntry.id)
    setDeletingEntry(null)
  }

  const qualityStars = (q: number, size = 12, className = '') =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={
          i < q ? `fill-amber-400 text-amber-400 ${className}` : `text-white/10 ${className}`
        }
      />
    ))

  const goalMetCount = useMemo(
    () => sleep.filter(e => e.duration >= targetHours).length,
    [sleep, targetHours]
  )

  const goalMetPct = useMemo(
    () => (sleep.length > 0 ? Math.round((goalMetCount / sleep.length) * 100) : 0),
    [sleep.length, goalMetCount]
  )

  const circadianScore = useMemo(() => {
    const entries = sleep.filter(e => e.bedTime && e.wakeTime).slice(-14)
    if (entries.length < 3) return null
    const bedMinutes = entries.map(e => timeToMinutes(e.bedTime!))
    const wakeMinutes = entries.map(e => timeToMinutes(e.wakeTime!))
    const bedMean = bedMinutes.reduce((s, m) => s + m, 0) / bedMinutes.length
    const wakeMean = wakeMinutes.reduce((s, m) => s + m, 0) / wakeMinutes.length
    const bedDev = Math.sqrt(bedMinutes.reduce((s, m) => s + (m - bedMean) ** 2, 0) / bedMinutes.length) / 60
    const wakeDev = Math.sqrt(wakeMinutes.reduce((s, m) => s + (m - wakeMean) ** 2, 0) / wakeMinutes.length) / 60
    const avgDev = (bedDev + wakeDev) / 2
    return Math.round(Math.max(0, Math.min(100, 100 - avgDev * 25)))
  }, [sleep])

  const readinessScore = useMemo(() => {
    const s = sleepScore
    const c = circadianScore ?? 50
    return Math.round(Math.min(100, s * 0.6 + c * 0.4))
  }, [sleepScore, circadianScore])

  /* ---- FEATURE 4: Recovery Score Breakdown ---- */
  const sleepPortion = useMemo(() => sleepScore * 0.6, [sleepScore])
  const circadianPortion = useMemo(() => (circadianScore ?? 50) * 0.4, [circadianScore])

  /* ---- Custom Tooltip ---- */
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="text-white/80 text-xs font-medium mb-1.5">{label}</p>
        {payload.map((p, i) => {
          if (p.dataKey === 'duration') return <p key={i} className="text-xs text-violet-400">Duration: <strong>{p.value}h</strong> <span className="text-gray-600">/ {targetHours}h goal</span></p>
          if (p.dataKey === 'quality') return <p key={i} className="text-xs text-emerald-400">Quality: <strong>{p.value}/5</strong></p>
          if (p.dataKey === 'onset') return <p key={i} className="text-xs text-sky-400">Onset: <strong>{p.value} min</strong> <span className="text-gray-600">(ideal ≤15)</span></p>
          if (p.dataKey === 'wakings') return <p key={i} className="text-xs text-orange-400">Wakings: <strong>{p.value}x</strong> <span className="text-gray-600">(ideal ≤1)</span></p>
          return null
        })}
      </div>
    )
  }

  const trendWeekData = useMemo(() => {
    const today = new Date()
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - (i + trendWeekOffset * 7))
      const dateStr = d.toISOString().split('T')[0]
      const entry = sleep.find(e => e.date === dateStr)
      const prev = new Date(today)
      prev.setDate(prev.getDate() - (i + 7 + trendWeekOffset * 7))
      const prevStr = prev.toISOString().split('T')[0]
      const prevEntry = sleep.find(e => e.date === prevStr)
      days.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: dateStr,
        duration: entry ? entry.duration : null,
        quality: entry ? entry.quality : null,
        onset: entry?.onsetMinutes ?? null,
        wakings: entry?.nightWakings ?? null,
        prevDuration: prevEntry ? prevEntry.duration : null,
        prevQuality: prevEntry ? prevEntry.quality : null,
        prevOnset: prevEntry?.onsetMinutes ?? null,
        prevWakings: prevEntry?.nightWakings ?? null,
        hasData: !!entry,
      })
    }
    return days
  }, [sleep, trendWeekOffset])

  const isTrendCurrentWeek = trendWeekOffset === 0

  // Sleep Coach AI-like recommendations
  const coachInsights = useMemo(() => {
    const tips: { icon: string; text: string; color: string; category: string }[] = []
    if (sleep.length < 2) return tips
    if (consistency.total >= 2) {
      if (consistency.pct >= 80) tips.push({ icon: '🎯', text: 'Great bedtime consistency! Your rhythm is solid.', color: 'text-emerald-400', category: 'timing' })
      else if (consistency.pct >= 50) tips.push({ icon: '⏰', text: 'Try going to bed within 30min of your usual time for better consistency.', color: 'text-amber-400', category: 'timing' })
      else tips.push({ icon: '🔴', text: 'Irregular bedtimes disrupt your circadian rhythm. Aim for a fixed bedtime.', color: 'text-rose-400', category: 'timing' })
    }
    if (sleepDebt > 5) tips.push({ icon: '⚠️', text: `Sleep debt of ${sleepDebt}h is high. Prioritize extra rest this week.`, color: 'text-rose-400', category: 'recovery' })
    else if (sleepDebt > 2) tips.push({ icon: '🌙', text: `You're ${sleepDebt}h behind on sleep. An early night could help.`, color: 'text-amber-400', category: 'recovery' })
    else if (sleepDebt > 0) tips.push({ icon: '✅', text: `Minimal sleep debt (${sleepDebt}h). Keep it up!`, color: 'text-emerald-400', category: 'recovery' })
    if (avgDuration < targetHours - 0.5) tips.push({ icon: '📈', text: `Average ${avgDuration.toFixed(1)}h is below your ${targetHours}h target. Try extending by 30min.`, color: 'text-amber-400', category: 'timing' })
    else if (avgDuration >= targetHours) tips.push({ icon: '💪', text: `You're meeting your ${targetHours}h target on average. Excellent!`, color: 'text-emerald-400', category: 'timing' })
    const recent = sleep.slice(0, Math.min(5, sleep.length))
    const hasCaffeine = recent.some(e => {
      const env = parseEnvFromNotes(e.notes)
      return env?.caffeine
    })
    if (hasCaffeine) tips.push({ icon: '☕', text: 'Caffeine before bed detected. Try avoiding it 6h before sleep.', color: 'text-orange-400', category: 'lifestyle' })
    const hasScreen = recent.some(e => e.screenTime)
    if (hasScreen) tips.push({ icon: '📱', text: 'Screen time before bed can delay melatonin. Try a 30min digital wind-down.', color: 'text-violet-400', category: 'environment' })
    const hasAlcohol = recent.some(e => e.alcohol)
    if (hasAlcohol) tips.push({ icon: '🍷', text: 'Alcohol reduces REM sleep. Consider skipping it on rest nights.', color: 'text-rose-400', category: 'lifestyle' })
    if (tips.length === 0) tips.push({ icon: '🧘', text: 'Keep logging to receive personalized sleep coaching.', color: 'text-gray-400', category: 'general' })
    return tips
  }, [sleep, consistency, sleepDebt, avgDuration, targetHours, coachRefreshKey])

  return (
    <div className="space-y-6">

      {/* Date Navigation + Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {selectedDate !== formatDate(new Date()) && (
            <button onClick={jumpToToday} className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sleep.length > 0 && (
            <button onClick={() => setShowSleepCoach(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSleepCoach ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="SleepCoach">
              <Brain className="w-5 h-5" />
            </button>
          )}
          {sleep.length > 0 && (
            <button onClick={() => setShowTrendScope(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showTrendScope ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Sleep Trends">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowSleepSettings(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSleepSettings ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Sleep Target">
              <Target className="w-5 h-5" />
            </button>
            {showSleepSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSleepSettings(false)} />
                <div className="absolute right-0 top-10 z-20 w-64 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-4">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Sleep Target</p>
                  <input type="range" min="4" max="12" step="0.5" value={targetHours}
                    onChange={e => setTargetHours(parseFloat(e.target.value))}
                    className="w-full accent-violet-500" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-gray-500">4h</span>
                    <span className="text-sm font-bold text-violet-400 drop-shadow-lg">{targetHours.toFixed(1)}h</span>
                    <span className="text-[11px] text-gray-500">12h</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Sleep
          </Button>
        </div>
      </motion.div>

      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {/* Readiness */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Readiness</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{readinessScore}<span className="text-sm text-gray-500 ml-1 font-normal">/100</span></p>
            <p className="text-xs text-gray-500 mt-0.5">
              {readinessScore >= 80 ? 'Well rested' : readinessScore >= 60 ? 'Ready' : readinessScore >= 40 ? 'Tired' : 'Exhausted'}
              {sleep.length >= 2 && <span className="text-gray-600"> · {Math.round(sleepScore + (circadianScore ?? 50))} combined</span>}
            </p>
            {sleep.length >= 2 && (
              <div className="mt-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                  <span className="flex items-center gap-1"><Brain className="w-2.5 h-2.5 text-violet-400" /> Sleep</span>
                  <span className="flex items-center gap-1"><BarChart3 className="w-2.5 h-2.5 text-amber-400" /> Circadian</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                  <div className="h-full rounded-l-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500" style={{ width: `${(sleepPortion / (sleepPortion + circadianPortion)) * 100}%` }} />
                  <div className="h-full rounded-r-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500" style={{ width: `${(circadianPortion / (sleepPortion + circadianPortion)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                  <span>{Math.round(sleepPortion)}</span>
                  <span>{Math.round(circadianPortion)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Sleep Score */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-violet-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-1">
              <Brain className="w-4 h-4" />
              <span>Sleep Score</span>
            </div>
            <p className="text-3xl font-bold text-violet-400 drop-shadow-lg">{sleep.length > 0 ? sleepScore : '--'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {sleep.length > 0
                ? `${avgDuration.toFixed(1)}h avg · ${avgQuality.toFixed(1)}★ quality`
                : 'Log your first night'}
            </p>
            {sleep.length >= 2 && (
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                <span className="flex items-center gap-1">Duration <span className={`font-semibold ${avgDuration >= targetHours ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.min(100, Math.round((avgDuration / targetHours) * 100))}%</span></span>
                <span className="text-gray-600">·</span>
                <span className="flex items-center gap-1">Quality <span className={`font-semibold ${avgQuality >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>{Math.round((avgQuality / 5) * 100)}%</span></span>
              </div>
            )}
          </div>
        </div>
        {/* Avg Duration */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-sky-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-1">
              <Clock className="w-4 h-4" />
              <span>Avg Duration</span>
            </div>
            <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">
              {sleep.length > 0 ? formatSleepDuration(avgDuration) : '--'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] ${avgDuration >= targetHours ? 'text-emerald-400' : 'text-amber-400'}`}>
                {sleep.length > 0 ? (avgDuration >= targetHours ? '✓ on target' : `${(targetHours - avgDuration).toFixed(1)}h short`) : ''}
              </span>
            </div>
            {sleep.length >= 2 && (
              <p className="text-[10px] text-gray-600 mt-1">
                <span className="text-emerald-400/70">{goalMetCount}</span> of <span className="text-white/70">{sleep.length}</span> nights on target
                {sleep.length >= 3 && (
                  <> · Best <span className="text-white/70 font-medium">{formatSleepDuration(Math.max(...sleep.map(e => e.duration)))}</span></>
                )}
              </p>
            )}
          </div>
        </div>
        {/* Circadian Score */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Circadian</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{circadianScore ?? '--'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {circadianScore != null
                ? (circadianScore >= 80 ? 'Consistent rhythm' : circadianScore >= 50 ? 'Fair rhythm' : 'Irregular')
                : 'Need 3+ entries'}
            </p>
            {consistency.total >= 2 && (
              <>
                <p className="text-[10px] text-gray-600 mt-0.5">{consistency.pct}% bedtime consistency</p>
                {(() => {
                  const bedTimes = sleep.filter(e => e.bedTime).map(e => timeToMinutes(e.bedTime!))
                  if (bedTimes.length < 2) return null
                  const avgBed = Math.round(bedTimes.reduce((a, b) => a + b, 0) / bedTimes.length)
                  const hrs = Math.floor(avgBed / 60)
                  const mins = avgBed % 60
                  return <p className="text-[10px] text-gray-600">Avg bedtime: <span className="text-white/70">{hrs}:{mins.toString().padStart(2, '0')}</span></p>
                })()}
              </>
            )}
          </div>
        </div>
        {/* Sleep Debt */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Sleep Debt</span>
            </div>
            <p className="text-3xl font-bold text-rose-400 drop-shadow-lg">{sleepDebt.toFixed(1)}<span className="text-sm text-gray-500 ml-1 font-normal">hrs</span></p>
            <p className="text-xs text-gray-500 mt-1">
              {sleepDebt <= 0 ? 'No debt 🎉' : daysToRecover > 14 ? `Need ~${daysToRecover} early nights` : `${daysToRecover} early nights to recover`}
            </p>
            {sleepDebt > 0 && (
              <p className="text-[10px] text-gray-600 mt-0.5">
                {sleepDebt >= 10 ? 'Critical — prioritize rest' : sleepDebt >= 5 ? 'High — schedule recovery' : 'Manageable — stay consistent'}
              </p>
            )}
          </div>
        </div>
        {/* Goal Met */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <Target className="w-4 h-4" />
              <span>Goal Met</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{sleep.length > 0 ? goalMetPct : 0}<span className="text-sm text-gray-500 ml-1 font-normal">%</span></p>
            <p className="text-xs text-gray-500 mt-1">{goalMetCount} of {sleep.length} nights</p>
            {(() => {
              const streak = [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).reduce((count, e) => {
                if (e.duration >= targetHours) return count + 1
                return -1
              }, 0)
              const currentStreak = streak > 0 ? streak : 0
              return currentStreak > 0
                ? <p className="text-[10px] text-emerald-400/70 mt-0.5">🔥 {currentStreak}-night streak</p>
                : null
            })()}
            {recentWeek.length > 0 && (
              <p className={`text-[10px] mt-0.5 ${last7GoalPct >= 80 ? 'text-emerald-400/70' : last7GoalPct >= 50 ? 'text-amber-400/70' : 'text-rose-400/70'}`}>
                Last 7 days: {last7GoalHit}/{recentWeek.length} ({last7GoalPct}%)
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* DreamScope Panel */}
      <AnimatePresence>
        {showTrendScope && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-amber-500/5 pointer-events-none" />
            <div className="relative">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setTrendWeekOffset(o => o + 1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                    {trendWeekData[0]?.fullDate && trendWeekData[6]?.fullDate
                      ? `${new Date(trendWeekData[0].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(trendWeekData[6].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : '—'}
                  </span>
                  <button onClick={() => setTrendWeekOffset(o => o - 1)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isTrendCurrentWeek && (
                    <button onClick={() => setTrendWeekOffset(0)} className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="This week">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-0.5 border border-white/10">
                    {(['duration', 'quality', 'onset', 'wakings'] as const).map(mode => (
                      <button key={mode} onClick={() => setTrendChartMode(mode)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          trendChartMode === mode
                            ? mode === 'duration' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : mode === 'quality' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : mode === 'onset' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'text-gray-500 hover:text-white'
                        }`}>
                        {mode === 'duration' ? 'Duration' : mode === 'quality' ? 'Quality' : mode === 'onset' ? 'Onset' : 'Wakings'}
                      </button>
                    ))}
                  </div>
                </div>

              {/* Chart */}
              <div className="h-56" style={{ minHeight: '220px' }}>
                {trendWeekData.some(d => d.hasData) ? (
                  <ResponsiveContainer key="dreamscope-chart" width="100%" height="100%">
                    {trendChartMode === 'duration' ? (
                      <BarChart data={trendWeekData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                          {trendWeekData.map((entry) => (
                            <Cell key={entry.fullDate} fill={entry.duration && entry.duration >= targetHours ? '#C084FC' : entry.duration && entry.duration >= targetHours * 0.85 ? '#A78BFA' : '#7C3AED'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : trendChartMode === 'quality' ? (
                      <BarChart data={trendWeekData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="quality" radius={[4, 4, 0, 0]}>
                          {trendWeekData.map((entry) => (
                            <Cell key={entry.fullDate} fill={entry.quality && entry.quality >= 4 ? '#34D399' : entry.quality && entry.quality >= 3 ? '#FBBF24' : '#F87171'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : trendChartMode === 'onset' ? (
                      <BarChart data={trendWeekData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="onset" radius={[4, 4, 0, 0]}>
                          {trendWeekData.map((entry) => (
                            <Cell key={entry.fullDate} fill={entry.onset != null && entry.onset <= 15 ? '#38BDF8' : entry.onset != null && entry.onset <= 30 ? '#FB923C' : '#F43F5E'} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <BarChart data={trendWeekData} barGap={2} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'auto']} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="wakings" radius={[4, 4, 0, 0]}>
                          {trendWeekData.map((entry) => (
                            <Cell key={entry.fullDate} fill={entry.wakings != null && entry.wakings <= 1 ? '#FB923C' : entry.wakings != null && entry.wakings <= 3 ? '#FBBF24' : '#EF4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">No data this week</div>
                )}
              </div>

              {/* Per-mode context strip */}
              {trendWeekData.some(d => d.hasData) && (
                <>
                  {trendChartMode === 'duration' && (() => {
                    const logged = trendWeekData.filter(d => d.hasData && d.duration)
                    if (!logged.length) return null
                    const avg = logged.reduce((s, d) => s + (d.duration || 0), 0) / logged.length
                    const best = logged.reduce((a, b) => (a.duration || 0) > (b.duration || 0) ? a : b)
                    const worst = logged.reduce((a, b) => (a.duration || 0) < (b.duration || 0) ? a : b)
                    return (
                      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                        <span>Avg <span className={`font-semibold ${avg >= targetHours ? 'text-emerald-400' : avg >= targetHours * 0.85 ? 'text-amber-400' : 'text-rose-400'}`}>{formatSleepDuration(avg)}</span> / {targetHours}h goal</span>
                        <span>Best <span className="text-emerald-400 font-semibold">{new Date(best.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({formatSleepDuration(best.duration || 0)})</span></span>
                        <span>Worst <span className="text-rose-400 font-semibold">{new Date(worst.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({formatSleepDuration(worst.duration || 0)})</span></span>
                      </div>
                    )
                  })()}
                  {trendChartMode === 'quality' && (() => {
                    const logged = trendWeekData.filter(d => d.hasData && d.quality)
                    if (!logged.length) return null
                    const avg = logged.reduce((s, d) => s + (d.quality || 0), 0) / logged.length
                    const best = logged.reduce((a, b) => (a.quality || 0) > (b.quality || 0) ? a : b)
                    const worst = logged.reduce((a, b) => (a.quality || 0) < (b.quality || 0) ? a : b)
                    return (
                      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                        <span>Avg <span className={`font-semibold ${avg >= 4 ? 'text-emerald-400' : avg >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{avg.toFixed(1)}★</span></span>
                        <span>Best <span className="text-emerald-400 font-semibold">{new Date(best.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(best.quality || 0).toFixed(1)})</span></span>
                        <span>Worst <span className="text-rose-400 font-semibold">{new Date(worst.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(worst.quality || 0).toFixed(1)})</span></span>
                      </div>
                    )
                  })()}
                  {trendChartMode === 'onset' && (() => {
                    const logged = trendWeekData.filter(d => d.hasData && d.onset != null)
                    if (!logged.length) return null
                    const avg = logged.reduce((s, d) => s + (d.onset || 0), 0) / logged.length
                    const best = logged.reduce((a, b) => (a.onset || 0) < (b.onset || 0) ? a : b)
                    const worst = logged.reduce((a, b) => (a.onset || 0) > (b.onset || 0) ? a : b)
                    return (
                      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                        <span>Avg <span className={`font-semibold ${avg <= 15 ? 'text-emerald-400' : avg <= 30 ? 'text-amber-400' : 'text-rose-400'}`}>{avg.toFixed(0)}m</span> onset</span>
                        <span>Best <span className="text-emerald-400 font-semibold">{new Date(best.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(best.onset || 0).toFixed(0)}m)</span></span>
                        <span>Worst <span className="text-rose-400 font-semibold">{new Date(worst.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(worst.onset || 0).toFixed(0)}m)</span></span>
                      </div>
                    )
                  })()}
                  {trendChartMode === 'wakings' && (() => {
                    const logged = trendWeekData.filter(d => d.hasData && d.wakings != null)
                    if (!logged.length) return null
                    const avg = logged.reduce((s, d) => s + (d.wakings || 0), 0) / logged.length
                    const best = logged.reduce((a, b) => (a.wakings || 0) < (b.wakings || 0) ? a : b)
                    const worst = logged.reduce((a, b) => (a.wakings || 0) > (b.wakings || 0) ? a : b)
                    return (
                      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5 text-[10px] text-gray-500">
                        <span>Avg <span className={`font-semibold ${avg <= 1 ? 'text-emerald-400' : avg <= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{avg.toFixed(1)}</span> wakings</span>
                        <span>Best <span className="text-emerald-400 font-semibold">{new Date(best.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(best.wakings || 0).toFixed(0)})</span></span>
                        <span>Worst <span className="text-rose-400 font-semibold">{new Date(worst.fullDate).toLocaleDateString('en-US', { weekday: 'short' })}</span> <span className="text-gray-600">({(worst.wakings || 0).toFixed(0)})</span></span>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SleepCoach Panel */}
      <AnimatePresence>
        {showSleepCoach && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">SleepCoach</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCoachRefreshKey(k => k + 1)}
                    className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
                    title="Refresh insights">
                    <RefreshCw className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowCoachPref(p => !p)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showCoachPref ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                      title="Coach preferences">
                      <Settings className="w-3 h-3" />
                    </button>
                    {showCoachPref && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCoachPref(false)} />
                        <div className="absolute right-0 top-8 z-20 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Sleep Chronotype</p>
                          <div className="flex flex-col gap-1">
                            {([
                              { key: 'balanced', label: '⚖️ Balanced' },
                              { key: 'early_bird', label: '🌅 Early Bird' },
                              { key: 'night_owl', label: '🦉 Night Owl' },
                            ] as const).map(opt => (
                              <button key={opt.key} onClick={() => { setCoachPref(opt.key); setShowCoachPref(false) }}
                                className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${coachPref === opt.key ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
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
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Score</p>
                  <p className="text-lg font-bold text-violet-400">{sleep.length > 0 ? sleepScore : '--'}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Avg</p>
                  <p className="text-lg font-bold text-sky-400">{sleep.length > 0 ? formatSleepDuration(avgDuration) : '--'}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Consist.</p>
                  <p className={`text-lg font-bold ${consistency.pct >= 70 ? 'text-green-400' : consistency.pct >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {consistency.total >= 2 ? `${consistency.pct}%` : '--'}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Debt</p>
                  <p className="text-lg font-bold text-rose-400">{sleepDebt.toFixed(1)}<span className="text-[9px] text-gray-500 ml-0.5">h</span></p>
                </div>
              </div>

              {/* Top Stats: Consistency + Debt */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3 text-violet-400" />
                      <span>Consistency</span>
                    </div>
                    <span className={`text-sm font-bold ${consistency.pct >= 70 ? 'text-green-400' : consistency.pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {consistency.total >= 2 ? `${consistency.pct}%` : '--'}
                    </span>
                  </div>
                  {consistency.total >= 2 ? (
                    <>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500" style={{ width: `${consistency.pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{consistency.total} nights tracked</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-gray-500">Need 2+ entries</p>
                  )}
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>Sleep Debt</span>
                    </div>
                    <span className="text-sm font-bold text-rose-400">{sleepDebt.toFixed(1)}<span className="text-[10px] text-gray-500 ml-0.5">h</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500" style={{ width: `${Math.min(100, (sleepDebt / 10) * 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">total accumulated</p>
                </div>
              </div>

              {/* AI Insights with categorization */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <SparklesIcon className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">AI Insights</span>
                </div>
                <div className="space-y-2">
                  {coachInsights.map((tip, i) => (
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
                        <span className={`text-[9px] inline-block mt-0.5 px-1.5 py-[1px] rounded-full ${tip.category === 'timing' ? 'bg-blue-500/10 text-blue-400' : tip.category === 'environment' ? 'bg-orange-500/10 text-orange-400' : tip.category === 'lifestyle' ? 'bg-rose-500/10 text-rose-400' : tip.category === 'recovery' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {tip.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Sleep History</h3>
        {sleep.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (window.confirm('Delete all sleep entries? This cannot be undone.')) {
                await clearSleep()
              }
            }}
            className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </motion.button>
        )}
      </div>

      {/* History List */}
      {sleep.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-violet-400/50" />
            </div>
            <p className="text-gray-400 mb-1">No sleep entries yet</p>
            <p className="text-gray-500 text-sm mb-4">Start tracking your sleep</p>
            <Button variant="primary" onClick={() => setShowForm(true)}>
              Log Your First Sleep
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((entry, i) => {
              const goalMet = entry.duration >= targetHours
              const envData = parseEnvFromNotes(entry.notes)
              const cleanNotes = stripEnvFromNotes(entry.notes)
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.02] to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg"
                          style={{ boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}
                        >
                          <Moon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white tracking-tight">
                              {new Date(entry.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </h4>
                            {goalMet && (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-[10px] font-medium">
                                Goal met
                              </span>
                            )}
                            {!goalMet && entry.duration > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-medium">
                                {(targetHours - entry.duration).toFixed(1)}h short
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {formatSleepDuration(entry.duration)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingEntry(entry)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1">
                        {qualityStars(entry.quality, 13)}
                        <span className={`text-xs ml-1 ${qualityColor(entry.quality)}`}>
                          {qualityLabel(entry.quality)}
                        </span>
                      </div>
                      {entry.bedTime && entry.wakeTime && (
                        <span className="text-xs text-gray-500">
                          {entry.bedTime} &rarr; {entry.wakeTime}
                        </span>
                      )}
                      <span className={`text-xs font-medium ${scoreColor(calcSleepScore(entry.duration, entry.quality))}`}>
                        Score: {calcSleepScore(entry.duration, entry.quality)}
                      </span>
                      {envData && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          {envData.caffeine && <Coffee className="w-3 h-3 text-orange-400" />}
                          {envData.exercise && <Dumbbell className="w-3 h-3 text-emerald-400" />}
                        </span>
                      )}
                    </div>
                    {/* Enhanced detail badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.onsetMinutes != null && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                          Fell asleep in {entry.onsetMinutes}m
                        </span>
                      )}
                      {entry.nightWakings != null && entry.nightWakings > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium">
                          {entry.nightWakings}x awakenings
                        </span>
                      )}
                      {entry.morningFeel && (
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                          entry.morningFeel === 'refreshed'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : entry.morningFeel === 'tired'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {entry.morningFeel === 'refreshed' ? '⚡' : entry.morningFeel === 'tired' ? '😴' : entry.morningFeel === 'groggy' ? '🥴' : '🌫️'} {entry.morningFeel.charAt(0).toUpperCase() + entry.morningFeel.slice(1)}
                        </span>
                      )}
                      {entry.roomTemp && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-medium">
                          {entry.roomTemp} room
                        </span>
                      )}
                      {entry.screenTime && (
                        <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-medium">
                          📱 Screen
                        </span>
                      )}
                      {entry.alcohol && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium">
                          🍷 Alcohol
                        </span>
                      )}
                      {entry.meditation && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-medium">
                          🧘 Meditated
                        </span>
                      )}
                      {entry.heavyMeal && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
                          🍕 Heavy meal
                        </span>
                      )}
                      {entry.dreamRecall && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-medium">
                          🌙 Dreamed
                        </span>
                      )}
                    </div>
                    {cleanNotes && (
                      <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">
                        &ldquo;{cleanNotes}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Log Sleep Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                  <Moon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{editingEntry ? 'Edit Sleep Entry' : 'Log Sleep Entry'}</h3>
                  <p className="text-xs text-gray-500">{editingEntry ? 'Update your sleep details' : 'Track every detail of your rest'}</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">

                {/* ── SECTION: When ── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-400/70">Time</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 to-transparent" />
                  </div>
                  {/* Date */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                  {/* Bed / Wake */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Bed Time</label>
                      <input
                        type="time"
                        value={formBedTime}
                        onChange={e => setFormBedTime(e.target.value)}
                        className="glass-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Wake Time</label>
                      <input
                        type="time"
                        value={formWakeTime}
                        onChange={e => setFormWakeTime(e.target.value)}
                        className="glass-input w-full"
                      />
                    </div>
                  </div>
                  {formBedTime && formWakeTime ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-violet-400/80 bg-violet-500/10 rounded-lg px-3 py-1.5 border border-violet-500/20">
                      <Clock className="w-3 h-3" />
                      <span>Duration: <strong>{formDuration}h</strong></span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-400 mb-1.5">Duration (hours)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          max={24}
                          value={formDuration}
                          onChange={e => setFormDuration(e.target.value)}
                          className="glass-input w-full"
                          placeholder="7.5"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SECTION: Quality ── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">Quality &amp; Restfulness</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 to-transparent" />
                  </div>
                  {/* Star Rating */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-2">Overall Quality</label>
                    <div className="flex gap-2">
                      {([1, 2, 3, 4, 5] as const).map(q => (
                        <motion.button
                          key={q}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => setFormQuality(q)}
                          className={`flex-1 p-3 rounded-xl text-center transition-all ${
                            formQuality === q
                              ? 'bg-amber-500/20 border border-amber-500/40 shadow-lg shadow-amber-500/10'
                              : 'bg-white/5 border border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-center mb-1 gap-px">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={10}
                                className={
                                  i < q
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-white/10'
                                }
                              />
                            ))}
                          </div>
                          <span className={`text-[10px] ${formQuality === q ? 'text-amber-400' : 'text-gray-500'}`}>
                            {qualityLabel(q)}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Onset + Wakings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Time to fall asleep (min)</label>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={formOnset}
                        onChange={e => setFormOnset(e.target.value)}
                        className="glass-input w-full"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Awakenings</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={formWakings}
                        onChange={e => setFormWakings(e.target.value)}
                        className="glass-input w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION: Environment ── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400/70">Environment &amp; Habits</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-sky-500/20 to-transparent" />
                  </div>
                  {/* Room Temp */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-2">Room Temperature</label>
                    <div className="flex gap-1.5">
                      {(['cold', 'cool', 'neutral', 'warm', 'hot'] as const).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormRoomTemp(formRoomTemp === t ? '' : t)}
                          className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all capitalize ${
                            formRoomTemp === t
                              ? t === 'cold' || t === 'cool'
                                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                                : t === 'warm' || t === 'hot'
                                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Toggles row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormScreenTime(!formScreenTime)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formScreenTime
                          ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-lg shadow-violet-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">📱</span>
                      <span className="text-xs font-medium">Screen Time</span>
                      <span className={`ml-auto text-[10px] ${formScreenTime ? 'text-violet-400' : 'text-gray-600'}`}>
                        {formScreenTime ? 'Yes' : 'No'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormCaffeine(!formCaffeine)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formCaffeine
                          ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 shadow-lg shadow-orange-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Caffeine</span>
                      <span className={`ml-auto text-[10px] ${formCaffeine ? 'text-orange-400' : 'text-gray-600'}`}>
                        {formCaffeine ? 'Yes' : 'No'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormExercise(!formExercise)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formExercise
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Exercise</span>
                      <span className={`ml-auto text-[10px] ${formExercise ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {formExercise ? 'Yes' : 'No'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAlcohol(!formAlcohol)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formAlcohol
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">🍷</span>
                      <span className="text-xs font-medium">Alcohol</span>
                      <span className={`ml-auto text-[10px] ${formAlcohol ? 'text-rose-400' : 'text-gray-600'}`}>
                        {formAlcohol ? 'Yes' : 'No'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMeditation(!formMeditation)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formMeditation
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">🧘</span>
                      <span className="text-xs font-medium">Meditation</span>
                      <span className={`ml-auto text-[10px] ${formMeditation ? 'text-indigo-400' : 'text-gray-600'}`}>
                        {formMeditation ? 'Yes' : 'No'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormHeavyMeal(!formHeavyMeal)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        formHeavyMeal
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/5'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">🍕</span>
                      <span className="text-xs font-medium">Heavy Meal</span>
                      <span className={`ml-auto text-[10px] ${formHeavyMeal ? 'text-amber-400' : 'text-gray-600'}`}>
                        {formHeavyMeal ? 'Yes' : 'No'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ── SECTION: Mind ── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70">Mind &amp; Recovery</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 to-transparent" />
                  </div>
                  {/* Morning Feel */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-2">How did you feel this morning?</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { value: 'refreshed' as const, emoji: '⚡', label: 'Refreshed' },
                        { value: 'tired' as const, emoji: '😴', label: 'Tired' },
                        { value: 'groggy' as const, emoji: '🥴', label: 'Groggy' },
                        { value: 'foggy' as const, emoji: '🌫️', label: 'Foggy' },
                      ]).map(({ value, emoji, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFormMorningFeel(formMorningFeel === value ? '' : value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                            formMorningFeel === value
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className="text-sm">{emoji}</span>
                          <span className={`text-[10px] font-medium ${formMorningFeel === value ? 'text-emerald-300' : 'text-gray-500'}`}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Dream Recall */}
                  <button
                    type="button"
                    onClick={() => setFormDreamRecall(!formDreamRecall)}
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      formDreamRecall
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/5'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs">🌙</span>
                    <span className="text-xs font-medium">Dreams</span>
                    <span className={`ml-auto text-[10px] ${formDreamRecall ? 'text-purple-400' : 'text-gray-600'}`}>
                      {formDreamRecall ? 'Yes' : 'No'}
                    </span>
                  </button>
                </div>

                {/* ── SECTION: Notes ── */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs">📝</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500/70">Notes</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <textarea
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                    placeholder="Any additional details about your night..."
                    className="glass-input w-full resize-none h-16 text-sm"
                  />
                </div>

              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5 pt-4 border-t border-white/5">
                <button
                  onClick={() => { setShowForm(false); resetForm(); setEditingEntry(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={!formDuration}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 font-medium hover:bg-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeletingEntry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white text-center mb-2">
                Delete Sleep Entry?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">
                Delete entry from{' '}
                {deletingEntry &&
                  new Date(deletingEntry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingEntry(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                >
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
