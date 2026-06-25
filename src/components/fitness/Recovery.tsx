import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Activity, Plus, Trash2, X, AlertTriangle,
  TrendingUp, Target, ChevronLeft, ChevronRight,
  Calendar, RotateCcw, Clock, Sparkles, Moon, Pencil,
  BarChart3, Brain, Droplets,
} from 'lucide-react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, ReferenceLine, ReferenceArea, LabelList, PieChart, Pie } from 'recharts'
import { generateId, cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface RecoveryEntry {
  id: string; date: string
  energy: number; soreness: number; stress: number; mood: number; sleepQuality: number
  sleepHours?: number
  recoveryFeeling?: number
  domsAreas: string[]
  domsSeverity?: Record<string, 'mild' | 'moderate' | 'severe'>
  notes?: string; createdAt: string
}

const MUSCLE_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
]

const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function getStreak(entries: RecoveryEntry[]): number {
  let streak = 0; const d = new Date()
  while (streak < 365) {
    const ds = toLocalDate(d)
    if (!entries.find(e => e.date === ds)) break
    streak++; d.setDate(d.getDate() - 1)
  }
  return streak
}

function getReadiness(energy: number, soreness: number, stress: number, mood: number): { score: number; label: string; color: string } {
  const weights = { energy: 30, soreness: 25, stress: 25, mood: 20 }
  const totalW = weights.energy + weights.soreness + weights.stress + weights.mood || 1
  const eScore = (energy / 10) * (weights.energy / totalW) * 100
  const soScore = Math.max(0, (1 - soreness / 10)) * (weights.soreness / totalW) * 100
  const stScore = Math.max(0, (1 - stress / 10)) * (weights.stress / totalW) * 100
  const mScore = (mood / 5) * (weights.mood / totalW) * 100
  const total = Math.round(Math.min(100, Math.max(0, eScore + soScore + stScore + mScore)))
  const label = total >= 85 ? 'Peak' : total >= 70 ? 'Ready' : total >= 50 ? 'Fair' : total >= 30 ? 'Tired' : 'Exhausted'
  const color = total >= 85 ? '#10b981' : total >= 70 ? '#06b6d4' : total >= 50 ? '#f59e0b' : total >= 30 ? '#f97316' : '#ef4444'
  return { score: total, label, color }
}

const STORAGE_KEY = 'vitalfi_recovery_entries'
const SETTINGS_KEY = 'vitalfi_recovery_settings'

function findSleep<T extends {date: string}>(sleep: T[], dateStr: string, dateObj?: Date): T | undefined {
  const candidates = new Set([dateStr])
  const d = dateObj || new Date(dateStr + 'T12:00:00')
  if (d && !isNaN(d.getTime())) {
    candidates.add(d.toISOString().split('T')[0])
  }
  return sleep.find(s => candidates.has(s.date))
}

function loadEntries(): RecoveryEntry[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

export function Recovery() {
  const { sleep } = useAppStore()

  const [entries, setEntries] = useState<RecoveryEntry[]>(loadEntries)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    energy: 7, soreness: 3, stress: 4, mood: 4, sleepQuality: 4,
    sleepHours: '', recoveryFeeling: 3,
    domsAreas: [] as string[], domsSeverity: {} as Record<string, 'mild' | 'moderate' | 'severe'>,
    notes: '',
  })
  const [deleteTarget, setDeleteTarget] = useState<RecoveryEntry | null>(null)
  const [showTrendsPanel, setShowTrendsPanel] = useState(false)
  const [showRecoveryCoach, setShowRecoveryCoach] = useState(false)
  const [scopeOffset, setScopeOffset] = useState(0)
  const [trendChartMode, setTrendChartMode] = useState<'volume' | 'timeline' | 'types'>('volume')
  const [showSettings, setShowSettings] = useState(false)
  const [showCoachPref, setShowCoachPref] = useState(false)
  const [coachPref, setCoachPref] = useState<'performance' | 'recovery' | 'balanced'>('balanced')
  const [targetDate, setTargetDate] = useState(toLocalDate(new Date()))
  const [recoveryGoal, setRecoveryGoal] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_KEY)
    return saved ? parseInt(saved) : 70
  })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) }, [entries])
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, recoveryGoal.toString()) }, [recoveryGoal])

  const today = toLocalDate(new Date())
  const todayEntry = useMemo(() => entries.find(e => e.date === targetDate), [entries, targetDate])
  const todaySleep = useMemo(() => findSleep(sleep, targetDate), [sleep, targetDate])
  const todayReadiness = useMemo(() => {
    if (!todayEntry) return null
    return getReadiness(todayEntry.energy, todayEntry.soreness, todayEntry.stress, todayEntry.mood)
  }, [todayEntry])

  const getWeekDays = (daysBack: number, entriesList: RecoveryEntry[]) => {
    const days: { date: string; label: string; readiness: number; energy: number; soreness: number; stress: number; mood: number; sleepQuality: number }[] = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = toLocalDate(d)
      const entry = entriesList.find(e => e.date === ds)
      days.push({
        date: ds, label: i === 0 && targetDate === today ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        readiness: entry ? getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood).score : 0,
        energy: entry?.energy || 0, soreness: entry?.soreness || 0, stress: entry?.stress || 0, mood: entry?.mood || 0,
        sleepQuality: entry?.sleepQuality || 0,
      })
    }
    return days
  }

  const recentWeek = useMemo(() => getWeekDays(7, entries), [entries, targetDate, today])

  const scopeWeek = useMemo(() => {
    const days: { date: string; label: string; readiness: number; energy: number; soreness: number; stress: number; mood: number; sleepQuality: number; hasData: boolean; fullDate: string; sleepEntry: typeof sleep[0] | undefined }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i + scopeOffset * 7)
      const ds = toLocalDate(d)
      const entry = entries.find(e => e.date === ds)
      const readiness = entry ? getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood).score : 0
      days.push({
        date: ds, label: i === 0 && scopeOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        readiness,
        energy: entry?.energy ?? 0, soreness: entry?.soreness ?? 0, stress: entry?.stress ?? 0, mood: entry?.mood ?? 0,
        sleepQuality: entry?.sleepQuality || 0, hasData: !!entry, fullDate: ds,
        sleepEntry: findSleep(sleep, ds, d),
      })
    }
    return days
  }, [entries, scopeOffset, sleep])

  const isScopeCurrentWeek = scopeOffset === 0

  const scopeAvg = useMemo(() => {
    const withData = scopeWeek.filter(d => d.hasData)
    return withData.length > 0 ? Math.round(withData.reduce((s, d) => s + d.readiness, 0) / withData.length) : 0
  }, [scopeWeek])
  const scopeGoalMet = useMemo(() => scopeWeek.filter(d => d.hasData && d.readiness >= recoveryGoal).length, [scopeWeek, recoveryGoal])
  const scopeBestDay = useMemo(() => {
    const withData = scopeWeek.filter(d => d.hasData)
    if (!withData.length) return { label: '--', readiness: 0 }
    return withData.reduce((best, d) => d.readiness > best.readiness ? d : best, withData[0])
  }, [scopeWeek])

  const avgReadiness = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0)
    return vals.length > 0 ? Math.round(vals.reduce((s, d) => s + d.readiness, 0) / vals.length) : 0
  }, [recentWeek])

  const priorWeek = useMemo(() => {
    const days: number[] = []
    for (let i = 13; i >= 7; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = toLocalDate(d)
      const entry = entries.find(e => e.date === ds)
      if (entry) days.push(getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood).score)
    }
    return days
  }, [entries])

  const priorAvgReadiness = useMemo(() => priorWeek.length > 0 ? Math.round(priorWeek.reduce((s, v) => s + v, 0) / priorWeek.length) : null, [priorWeek])

  const readinessTrend = useMemo(() => {
    if (priorAvgReadiness === null) return null
    const diff = avgReadiness - priorAvgReadiness
    return { diff, arrow: diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat' as const }
  }, [avgReadiness, priorAvgReadiness])

  const sortedEntries = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [entries])
  const loggingStreak = useMemo(() => getStreak(entries), [entries])
  const entriesOnTarget = useMemo(() => {
    const recent = sortedEntries.slice(0, 14)
    return recent.filter(e => getReadiness(e.energy, e.soreness, e.stress, e.mood).score >= recoveryGoal).length
  }, [sortedEntries, recoveryGoal])
  const consistencyPct = useMemo(() => {
    const recent = sortedEntries.slice(0, 14)
    return recent.length > 0 ? Math.round((entriesOnTarget / recent.length) * 100) : 0
  }, [entriesOnTarget, sortedEntries])

  const readinessPrediction = useMemo(() => {
    const vals = recentWeek.filter(d => d.readiness > 0).map(d => d.readiness)
    if (vals.length === 0) return null
    const predicted = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    const todaySleep = todayEntry?.sleepQuality ?? 0
    const avgSleep = recentWeek.filter(d => d.sleepQuality > 0).reduce((s, d) => s + d.sleepQuality, 0) / Math.max(recentWeek.filter(d => d.sleepQuality > 0).length, 1)
    const adjustment = todaySleep > 0 && todaySleep < avgSleep ? -Math.round((avgSleep - todaySleep) * 5) : 0
    const confidence = Math.min(90, Math.round(vals.length / 7 * 100))
    return { value: Math.max(0, Math.min(100, predicted + adjustment)), confidence }
  }, [recentWeek, todayEntry])

  const coachTips = useMemo(() => {
    const tips: { icon: string; text: string; color: string; category: string }[] = []
    if (coachPref === 'performance') {
      tips.push({ icon: '\u26A1', text: 'Performance focus active. Emphasize training readiness, peak energy days, and pushing your limits.', color: 'text-amber-400', category: 'focus' })
    } else if (coachPref === 'recovery') {
      tips.push({ icon: '\uD83E\uDDD8', text: 'Recovery focus active. Prioritize rest, stress management, and allowing full recovery between sessions.', color: 'text-emerald-400', category: 'focus' })
    } else {
      tips.push({ icon: '\u2696\uFE0F', text: 'Balanced focus active. Optimize both training and recovery for steady, sustainable progress.', color: 'text-cyan-400', category: 'focus' })
    }
    if (todayEntry && todayEntry.domsAreas.length > 0) {
      tips.push({ icon: '\uD83D\uDCAA', text: `${todayEntry.domsAreas.length} sore area${todayEntry.domsAreas.length > 1 ? 's' : ''} detected. ${todayEntry.domsAreas.length >= 3 ? 'Consider light activity and extra stretching.' : 'Mild soreness — normal training should be OK.'}`, color: 'text-rose-300', category: 'body' })
    }
    if (todayReadiness) {
      if (todayReadiness.score < 40) tips.push({ icon: '\u26A0\uFE0F', text: 'Low readiness detected. Prioritize rest, sleep, and active recovery today.', color: 'text-rose-300', category: 'readiness' })
      else if (todayReadiness.score >= 80) tips.push({ icon: '\u26A1', text: 'High readiness! Great day for intense training and PR attempts.', color: 'text-emerald-300', category: 'readiness' })
      else if (todayReadiness.score >= 60) tips.push({ icon: '\uD83D\uDCA1', text: 'Moderate readiness. Solid training day — stay mindful of recovery signals.', color: 'text-amber-300', category: 'readiness' })
    }
    if (todayEntry && todayEntry.sleepQuality > 0 && todayEntry.sleepQuality <= 2) {
      tips.push({ icon: '\uD83D\uDE34', text: 'Poor sleep quality detected. Prioritize sleep hygiene and aim for 7\u20139 hours tonight.', color: 'text-indigo-300', category: 'sleep' })
    }
    if (loggingStreak >= 7) {
      tips.push({ icon: '\uD83D\uDD25', text: `${loggingStreak}-day logging streak! Consistency unlocks deeper recovery insights over time.`, color: 'text-amber-300', category: 'streak' })
    }
    if (readinessPrediction && todayReadiness) {
      const diff = readinessPrediction.value - todayReadiness.score
      if (Math.abs(diff) >= 3) {
        tips.push({ icon: '\uD83D\uDD2E', text: `Tomorrow predicted: ${readinessPrediction.value} (${diff > 0 ? '+' : ''}${diff} vs today, ${readinessPrediction.confidence}% confidence). ${diff > 0 ? 'Recovery trending up!' : 'Plan for a lighter session.'}`, color: diff > 0 ? 'text-cyan-300' : 'text-rose-300', category: 'prediction' })
      }
    }
    while (tips.length < 3) {
      const fallbacks = [
        { icon: '\uD83E\uDDD8', text: entries.length === 0 ? 'Log your first recovery entry to get personalized AI insights.' : 'Keep logging daily to unlock deeper recovery coaching and trend analysis.', color: 'text-gray-400', category: 'general' },
        { icon: '\uD83D\uDCA1', text: 'Consistency is key to understanding your recovery patterns over time.', color: 'text-gray-400', category: 'general' },
        { icon: '\u2B50', text: 'Track your energy, sleep, and soreness daily to spot what works best for you.', color: 'text-gray-400', category: 'general' },
      ]
      tips.push(fallbacks[tips.length])
    }
    return tips
  }, [todayEntry, todayReadiness, loggingStreak, readinessPrediction, entries.length, coachPref])

  const scopeFeelingData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    scopeWeek.filter(d => d.hasData).forEach(d => {
      const entry = entries.find(e => e.date === d.date)
      if (entry?.recoveryFeeling) counts[entry.recoveryFeeling] = (counts[entry.recoveryFeeling] || 0) + 1
    })
    const labels: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Okay', 4: 'Great', 5: 'Peak' }
    const colors: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#38bdf8', 4: '#a855f7', 5: '#10b981' }
    return Object.entries(counts).filter(([_, c]) => c > 0).map(([k, c]) => ({
      feeling: labels[Number(k)], count: c, color: colors[Number(k)],
    }))
  }, [scopeWeek, entries])


  const saveEntry = () => {
    const entry: RecoveryEntry = {
      id: generateId(), date: targetDate,
      energy: formData.energy, soreness: formData.soreness,
      stress: formData.stress, mood: formData.mood,
      sleepQuality: formData.sleepQuality,
      sleepHours: formData.sleepHours ? parseFloat(formData.sleepHours) : undefined,
      recoveryFeeling: formData.recoveryFeeling,
      domsAreas: formData.domsAreas,
      domsSeverity: formData.domsSeverity,
      notes: formData.notes || undefined,
      createdAt: new Date().toISOString(),
    }
    const existing = entries.findIndex(e => e.date === targetDate)
    if (existing >= 0) { const updated = [...entries]; updated[existing] = entry; setEntries(updated) }
    else setEntries([entry, ...entries])
    setShowForm(false)
  }

  const toggleDomArea = (area: string) => {
    setFormData(prev => {
      if (!prev.domsAreas.includes(area)) return { ...prev, domsAreas: [...prev.domsAreas, area], domsSeverity: { ...prev.domsSeverity, [area]: 'mild' } }
      const sev = prev.domsSeverity[area]
      if (!sev || sev === 'mild') return { ...prev, domsSeverity: { ...prev.domsSeverity, [area]: 'moderate' } }
      if (sev === 'moderate') return { ...prev, domsSeverity: { ...prev.domsSeverity, [area]: 'severe' } }
      const { [area]: _, ...rest } = prev.domsSeverity
      return { ...prev, domsAreas: prev.domsAreas.filter(a => a !== area), domsSeverity: rest }
    })
  }

  const navigateDate = (dir: number) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + dir)
    setTargetDate(toLocalDate(d))
  }

  const isToday = targetDate === today

  const Slider = ({ label, value, onChange, min = 1, max = 10, color, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string; hint?: string }) => {
    const pct = ((value - min) / (max - min)) * 100
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color || '#a855f7' }} />
            <span className="text-slate-400 font-medium">{label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${color}20`, color: color || '#a855f7' }}>{value}</span>
            <span className="text-slate-600 text-[10px]">/ {max}</span>
          </div>
        </div>
        {hint && <p className="text-[9px] text-slate-600 -mt-0.5">{hint}</p>}
        <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-200" style={{ width: `${pct}%`, backgroundColor: color || '#a855f7', opacity: 0.5 }} />
          <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/20 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-solid" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setTargetDate(toLocalDate(new Date()))} className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button onClick={() => setShowRecoveryCoach(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showRecoveryCoach ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="RECOVERYCOACH">
              <Brain className="w-5 h-5" />
            </button>
          )}
          {entries.length > 0 && (
            <button onClick={() => setShowTrendsPanel(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showTrendsPanel ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="RecoveryScope">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowSettings(p => !p)}
              className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              title="Recovery Target">
              <Target className="w-5 h-5" />
            </button>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 top-10 z-20 w-64 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-4">
                  <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-3">RECOVERY TARGET</p>
                  <input type="range" min={0} max={100} step={5} value={recoveryGoal}
                    onChange={e => setRecoveryGoal(Number(e.target.value))}
                    className="w-full accent-emerald-500" />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-gray-500">0</span>
                    <span className="text-sm font-bold text-emerald-400 drop-shadow-lg">{recoveryGoal}/100</span>
                    <span className="text-[11px] text-gray-500">100</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-gray-500 text-center">
                    Entries above {recoveryGoal} count toward goal hit rate
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={() => { const entry = entries.find(e => e.date === targetDate); setFormData({ energy: entry?.energy ?? 7, soreness: entry?.soreness ?? 3, stress: entry?.stress ?? 4, mood: entry?.mood ?? 4, sleepQuality: todaySleep?.quality ?? entry?.sleepQuality ?? 4, sleepHours: todaySleep?.duration?.toString() ?? entry?.sleepHours?.toString() ?? '', recoveryFeeling: entry?.recoveryFeeling ?? 3, domsAreas: entry?.domsAreas ?? [], domsSeverity: entry?.domsSeverity ?? {}, notes: entry?.notes ?? '' }); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all text-[10px] font-bold uppercase tracking-wider"
          ><Plus size={12} />Log Recovery</button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <Heart className="w-4 h-4" />
              <span>Today</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{todayReadiness ? todayReadiness.score : '--'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{todayReadiness?.label || (targetDate === today ? 'Log today' : 'No entry')}</p>
          </div>
        </div>
        {/* Week Avg */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-violet-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>Week Avg</span>
            </div>
            <p className="text-3xl font-bold text-violet-400 drop-shadow-lg">{avgReadiness > 0 ? avgReadiness : '--'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{readinessTrend ? `${readinessTrend.diff > 0 ? '+' : ''}${readinessTrend.diff} vs prior` : 'Insufficient data'}</p>
          </div>
        </div>
        {/* Streak */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Streak</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{loggingStreak > 0 ? loggingStreak : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">{loggingStreak > 0 ? 'd' : ''}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{loggingStreak > 0 ? `${loggingStreak}-day streak` : 'No streak'}</p>
          </div>
        </div>
        {/* Sleep Q */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-indigo-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-indigo-400/80 text-sm mb-1">
              <Moon className="w-4 h-4" />
              <span>Sleep Q</span>
            </div>
            <p className="text-3xl font-bold text-indigo-400 drop-shadow-lg">{todayEntry ? (todayEntry.sleepQuality || '--') : (targetDate === today ? '--' : '--')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{todaySleep ? 'From SleepLogger' : todayEntry?.sleepQuality ? 'Logged' : (targetDate === today ? 'Log sleep' : 'No data')}</p>
          </div>
        </div>
        {/* Goal Hit */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-sky-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-1">
              <Target className="w-4 h-4" />
              <span>Goal Hit</span>
            </div>
            <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">{sortedEntries.length > 0 ? `${consistencyPct}%` : '--'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sortedEntries.length > 0 ? `${entriesOnTarget}/${Math.min(sortedEntries.length, 14)} above ${recoveryGoal}` : 'No data'}</p>
          </div>
        </div>
        {/* DOMS */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-1">
              <Droplets className="w-4 h-4" />
              <span>DOMS</span>
            </div>
            <p className="text-3xl font-bold text-rose-400 drop-shadow-lg">{todayEntry ? todayEntry.domsAreas.length : '--'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{todayEntry ? `${todayEntry.domsAreas.length} area${todayEntry.domsAreas.length !== 1 ? 's' : ''} sore` : (targetDate === today ? 'Log today' : 'No data')}</p>
          </div>
        </div>
      </motion.div>

      {/* RECOVERYCOACH Panel */}
      <AnimatePresence>{entries.length > 0 && showRecoveryCoach && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">RECOVERYCOACH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <button onClick={() => setShowCoachPref(p => !p)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showCoachPref
                      ? coachPref === 'performance' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : coachPref === 'recovery' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                    title="Recovery focus">
                    <span className="text-[11px] leading-none">{coachPref === 'performance' ? '\u26A1' : coachPref === 'recovery' ? '\uD83E\uDDD8' : '\u2696\uFE0F'}</span>
                  </button>
                  {showCoachPref && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowCoachPref(false)} />
                      <div className="absolute right-0 top-8 z-20 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Recovery Focus</p>
                        <div className="flex flex-col gap-1">
                          {([
                            { key: 'balanced' as const, label: '\u2696\uFE0F Balanced' },
                            { key: 'performance' as const, label: '\u26A1 Performance' },
                            { key: 'recovery' as const, label: '\uD83E\uDDD8 Recovery' },
                          ]).map(opt => (
                            <button key={opt.key} onClick={() => { setCoachPref(opt.key); setShowCoachPref(false) }}
                              className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${coachPref === opt.key
                                ? opt.key === 'performance' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : opt.key === 'recovery' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
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
                <p className="text-lg font-bold text-emerald-400">{avgReadiness > 0 ? avgReadiness : '--'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Consist.</p>
                <p className={`text-lg font-bold ${sortedEntries.slice(0, 7).length >= 5 ? 'text-green-400' : sortedEntries.slice(0, 7).length >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {sortedEntries.length > 0 ? `${Math.round((sortedEntries.slice(0, 7).length / 7) * 100)}%` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Goal Hit</p>
                <p className="text-lg font-bold text-amber-400">{sortedEntries.length > 0 ? `${consistencyPct}%` : '--'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Streak</p>
                <p className={`text-lg font-bold ${loggingStreak >= 7 ? 'text-emerald-400' : loggingStreak >= 3 ? 'text-cyan-400' : 'text-gray-400'}`}>
                  {loggingStreak > 0 ? `${loggingStreak}d` : '--'}
                </p>
              </div>
            </div>

            {/* Coach cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-gray-400">Recovery Status</span>
                </div>
                {todayReadiness ? (
                  <>
                    <p className="text-sm font-bold" style={{ color: todayReadiness.color }}>{todayReadiness.label} ({todayReadiness.score})</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Sleep: Q{todayEntry?.sleepQuality || todaySleep?.quality || '?'} | DOMS: {todayEntry?.domsAreas.length || 0} areas</p>
                  </>
                ) : targetDate === today ? (
                  <>
                    <p className="text-sm font-bold text-gray-500">Log today</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Track readiness to see status</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-500">No entry</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">No data for this date</p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-gray-400">Quality Trend</span>
                </div>
                {sortedEntries.length === 0 ? (
                  <>
                    <p className="text-sm font-bold text-gray-500 drop-shadow-lg">Log to begin</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Track recovery to see trends</p>
                  </>
                ) : (() => {
                  const half = Math.ceil(sortedEntries.length / 2)
                  const first = sortedEntries.slice(0, half)
                  const last = sortedEntries.slice(half)
                  const firstAvg = first.reduce((s, e) => s + getReadiness(e.energy, e.soreness, e.stress, e.mood).score, 0) / first.length
                  const lastAvg = last.length > 0 ? last.reduce((s, e) => s + getReadiness(e.energy, e.soreness, e.stress, e.mood).score, 0) / last.length : 50
                  const diff = Math.round((firstAvg - lastAvg) * 10) / 10
                  if (Math.abs(diff) < 3) return (
                    <>
                      <p className="text-sm font-bold text-gray-400 drop-shadow-lg">Stable —</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Avg {Math.round(firstAvg)} readiness</p>
                    </>
                  )
                  return (
                    <>
                      <p className={`text-sm font-bold ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'} drop-shadow-lg`}>
                        {diff > 0 ? 'Improving ↗' : 'Declining ↘'}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {diff > 0 ? `+${diff} pt gain — great progress!` : `${Math.abs(diff)} pt drop — consider adjusting`}
                      </p>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* AI TIPS */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">AI TIPS</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {coachTips.slice(0, 3).map((tip, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0">{tip.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={tip.color}>{tip.text}</p>
                      <span className={`text-[9px] inline-block mt-0.5 px-1.5 py-[1px] rounded-full ${
                        tip.category === 'readiness' ? 'bg-emerald-500/10 text-emerald-400' :
                        tip.category === 'body' ? 'bg-rose-500/10 text-rose-400' :
                        tip.category === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' :
                        tip.category === 'prediction' ? 'bg-cyan-500/10 text-cyan-400' :
                        tip.category === 'streak' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>{tip.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Trends Panel — HydraScope style */}
      <AnimatePresence>
        {entries.length > 0 && showTrendsPanel && (
          <motion.div key="trendsscope" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative">
              {/* Header with title + week nav + mode toggle — ALWAYS VISIBLE */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">RecoveryScope</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setScopeOffset(o => o + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                    {new Date(scopeWeek[0].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(scopeWeek[6].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => setScopeOffset(o => Math.max(0, o - 1))} disabled={isScopeCurrentWeek} className={`p-1.5 rounded-xl border transition-all ${
                    isScopeCurrentWeek
                      ? 'bg-white/[0.02] border-white/[0.04] text-gray-600 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20'
                  }`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setScopeOffset(0)} className={`p-1.5 rounded-xl border transition-all ${
                    isScopeCurrentWeek
                      ? 'bg-white/[0.02] border-white/[0.04] text-gray-600'
                      : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'
                  }`} title={isScopeCurrentWeek ? 'Current week' : 'This week'}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
                  {(['volume', 'timeline', 'types'] as const).map(mode => (
                    <button key={mode} onClick={() => setTrendChartMode(mode)}
                      className={`relative px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        trendChartMode === mode
                          ? mode === 'volume'
                            ? 'text-violet-300 bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/25 shadow-lg shadow-violet-500/8'
                            : mode === 'timeline'
                              ? 'text-cyan-300 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 shadow-lg shadow-cyan-500/8'
                              : 'text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/8'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span className={trendChartMode === mode ? '' : 'opacity-50'}>{mode === 'volume' ? '📈' : mode === 'timeline' ? '🌙' : '💚'}</span>
                        {mode === 'volume' ? 'Readiness' : mode === 'timeline' ? 'Sleep' : 'Feeling'}
                      </span>
                      {trendChartMode === mode && <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts or empty state */}
              {!scopeWeek.some(d => d.hasData) ? (
                <div className="h-60 rounded-2xl bg-gradient-to-br from-black/50 via-white/[0.02] to-transparent border border-white/[0.06] flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-4">
                    <BarChart3 className="w-7 h-7 text-violet-400/30" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">No entries this week</p>
                  <p className="text-gray-500 text-xs">Log recovery data to unlock your RecoveryScope</p>
                </div>
              ) : (<>
                <div className="h-60 rounded-2xl bg-gradient-to-br from-black/50 via-white/[0.02] to-transparent border border-white/[0.06] p-4 shadow-inner shadow-white/5 relative overflow-hidden" style={{ minHeight: '240px' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                  <div className="relative z-10 h-full">
                    {trendChartMode === 'volume' ? (
                      (() => {
                        const hasData = scopeWeek.some(d => d.hasData)
                        if (!hasData) {
                          return (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">No recovery data this week</div>
                          )
                        }
                        const volumeData = scopeWeek.filter(d => d.hasData).map((d, i, arr) => ({ ...d, delta: i > 0 ? d.readiness - arr[i - 1].readiness : null }))
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData} barGap={6} barCategoryGap="30%">
                              <defs>
                                {volumeData.map((entry, idx) => {
                                  const isGoal = entry.readiness >= recoveryGoal
                                  return (
                                    <linearGradient key={idx} id={`readinessBarGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={isGoal ? '#34d399' : '#818cf8'} stopOpacity={isGoal ? 0.95 : 0.9} />
                                      <stop offset="50%" stopColor={isGoal ? '#10b981' : '#6366f1'} stopOpacity={isGoal ? 0.85 : 0.75} />
                                      <stop offset="100%" stopColor={isGoal ? '#059669' : '#4f46e5'} stopOpacity={0.1} />
                                    </linearGradient>
                                  )
                                })}
                                <linearGradient id="readinessRefLine" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#c084fc" stopOpacity={0} />
                                  <stop offset="50%" stopColor="#c084fc" stopOpacity={0.8} />
                                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                                </linearGradient>
                                <filter id="readinessGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              </defs>
                              <ReferenceArea y1={recoveryGoal} y2={100} fill="rgba(52,211,153,0.04)" />
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={5} />
                              <YAxis tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}`} width={24} ticks={[0, 25, 50, 75, 100]} />
                              <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0].payload
                                const r = getReadiness(d.energy, d.soreness, d.stress, d.mood)
                                return (
                                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-[11px] shadow-2xl leading-relaxed min-w-[180px]">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: r.color, boxShadow: `0 0 8px ${r.color}` }} />
                                        <span className="text-white font-bold text-xs">{d.label === 'Today' ? 'Today' : d.label}</span>
                                      </div>
                                      <span className="font-bold text-sm" style={{ color: r.color }}>{r.score}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2.5">
                                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border" style={{ backgroundColor: `${r.color}20`, color: r.color, borderColor: `${r.color}30` }}>{r.label}</span>
                                      {d.delta !== null && (
                                        <span className={`text-[9px] ${d.delta > 0 ? 'text-emerald-400' : d.delta < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                          {d.delta > 0 ? '↑' : d.delta < 0 ? '↓' : '→'} {d.delta > 0 ? '+' : ''}{d.delta} yesterday
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1.5">
                                      {[
                                        { label: 'Energy', value: d.energy, max: 10, color: '#f59e0b' },
                                        { label: 'Soreness', value: d.soreness, max: 10, color: '#ef4444', invert: true },
                                        { label: 'Stress', value: d.stress, max: 10, color: '#a855f7', invert: true },
                                        { label: 'Mood', value: d.mood, max: 5, color: '#10b981' },
                                      ].map(m => {
                                        const pct = m.invert ? (1 - m.value / m.max) * 100 : (m.value / m.max) * 100
                                        return (
                                          <div key={m.label} className="flex items-center gap-2">
                                            <span className="text-gray-500 w-11 text-[9px]">{m.label}</span>
                                            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: m.color, opacity: 0.7 }} />
                                            </div>
                                            <span className="text-white font-semibold w-4 text-right text-[10px]">{m.value}</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500">
                                      <span>Goal: {recoveryGoal}</span>
                                      {d.delta !== null && <span>{d.delta > 0 ? 'Improving ↗' : d.delta < 0 ? 'Declining ↘' : 'Stable →'}</span>}
                                    </div>
                                  </motion.div>
                                )
                              }} cursor={{ fill: 'rgba(139,92,246,0.08)', radius: 6 }} />
                              <ReferenceLine y={recoveryGoal} stroke="url(#readinessRefLine)" strokeWidth={2} strokeDasharray="6 4" label={{ value: `🎯 ${recoveryGoal}`, fill: '#c084fc', fontSize: 10, fontWeight: 800, position: 'right' }} />
                              <Bar dataKey="readiness" radius={[8, 8, 0, 0]} maxBarSize={36} animationDuration={800} animationEasing="ease-out">
                                {volumeData.map((entry, idx) => (
                                  <Cell key={idx} fill={`url(#readinessBarGrad${idx})`} filter={entry.readiness >= recoveryGoal ? 'url(#readinessGlow)' : undefined} />
                                ))}
                                <LabelList dataKey="readiness" position="top" fill="#e5e7eb" fontSize={11} fontWeight={800} offset={6} formatter={(v: number) => v > 0 ? v : ''} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()
                    ) : trendChartMode === 'timeline' ? (
                      (() => {
                        const hasAnySleep = scopeWeek.some(d => d.sleepEntry)
                        if (!hasAnySleep) {
                          return (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log sleep to see timing data</div>
                          )
                        }
                        const qColors = ['#ef4444', '#f59e0b', '#38bdf8', '#a855f7', '#10b981']
                        const feelMap: Record<string, string> = { refreshed: '😊', tired: '😴', groggy: '😵', foggy: '🌫️' }
                        const chartData = scopeWeek.filter(d => d.sleepEntry).map(d => ({
                          ...d,
                          q: d.sleepEntry!.quality,
                          dur: d.sleepEntry!.duration,
                          bed: d.sleepEntry!.bedTime,
                          wake: d.sleepEntry!.wakeTime,
                          feel: d.sleepEntry!.morningFeel,
                          labelShort: d.label === 'Today' && scopeOffset === 0 ? 'Now' : d.label.slice(0, 3),
                        }))
                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barGap={6} barCategoryGap="30%">
                              <defs>
                                {[1,2,3,4,5].map(q => {
                                  const c = qColors[q - 1]
                                  return (
                                    <linearGradient key={q} id={`sleepBarGrad${q}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={c} stopOpacity={0.95} />
                                      <stop offset="50%" stopColor={c} stopOpacity={0.8} />
                                      <stop offset="100%" stopColor={c} stopOpacity={0.15} />
                                    </linearGradient>
                                  )
                                })}
                                <linearGradient id="sleepRefLine" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#34d399" stopOpacity={0} />
                                  <stop offset="50%" stopColor="#34d399" stopOpacity={0.8} />
                                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <filter id="sleepGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                              <XAxis dataKey="labelShort" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={5} />
                              <YAxis tick={{ fill: '#4b5563', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 12]} tickFormatter={v => `${v}h`} width={28} />
                              <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0].payload
                                const q = d.q
                                const c = qColors[q - 1]
                                const feelEmoji = d.feel ? feelMap[d.feel] : ''
                                return (
                                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-[11px] shadow-2xl leading-relaxed min-w-[160px]">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }} />
                                        <span className="text-white font-bold text-xs">{d.label === 'Today' && scopeOffset === 0 ? 'Today' : d.label}</span>
                                      </div>
                                      <span className="font-bold text-sm" style={{ color: c }}>{d.dur.toFixed(1)}h</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border" style={{ backgroundColor: `${c}20`, color: c, borderColor: `${c}30` }}>
                                        Q{d.q}
                                      </span>
                                      {d.bed && d.wake && (
                                        <span className="text-gray-500 text-[9px]">{d.bed} – {d.wake}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(d.dur / 12) * 100}%`, backgroundColor: c, opacity: 0.6 }} />
                                      </div>
                                      <span className={`text-[9px] font-semibold ${d.dur >= 7 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {d.dur >= 7 ? '✓ Goal met' : `${(7 - d.dur).toFixed(1)}h short`}
                                      </span>
                                    </div>
                                    {feelEmoji && (
                                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[9px] text-gray-500">
                                        <span>Morning: {feelEmoji}</span>
                                      </div>
                                    )}
                                  </motion.div>
                                )
                              }} cursor={{ fill: 'rgba(139,92,246,0.08)', radius: 6 }} />
                              <ReferenceLine y={7} stroke="url(#sleepRefLine)" strokeWidth={2} strokeDasharray="6 4" label={{ value: '🎯 7h', fill: '#34d399', fontSize: 10, fontWeight: 800, position: 'right' }} />
                              <Bar dataKey="dur" radius={[8, 8, 0, 0]} maxBarSize={36} animationDuration={800} animationEasing="ease-out">
                                {chartData.map((entry, idx) => (
                                  <Cell key={idx} fill={`url(#sleepBarGrad${entry.q})`} filter={entry.dur >= 7 ? 'url(#sleepGlow)' : undefined} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      })()
                    ) : (
                      scopeFeelingData.length > 0 ? (
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <defs>
                                  {scopeFeelingData.map((entry, idx) => (
                                    <radialGradient key={idx} id={`donutGrad${idx}`} cx="50%" cy="50%" r="50%">
                                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                      <stop offset="60%" stopColor={entry.color} stopOpacity={0.7} />
                                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.15} />
                                    </radialGradient>
                                  ))}
                                  <filter id="segGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                                </defs>
                                <Pie data={scopeFeelingData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="feeling" animationDuration={1000} animationEasing="ease-out" stroke="rgba(255,255,255,0.03)" strokeWidth={1}>
                                  {scopeFeelingData.map((_, idx) => (
                                    <Cell key={idx} fill={`url(#donutGrad${idx})`} filter="url(#segGlow)" />
                                  ))}
                                </Pie>
                                <Tooltip content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const data = payload[0].payload
                                  const total = scopeFeelingData.reduce((s, d) => s + d.count, 0)
                                  const pct = total > 0 ? Math.round((data.count / total) * 100) : 0
                                  return (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                      className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2.5 shadow-2xl min-w-[120px]">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                        <p className="text-white font-bold text-xs">{data.feeling}</p>
                                      </div>
                                      <p className="text-gray-400 text-[10px]"><span className="text-white font-semibold">{data.count}</span> entries · <span className="text-white font-semibold">{pct}%</span></p>
                                    </motion.div>
                                  )
                                }} />
                                {(() => {
                                  const feelings = scopeWeek.filter(d => d.hasData).map(d => entries.find(e => e.date === d.date)?.recoveryFeeling).filter(Boolean) as number[]
                                  const avg = feelings.length > 0 ? (feelings.reduce((a, b) => a + b, 0) / feelings.length) : 0
                                  return (<>
                                    <text x="50%" y="44%" textAnchor="middle" fill="#e5e7eb" fontSize={22} fontWeight={800}>{avg.toFixed(1)}</text>
                                    <text x="50%" y="55%" textAnchor="middle" fill="#6b7280" fontSize={9} fontWeight={600}>/ 5 · {Math.round(avg / 5 * 100)}%</text>
                                  </>)
                                })()}
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex items-center justify-center gap-2.5 pb-0.5 flex-wrap">
                            {scopeFeelingData.map(f => {
                              const total = scopeFeelingData.reduce((s, d) => s + d.count, 0)
                              const pct = total > 0 ? Math.round((f.count / total) * 100) : 0
                              return (
                                <span key={f.feeling} className="flex items-center gap-1.5 text-[9px] font-semibold px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.color}` }} />
                                  {f.feeling} <span className="text-gray-500 font-normal">{pct}%</span>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log recovery feeling to see breakdown</div>
                      )
                    )}
                  </div>
                </div>

                {/* Stats strip - Premium Glass */}
                {(trendChartMode === 'timeline' ? scopeWeek.some(d => d.sleepEntry) : trendChartMode === 'types' ? scopeFeelingData.length > 0 : scopeWeek.some(d => d.hasData)) && (
                  <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                    <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                      {trendChartMode === 'volume' && (
                        <>
                          <span>📈 Avg <span className={`font-semibold ${scopeAvg >= recoveryGoal ? 'text-emerald-400' : scopeAvg >= recoveryGoal * 0.7 ? 'text-amber-400' : 'text-rose-400'}`}>{scopeAvg}</span> / {recoveryGoal}</span>
                          <span>🏆 Best <span className="text-emerald-400 font-semibold">{scopeBestDay.label}</span> <span className="text-gray-600">({scopeBestDay.readiness})</span></span>
                          <span>🎯 Hit <span className={`font-semibold ${scopeGoalMet >= 5 ? 'text-emerald-400' : scopeGoalMet >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{scopeGoalMet}/7</span></span>
                          {readinessPrediction && (
                            <span>🔮 Next <span className={`font-semibold ${readinessPrediction.value >= 70 ? 'text-emerald-400' : readinessPrediction.value >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{readinessPrediction.value}</span></span>
                          )}
                        </>
                      )}
                      {trendChartMode === 'timeline' && (
                        <>
                          {(() => {
                            const scopeSleep = scopeWeek.map(d => ({ date: d.date, label: d.label, sleep: d.sleepEntry }))
                            const withSleep = scopeSleep.filter(d => d.sleep)
                            const avgQ = withSleep.length > 0 ? Math.round(withSleep.reduce((s, d) => s + d.sleep!.quality, 0) / withSleep.length * 10) / 10 : 0
                            const best = withSleep.length > 0 ? withSleep.reduce((b, d) => d.sleep!.quality > (b.sleep?.quality ?? 0) ? d : b, withSleep[0]) : null
                            return (
                              <>
                                <span>🌙 Avg Q <span className="font-semibold text-cyan-400">{avgQ > 0 ? avgQ : '--'}</span></span>
                                {best && <span>⭐ Best <span className="font-semibold text-emerald-400">{best.label}</span> <span className="text-gray-600">(Q{best.sleep!.quality})</span></span>}
                                <span>🕐 Nights <span className="font-semibold text-indigo-400">{withSleep.length}d</span> / 7d</span>
                              </>
                            )
                          })()}
                        </>
                      )}
                      {trendChartMode === 'types' && (
                        <>
                          {(() => {
                            const feelings = scopeWeek.filter(d => d.hasData).map(d => entries.find(e => e.date === d.date)?.recoveryFeeling).filter(Boolean) as number[]
                            const avg = feelings.length > 0 ? (feelings.reduce((a, b) => a + b, 0) / feelings.length) : 0
                            return (<>
                              <span>💚 Avg <span className="font-semibold text-emerald-400">{avg.toFixed(1)}</span> <span className="text-gray-600">/ 5 ({Math.round(avg / 5 * 100)}%)</span></span>
                            </>)
                          })()}
                          <span>⭐ Top <span className="font-semibold text-emerald-400">{scopeFeelingData.sort((a, b) => b.count - a.count)[0]?.feeling || '--'}</span></span>
                          <span>📋 Entries <span className="font-semibold text-gray-300">{scopeFeelingData.reduce((s, f) => s + f.count, 0)}</span></span>
                        </>
                      )}
                    </div>
                    {/* Progress mini-bar */}
                    <div className="relative h-0.5 bg-white/[0.03]">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(scopeGoalMet / 7 * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {sortedEntries.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recovery History</h3>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => { if (window.confirm('Delete all recovery entries? This cannot be undone.')) { setEntries([]); localStorage.removeItem(STORAGE_KEY) } }}
            className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-medium flex items-center gap-1.5"
          ><Trash2 className="w-3.5 h-3.5" /> Clear All</motion.button>
        </div>
      )}
      {entries.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-emerald-400/50" />
            </div>
            <p className="text-gray-400 mb-1">No recovery entries yet</p>
            <p className="text-gray-500 text-sm mb-4">Start tracking your readiness and recovery</p>
            <button onClick={() => { setFormData({ energy: 7, soreness: 3, stress: 4, mood: 4, sleepQuality: 4, sleepHours: todaySleep?.duration?.toString() ?? '', recoveryFeeling: 3, domsAreas: [], domsSeverity: {}, notes: '' }); setShowForm(true) }}
              className="px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-bold flex items-center gap-1.5 mx-auto">
              <Plus className="w-3.5 h-3.5" /> Log Recovery
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedEntries.map((entry, i) => {
              const r = getReadiness(entry.energy, entry.soreness, entry.stress, entry.mood)
              return (
                <motion.div key={entry.id} layout
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-4 sm:p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.15)' }}>
                          <Heart className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white tracking-tight">
                              {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </h4>
                            {r.score >= 85 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium">Peak</span>
                            ) : r.score >= 70 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-[10px] font-medium">Ready</span>
                            ) : r.score >= 50 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-medium">Fair</span>
                            ) : r.score >= 30 ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[10px] font-medium">Tired</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-400 text-[10px] font-medium">Exhausted</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Score: <span className="font-semibold text-white">{r.score}</span> / 100
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <motion.button onClick={(e) => { e.stopPropagation(); const s = findSleep(sleep, entry.date); setFormData({ energy: entry.energy, soreness: entry.soreness, stress: entry.stress, mood: entry.mood, sleepQuality: entry.sleepQuality, sleepHours: entry.sleepHours?.toString() || s?.duration?.toString() || '', recoveryFeeling: entry.recoveryFeeling || 3, domsAreas: entry.domsAreas, domsSeverity: entry.domsSeverity || {}, notes: entry.notes || '' }); setShowForm(true) }}
                          className="p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100">
                          <Pencil className="w-4 h-4" />
                        </motion.button>
                        <motion.button onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry) }}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                      <span className="text-xs font-medium text-white">E:{entry.energy}</span>
                      <span className="text-xs font-medium text-white">S:{entry.soreness}</span>
                      <span className="text-xs font-medium text-white">St:{entry.stress}</span>
                      <span className="text-xs font-medium text-white">M:{entry.mood}</span>
                      <span className="text-xs font-medium text-white">Sleep Q:{entry.sleepQuality}</span>
                      {entry.sleepHours && <span className="text-xs text-gray-500">{entry.sleepHours}h slept</span>}
                      {entry.recoveryFeeling && <span className="text-xs text-emerald-400">Feeling: {entry.recoveryFeeling}/5</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.domsAreas.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-medium">
                          DOMS: {entry.domsAreas.length} areas
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">
                        &ldquo;{entry.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Log Modal */}
      <AnimatePresence>{showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-xl rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 p-6 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Heart size={20} className="text-emerald-400" />
                </div>
                <div><h3 className="text-lg font-bold text-white">{todayEntry ? 'Edit Recovery' : 'Log Recovery'}</h3><p className="text-xs text-slate-500">{new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p></div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><X size={16} /></button>
            </div>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Recovery Metrics</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-amber-500/10 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-3">
                    <Slider label="Energy Level" value={formData.energy} onChange={v => setFormData(prev => ({ ...prev, energy: v }))} color="#f59e0b" hint="Physical & mental energy" />
                  </div>
                  <div className="rounded-xl border border-rose-500/10 bg-gradient-to-b from-rose-500/[0.03] to-transparent p-3">
                    <Slider label="Muscle Soreness" value={formData.soreness} onChange={v => setFormData(prev => ({ ...prev, soreness: v }))} color="#ef4444" hint="How sore are your muscles" />
                  </div>
                  <div className="rounded-xl border border-violet-500/10 bg-gradient-to-b from-violet-500/[0.03] to-transparent p-3">
                    <Slider label="Stress Level" value={formData.stress} onChange={v => setFormData(prev => ({ ...prev, stress: v }))} color="#a855f7" hint="Mental & emotional stress" />
                  </div>
                  <div className="rounded-xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.03] to-transparent p-3">
                    <Slider label="Mood" value={formData.mood} onChange={v => setFormData(prev => ({ ...prev, mood: v }))} min={1} max={5} color="#10b981" hint="Overall emotional state" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Moon size={12} className="text-indigo-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Last Night's Sleep</span>
                </div>
                {todaySleep ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-b from-indigo-500/[0.04] to-transparent p-2.5 flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-2.5 h-2.5 rounded-full transition-all ${n <= todaySleep.quality ? 'bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]' : 'bg-white/[0.06] border border-white/[0.04]'}`} />
                      ))}
                    </div>
                    <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-b from-indigo-500/[0.04] to-transparent p-2.5 flex items-center gap-2">
                      <span className="text-xs text-white font-bold">{todaySleep.duration}h · Q{todaySleep.quality}/5</span>
                    </div>
                    {(todaySleep.bedTime && todaySleep.wakeTime) && (
                      <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-b from-indigo-500/[0.04] to-transparent p-2.5 flex items-center gap-1.5">
                        <Clock size={9} className="text-slate-500" />
                        <span className="text-[9px] text-slate-500">{todaySleep.bedTime} – {todaySleep.wakeTime}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
                    <p className="text-[10px] text-slate-500">No sleep logged for this date</p>
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Body Response</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.03] to-transparent p-3">
                    <label className="text-[10px] text-slate-400 font-medium mb-2 block">Recovery Feeling</label>
                    <div className="flex items-center justify-between gap-1">
                      {[
                        { n: 1, label: 'Poor' },
                        { n: 2, label: 'Fair' },
                        { n: 3, label: 'Good' },
                        { n: 4, label: 'Great' },
                        { n: 5, label: 'Peak' },
                      ].map(({ n, label }) => (
                        <button key={n} type="button" onClick={() => setFormData(prev => ({ ...prev, recoveryFeeling: n }))}
                          className={`flex flex-col items-center gap-0.5 transition-all ${
                            formData.recoveryFeeling === n ? 'scale-110' : 'opacity-60 hover:opacity-100'
                          }`}>
                          <div className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${
                            formData.recoveryFeeling === n
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                              : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
                          }`}>{n}</div>
                          <span className={`text-[7px] font-medium ${formData.recoveryFeeling === n ? 'text-emerald-400/80' : 'text-slate-600'}`}>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-rose-500/10 bg-gradient-to-b from-rose-500/[0.03] to-transparent p-3">
                  <p className="text-[10px] text-slate-400 font-medium mb-2">DOMS Areas <span className="text-slate-600 font-normal">— tap to cycle</span></p>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSCLE_AREAS.map(area => {
                      const sev = formData.domsSeverity[area]
                      return (
                        <motion.button key={area} onClick={() => toggleDomArea(area)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all",
                            !formData.domsAreas.includes(area) ? "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                              : sev === 'severe' ? "bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                                : sev === 'moderate' ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          )}>{area}{formData.domsAreas.includes(area) ? ` (${sev || 'mild'})` : ''}</motion.button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Pencil size={12} className="text-purple-400" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes</span>
                </div>
                <div className="rounded-xl border border-purple-500/10 bg-gradient-to-b from-purple-500/[0.03] to-transparent p-3">
                  <label className="text-[10px] text-slate-400 font-medium">Quick Notes</label>
                  <input value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Brief notes (e.g., 'Leg day was brutal')"
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:border-purple-500/50 focus:outline-none transition-all" />
                </div>
              </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
              <div className="flex gap-3">
                <motion.button onClick={() => setShowForm(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-bold">Cancel</motion.button>
                <motion.button onClick={saveEntry} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:from-emerald-500/30 hover:to-emerald-500/20 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/5"><Heart size={16} /> Save Entry</motion.button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>{deleteTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <motion.div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4"
              animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <AlertTriangle size={24} className="text-rose-400" />
            </motion.div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-slate-400 text-sm text-center mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <motion.button onClick={() => setDeleteTarget(null)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all font-bold">Cancel</motion.button>
              <motion.button onClick={() => { setEntries(prev => prev.filter(e => e.id !== deleteTarget.id)); setDeleteTarget(null) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 transition-all font-bold">Delete</motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}
