import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Zap, Target, Award, TrendingUp,
  BarChart3, Crown, Activity, CalendarCheck, CheckCircle2,
  Dumbbell, Utensils, Moon, Droplets, Heart, Pill,
  Layers, Hash, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Workout, Meal, SleepEntry, HydrationEntry } from '@/types/domain'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts'

interface RecoveryEntry { id: string; date: string }
interface SupplementLog { id: string; date: string }

const HABIT_TYPES = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: '#f43f5e', glow: 'rgba(244,63,94,0.35)' },
  { key: 'nutrition', label: 'Nutrition', icon: Utensils, color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  { key: 'sleep', label: 'Sleep', icon: Moon, color: '#8b5cf6', glow: 'rgba(139,92,246,0.35)' },
  { key: 'hydration', label: 'Hydration', icon: Droplets, color: '#06b6d4', glow: 'rgba(6,182,212,0.35)' },
  { key: 'recovery', label: 'Recovery', icon: Heart, color: '#10b981', glow: 'rgba(16,185,129,0.35)' },
  { key: 'supplements', label: 'Supps', icon: Pill, color: '#a855f7', glow: 'rgba(168,85,247,0.35)' },
] as const

function loadRecoveryEntries(): RecoveryEntry[] {
  try { const raw = localStorage.getItem('vitalfi_recovery_entries'); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function loadSupplementLogs(): SupplementLog[] {
  try { const raw = localStorage.getItem('supplementLogs'); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, title: 'Beginner', icon: '🌱', color: '#6b7280' },
  { level: 2, min: 10, title: 'Consistent', icon: '🔥', color: '#f59e0b' },
  { level: 3, min: 30, title: 'Dedicated', icon: '⚡', color: '#06b6d4' },
  { level: 4, min: 60, title: 'Warrior', icon: '💪', color: '#f43f5e' },
  { level: 5, min: 100, title: 'Elite', icon: '👑', color: '#8b5cf6' },
  { level: 6, min: 200, title: 'Legend', icon: '⭐', color: '#f59e0b' },
  { level: 7, min: 365, title: 'Immortal', icon: '🏆', color: '#10b981' },
]

interface OverallStats {
  currentStreak: number; longestStreak: number; totalWorkouts: number
  thisMonthWorkouts: number; uniqueDays: number; weeklyAverage: number
  consistency: number; bestMonthName: string; daysSinceFirst: number
}

const ACHIEVEMENTS: { id: string; name: string; icon: string; check: (s: OverallStats) => boolean; color: string }[] = [
  { id: 'first_step', name: 'First Step', icon: '🌟', check: s => s.totalWorkouts >= 1, color: '#10b981' },
  { id: 'week_warrior', name: 'Week Warrior', icon: '⚔️', check: s => s.totalWorkouts >= 7, color: '#06b6d4' },
  { id: 'dedicated', name: 'Dedicated', icon: '🎯', check: s => s.totalWorkouts >= 30, color: '#8b5cf6' },
  { id: 'century_club', name: 'Century Club', icon: '🏆', check: s => s.totalWorkouts >= 100, color: '#f59e0b' },
  { id: 'iron_will', name: 'Iron Will', icon: '🔥', check: s => s.longestStreak >= 7, color: '#f97316' },
  { id: 'unstoppable', name: 'Unstoppable', icon: '⚡', check: s => s.longestStreak >= 14, color: '#ef4444' },
  { id: 'legendary', name: 'Legendary', icon: '👑', check: s => s.longestStreak >= 30, color: '#a855f7' },
  { id: 'monthly_master', name: 'Monthly Master', icon: '📅', check: s => s.thisMonthWorkouts >= 20, color: '#3b82f6' },
]

function computeHabitStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const unique = [...new Set(dates)].sort()
  let longest = 0; let currentRun = 1
  for (let i = 1; i < unique.length; i++) {
    const d1 = new Date(unique[i - 1]); const d2 = new Date(unique[i])
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) currentRun++
    else { longest = Math.max(longest, currentRun); currentRun = 1 }
  }
  longest = Math.max(longest, currentRun)
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let current = 0
  if (unique.includes(today) || unique.includes(yesterday)) {
    let temp = 1
    for (let i = unique.length - 1; i >= 1; i--) {
      const d1 = new Date(unique[i - 1]); const d2 = new Date(unique[i])
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) temp++; else break
    }
    current = temp
  }
  return { current, longest }
}

function computeStats(workouts: Workout[]): OverallStats {
  if (workouts.length === 0) return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisMonthWorkouts: 0, uniqueDays: 0, weeklyAverage: 0, consistency: 0, bestMonthName: '', daysSinceFirst: 0 }
  const today = new Date()
  const uniqueDates = [...new Set(workouts.map(w => w.date))].sort()
  const totalWorkouts = workouts.length; const uniqueDays = uniqueDates.length
  const thisMonthWorkouts = workouts.filter(w => { const d = new Date(w.date); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() }).length
  const { current: currentStreak, longest: longestStreak } = computeHabitStreak(workouts.map(w => w.date))
  const firstDate = new Date(uniqueDates[0])
  const daysSinceFirst = Math.max(1, Math.round((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
  const weeksSinceFirst = Math.max(1, daysSinceFirst / 7)
  const weeklyAverage = Math.round((totalWorkouts / weeksSinceFirst) * 10) / 10
  const consistency = Math.round((uniqueDays / daysSinceFirst) * 100)
  const monthMap = new Map<string, number>()
  workouts.forEach(w => { const key = w.date.slice(0, 7); monthMap.set(key, (monthMap.get(key) || 0) + 1) })
  let bestMonthKey = ''; let bestMonthCount = 0
  monthMap.forEach((count, key) => { if (count > bestMonthCount) { bestMonthCount = count; bestMonthKey = key } })
  const bestMonthName = bestMonthKey ? new Date(bestMonthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
  return { currentStreak, longestStreak, totalWorkouts, thisMonthWorkouts, uniqueDays, weeklyAverage, consistency, bestMonthName, daysSinceFirst }
}

function loadAchievements(): Set<string> {
  try { const raw = localStorage.getItem('vitalfi_achievements'); return new Set(raw ? JSON.parse(raw) : []) } catch { return new Set() }
}
function saveAchievements(ids: Set<string>) { localStorage.setItem('vitalfi_achievements', JSON.stringify([...ids])) }

function StreakRing({ value, max, size = 44, strokeWidth = 3, color }: { value: number; max: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - progress)
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 4px ${color}44)` }} />
    </svg>
  )
}

export function Habits() {
  const { workouts, meals, sleep, hydration } = useAppStore()
  const [unlocked, setUnlocked] = useState<Set<string>>(loadAchievements)
  const [showNewBadge, setShowNewBadge] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'dashboard' | 'analytics' | 'milestones' | null>(null)
  const [chartTab, setChartTab] = useState<'streaks' | 'history' | 'goals'>('streaks')
  const [recoveryEntries, setRecoveryEntries] = useState<RecoveryEntry[]>(loadRecoveryEntries)
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>(loadSupplementLogs)
  const [scopeOffset, setScopeOffset] = useState(0)

  const scopeWeek = useMemo(() => {
    const days: { fullDate: string; weekday: string; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i + scopeOffset * 7)
      const ds = d.toISOString().split('T')[0]
      days.push({
        fullDate: ds,
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        label: i === 0 && scopeOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      })
    }
    return days
  }, [scopeOffset])

  const isScopeCurrentWeek = scopeOffset === 0

  const scopeWeekLabel = useMemo(() => {
    if (isScopeCurrentWeek) return 'This Week'
    const start = new Date(scopeWeek[0].fullDate)
    const end = new Date(scopeWeek[6].fullDate)
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [scopeWeek, isScopeCurrentWeek])

  useEffect(() => { setRecoveryEntries(loadRecoveryEntries()) }, [])
  useEffect(() => { setSupplementLogs(loadSupplementLogs()) }, [])

  const today = new Date().toISOString().split('T')[0]

  const habitStats = useMemo(() => ({
    workout: computeHabitStreak(workouts.map((w: Workout) => w.date)),
    nutrition: computeHabitStreak(meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date)),
    sleep: computeHabitStreak(sleep.map((s: SleepEntry) => s.date)),
    hydration: computeHabitStreak(hydration.map((h: HydrationEntry) => h.date)),
    recovery: computeHabitStreak(recoveryEntries.map((r: RecoveryEntry) => r.date)),
    supplements: computeHabitStreak(supplementLogs.map((s: SupplementLog) => s.date)),
  }), [workouts, meals, sleep, hydration, recoveryEntries, supplementLogs])

  const habitsDoneToday = {
    workout: workouts.some((w: Workout) => w.date === today),
    nutrition: meals.some((m: Meal) => m.date === today),
    sleep: sleep.some((s: SleepEntry) => s.date === today),
    hydration: hydration.some((h: HydrationEntry) => h.date === today),
    recovery: recoveryEntries.some((r: RecoveryEntry) => r.date === today),
    supplements: supplementLogs.some((s: SupplementLog) => s.date === today),
  }

  const weeklyCompletion = useMemo(() => {
    const now = new Date()
    const oneWeek = 7
    const getCount = (dates: string[]) => {
      const set = new Set(dates); let count = 0
      for (let i = 0; i < oneWeek; i++) { const d = new Date(now); d.setDate(d.getDate() - i); if (set.has(d.toISOString().split('T')[0])) count++ }
      return count
    }
    return {
      workout: getCount(workouts.map((w: Workout) => w.date)),
      nutrition: getCount(meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date)),
      sleep: getCount(sleep.map((s: SleepEntry) => s.date)),
      hydration: getCount(hydration.map((h: HydrationEntry) => h.date)),
      recovery: getCount(recoveryEntries.map((r: RecoveryEntry) => r.date)),
      supplements: getCount(supplementLogs.map((s: SupplementLog) => s.date)),
    }
  }, [workouts, meals, sleep, hydration, recoveryEntries, supplementLogs])

  const stats = useMemo(() => computeStats(workouts), [workouts])

  useEffect(() => {
    const prev = loadAchievements(); const newSet = new Set(prev)
    let newlyUnlocked: string | null = null
    ACHIEVEMENTS.forEach(a => { if (!newSet.has(a.id) && a.check(stats)) { newSet.add(a.id); newlyUnlocked = a.id } })
    if (newlyUnlocked) { setShowNewBadge(newlyUnlocked); setTimeout(() => setShowNewBadge(null), 4000) }
    if (newSet.size !== prev.size) { saveAchievements(newSet) }
    setUnlocked(newSet)
  }, [stats])

  const levelData = useMemo(() => {
    const current = LEVEL_THRESHOLDS.slice().reverse().find(t => stats.totalWorkouts >= t.min) || LEVEL_THRESHOLDS[0]
    const next = LEVEL_THRESHOLDS.find(t => t.min > stats.totalWorkouts)
    const progress = next ? ((stats.totalWorkouts - current.min) / (next.min - current.min)) * 100 : 100
    return { current, next, progress: Math.min(100, Math.max(0, progress)) }
  }, [stats.totalWorkouts])

  const diversityData = useMemo(() => {
    const categories = new Set<string>(); const exerciseIds = new Set<string>(); const categoryCounts: Record<string, number> = {}
    workouts.forEach((w: Workout) => {
      const cat = w.category || 'other'; categories.add(cat); categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      w.exercises?.forEach(e => exerciseIds.add(e.exerciseId))
    })
    const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
    return { categoryCount: categories.size, uniqueExercises: exerciseIds.size, topCategory: sortedCats[0]?.[0] || '', topCategoryCount: sortedCats[0]?.[1] || 0 }
  }, [workouts])

  const activeChallenges = useMemo(() => {
    const thisMonth = today.slice(0, 7)
    const thisMonthCount = workouts.filter((w: Workout) => w.date.startsWith(thisMonth)).length
    const cs = stats.currentStreak
    return [
      { id: 'month_10', name: '10 in a Month', target: 10, current: thisMonthCount, icon: '📅', color: '#06b6d4' },
      { id: 'month_15', name: '15 in a Month', target: 15, current: thisMonthCount, icon: '🔥', color: '#f97316' },
      { id: 'month_20', name: '20 in a Month', target: 20, current: thisMonthCount, icon: '⚡', color: '#f59e0b' },
      { id: 'streak_7', name: '7-Day Streak', target: 7, current: cs, icon: '🔗', color: '#8b5cf6' },
      { id: 'streak_14', name: '14-Day Streak', target: 14, current: cs, icon: '⛓️', color: '#ef4444' },
      { id: 'streak_30', name: '30-Day Streak', target: 30, current: cs, icon: '👑', color: '#a855f7' },
    ]
  }, [workouts, stats.currentStreak, today])

  const habitScore = useMemo(() => {
    const days = 90; const todayD = new Date(); const dates: string[] = []
    for (let i = 0; i < days; i++) { const d = new Date(todayD); d.setDate(d.getDate() - i); dates.push(d.toISOString().split('T')[0]) }
    const wSet = new Set(workouts.map((w: Workout) => w.date))
    const mSet = new Set(meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date))
    const sSet = new Set(sleep.map((s: SleepEntry) => s.date))
    const hSet = new Set(hydration.map((h: HydrationEntry) => h.date))
    const rSet = new Set(recoveryEntries.map((r: RecoveryEntry) => r.date))
    const supSet = new Set(supplementLogs.map((s: SupplementLog) => s.date))
    let wd = 0, nd = 0, sd = 0, hd = 0, rd = 0, supd = 0
    dates.forEach(d => { if (wSet.has(d)) wd++; if (mSet.has(d)) nd++; if (sSet.has(d)) sd++; if (hSet.has(d)) hd++; if (rSet.has(d)) rd++; if (supSet.has(d)) supd++ })
    return Math.round((wd / days) * 25 + (nd / days) * 20 + (sd / days) * 20 + (hd / days) * 15 + (rd / days) * 10 + (supd / days) * 10)
  }, [workouts, meals, sleep, hydration, recoveryEntries, supplementLogs])

  const scoreBreakdown = useMemo(() => {
    const days = 90; const todayD = new Date(); const dates: string[] = []
    for (let i = 0; i < days; i++) { const d = new Date(todayD); d.setDate(d.getDate() - i); dates.push(d.toISOString().split('T')[0]) }
    const wSet = new Set(workouts.map((w: Workout) => w.date))
    const mSet = new Set(meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date))
    const sSet = new Set(sleep.map((s: SleepEntry) => s.date))
    const hSet = new Set(hydration.map((h: HydrationEntry) => h.date))
    const rSet = new Set(recoveryEntries.map((r: RecoveryEntry) => r.date))
    const supSet = new Set(supplementLogs.map((s: SupplementLog) => s.date))
    let wd = 0, nd = 0, sd = 0, hd = 0, rd = 0, supd = 0
    dates.forEach(d => { if (wSet.has(d)) wd++; if (mSet.has(d)) nd++; if (sSet.has(d)) sd++; if (hSet.has(d)) hd++; if (rSet.has(d)) rd++; if (supSet.has(d)) supd++ })
    return [
      { key: 'workout', label: 'Workout', value: Math.round((wd / days) * 25), max: 25, color: '#f43f5e', icon: Dumbbell },
      { key: 'nutrition', label: 'Nutrition', value: Math.round((nd / days) * 20), max: 20, color: '#f97316', icon: Utensils },
      { key: 'sleep', label: 'Sleep', value: Math.round((sd / days) * 20), max: 20, color: '#8b5cf6', icon: Moon },
      { key: 'hydration', label: 'Hydration', value: Math.round((hd / days) * 15), max: 15, color: '#06b6d4', icon: Droplets },
      { key: 'recovery', label: 'Recovery', value: Math.round((rd / days) * 10), max: 10, color: '#10b981', icon: Heart },
      { key: 'supplements', label: 'Supps', value: Math.round((supd / days) * 10), max: 10, color: '#a855f7', icon: Pill },
    ]
  }, [workouts, meals, sleep, hydration, recoveryEntries, supplementLogs])

  const correlations = useMemo(() => {
    const allDates = [...new Set([...workouts.map((w: Workout) => w.date), ...meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date), ...sleep.map((s: SleepEntry) => s.date), ...hydration.map((h: HydrationEntry) => h.date), ...recoveryEntries.map((r: RecoveryEntry) => r.date), ...supplementLogs.map((s: SupplementLog) => s.date)])].sort()
    const workoutDates = new Set(workouts.map((w: Workout) => w.date)); const insights: string[] = []
    const wdDurations = allDates.filter(d => workoutDates.has(d)).map(d => { const s = sleep.find((se: SleepEntry) => se.date === d); return s?.duration ?? 0 }).filter(h => h > 0)
    const nwdDurations = allDates.filter(d => !workoutDates.has(d)).map(d => { const s = sleep.find((se: SleepEntry) => se.date === d); return s?.duration ?? 0 }).filter(h => h > 0)
    if (wdDurations.length >= 2 && nwdDurations.length >= 2) {
      const avgWith = Math.round((wdDurations.reduce((a, b) => a + b, 0) / wdDurations.length) * 10) / 10
      const avgWithout = Math.round((nwdDurations.reduce((a, b) => a + b, 0) / nwdDurations.length) * 10) / 10
      const diff = Math.round((avgWith - avgWithout) * 10) / 10
      if (Math.abs(diff) >= 0.2) insights.push(`When you work out, you ${diff > 0 ? 'sleep' : 'lose'} ${Math.abs(diff)}h ${diff > 0 ? 'more' : 'less'} on average`)
    }
    return insights
  }, [workouts, meals, sleep, hydration])

  const streakPrediction = useMemo(() => {
    const dates = [...new Set(workouts.map((w: Workout) => w.date))].sort()
    if (dates.length < 2) return null
    const streaks: number[] = []; let currentRun = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) currentRun++; else { streaks.push(currentRun); currentRun = 1 }
    }
    streaks.push(currentRun)
    const avgStreak = Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
    const predictedStreak = Math.max(stats.currentStreak, Math.round((stats.currentStreak + avgStreak) / 2))
    const confidence = stats.currentStreak > 0 ? Math.min(100, Math.round((stats.currentStreak / Math.max(predictedStreak, 1)) * 100)) : 0
    return { predictedStreak, avgStreak, confidence }
  }, [workouts, stats.currentStreak])

  const doneTodayCount = useMemo(() => Object.values(habitsDoneToday).filter(Boolean).length, [habitsDoneToday])

  const panelConfig = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Layers, color: 'amber' },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3, color: 'violet' },
    { id: 'milestones' as const, label: 'Milestones', icon: Crown, color: 'emerald' },
  ]

  const togglePanel = (id: typeof activePanel) => setActivePanel(p => p === id ? null : id)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Streaks</h2>
          <p className="text-sm text-gray-400 mt-0.5">Habit streaks, levels & activity analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {workouts.length > 0 && panelConfig.map(p => {
            const isActive = activePanel === p.id
            const c: Record<string, string> = {
              amber: isActive ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10' : '',
              violet: isActive ? 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/10' : '',
              emerald: isActive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' : '',
            }
            return (
              <button key={p.id} onClick={() => togglePanel(p.id)}
                className={`p-2 rounded-xl border transition-all duration-200 hover:scale-105 ${isActive ? c[p.color] : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                title={p.label}>
                <p.icon className="w-5 h-5" />
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 6 Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem] hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1"><Activity className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">Score</span></div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{habitScore}<span className="text-sm text-gray-500 ml-1 font-normal">/100</span></p>
            <p className="text-xs text-gray-500 mt-0.5">90-day habit score</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-orange-500/5 min-h-[7.5rem] hover:shadow-orange-500/10 hover:border-orange-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-orange-400/80 text-sm mb-1"><Flame className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">Current Streak</span></div>
            <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">{stats.currentStreak}<span className="text-sm text-gray-500 ml-1 font-normal">days</span></p>
            <p className="text-xs text-gray-500 mt-0.5">active streak</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-400/5 min-h-[7.5rem] hover:shadow-amber-400/10 hover:border-amber-400/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1"><Zap className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">Best Streak</span></div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{stats.longestStreak}<span className="text-sm text-gray-500 ml-1 font-normal">days</span></p>
            <p className="text-xs text-gray-500 mt-0.5">personal record</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-purple-500/5 min-h-[7.5rem] hover:shadow-purple-500/10 hover:border-purple-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-purple-400/80 text-sm mb-1"><Dumbbell className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">Total Workouts</span></div>
            <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{stats.totalWorkouts}</p>
            <p className="text-xs text-gray-500 mt-0.5">lifetime</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-blue-500/5 min-h-[7.5rem] hover:shadow-blue-500/10 hover:border-blue-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-blue-400/80 text-sm mb-1"><CalendarCheck className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">This Month</span></div>
            <p className="text-3xl font-bold text-blue-400 drop-shadow-lg">{stats.thisMonthWorkouts}</p>
            <p className="text-xs text-gray-500 mt-0.5">workouts this month</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem] hover:shadow-emerald-500/10 hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1"><Target className="w-4 h-4" /><span className="text-[9px] font-semibold uppercase tracking-wider">Consistency</span></div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{stats.consistency}<span className="text-sm text-gray-500 ml-1 font-normal">%</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{stats.uniqueDays} of {stats.daysSinceFirst} days</p>
          </div>
        </div>
      </motion.div>

      {/* PANEL 1: Streak Dashboard */}
      <AnimatePresence>
        {workouts.length > 0 && activePanel === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-xl p-4 md:p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-500/20 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Layers className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Streak Dashboard</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Today's progress & habit overview</p>
                  </div>
                </div>
                {/* Today's Ring */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">Today</span>
                  <div className="relative">
                    <svg width="40" height="40" className="-rotate-90">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <motion.circle cx="20" cy="20" r="16" fill="none" stroke="url(#todayGrad)" strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={100.53} initial={{ strokeDashoffset: 100.53 }}
                        animate={{ strokeDashoffset: 100.53 * (1 - doneTodayCount / 6) }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.4))' }} />
                    </svg>
                    <svg width="0" height="0"><defs><linearGradient id="todayGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#10b981" /></linearGradient></defs></svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{doneTodayCount}</span>
                  </div>
                </div>
              </div>

              {/* 6 Habit Streak Cards — Premium */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
                {HABIT_TYPES.map((habit) => {
                  const hs = habitStats[habit.key]; const done = habitsDoneToday[habit.key]; const wk = weeklyCompletion[habit.key]
                  const ringMax = Math.max(hs.longest, 1)
                  return (
                    <motion.div key={habit.key} whileHover={{ y: -4, scale: 1.02 }} className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group cursor-default"
                      style={{ borderColor: `${habit.color}25`, background: `linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, boxShadow: `0 4px 20px ${habit.glow}15` }}>
                      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${habit.color}30, transparent 70%)` }} />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${habit.color}08, transparent 50%)` }} />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl transition-all duration-300 group-hover:scale-110" style={{ background: `${habit.color}20`, boxShadow: `0 0 12px ${habit.glow}20` }}>
                              <habit.icon size={14} style={{ color: habit.color }} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: habit.color }}>{habit.label}</span>
                          </div>
                          {done ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                              <CheckCircle2 size={10} className="text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <StreakRing value={hs.current} max={ringMax} size={52} strokeWidth={3.5} color={habit.color} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-white drop-shadow-lg tabular-nums">{hs.current}</span>
                              <span className="text-[10px] text-gray-500">days</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-gray-500">Best: <span className="text-white font-semibold">{hs.longest}</span></span>
                              <span className="w-1 h-1 rounded-full bg-gray-600" />
                              <span className="text-[10px] text-gray-500">Wk: <span className="text-white font-semibold">{wk}/7</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(hs.current / ringMax) * 100}%` }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}88)`, boxShadow: `0 0 8px ${habit.glow}` }} />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Score Breakdown */}
              <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full -ml-20 -mt-20 blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Score Breakdown</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-xs font-bold text-white">{habitScore}</span>
                      <span className="text-[9px] text-gray-500">/ 100</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {scoreBreakdown.map((item, idx) => (
                      <motion.div key={item.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <item.icon size={10} style={{ color: item.color }} />
                            <span className="text-[11px] text-gray-400 font-medium">{item.label}</span>
                          </div>
                          <span className="text-[11px] font-bold text-white">{item.value}<span className="text-gray-600 font-normal">/{item.max}</span></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden relative">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.max) * 100}%` }} transition={{ duration: 1, delay: 0.3 + idx * 0.08, ease: 'easeOut' }}
                            className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${item.color}, ${item.color}66)`, boxShadow: `0 0 8px ${item.color}44` }}>
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL 2: Analytics & Trends */}
      <AnimatePresence>
        {workouts.length > 0 && activePanel === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 md:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="absolute top-1/2 right-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Analytics</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Trends, distributions & predictions</p>
                </div>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setScopeOffset(o => o - 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">{scopeWeekLabel}</span>
                  <button onClick={() => setScopeOffset(o => Math.min(0, o + 1))} disabled={isScopeCurrentWeek}
                    className={`p-1.5 rounded-xl transition-all ${isScopeCurrentWeek
                      ? 'bg-white/[0.02] border border-white/[0.04] text-gray-600 cursor-not-allowed'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20'}`}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isScopeCurrentWeek && (
                    <button onClick={() => setScopeOffset(0)} className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="This week">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
                  {(['streaks', 'history', 'goals'] as const).map(mode => (
                    <button key={mode} onClick={() => setChartTab(mode)}
                      className={`relative px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        chartTab === mode
                          ? 'text-violet-300 bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/25 shadow-lg shadow-violet-500/8'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      {mode === 'streaks' ? '🏆 Streaks' : mode === 'history' ? '📋 History' : '🎯 Goals'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="rounded-2xl bg-gradient-to-br from-black/60 via-white/[0.02] to-transparent border border-white/[0.06] p-3 md:p-4 shadow-inner shadow-white/5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none rounded-2xl" />
                <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  {chartTab === 'streaks' && (() => {
                    const habitChartData = HABIT_TYPES.map(h => ({
                      key: h.label.slice(0, 3).toUpperCase(),
                      current: habitStats[h.key].current,
                      best: habitStats[h.key].longest,
                      week: weeklyCompletion[h.key],
                      color: h.color,
                    }))
                    return (
                      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Habit Streaks</span>
                          <span className="text-[8px] text-gray-600">· current vs best · this week</span>
                        </div>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={habitChartData} layout="vertical" barCategoryGap={7} barGap={2}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                              <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="key" width={42} tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }}
                                formatter={(v: number, name: string) => [`${v}d`, name === 'current' ? 'Current' : name === 'best' ? 'Best' : 'This week']} />
                              <Bar dataKey="best" name="best" radius={[0, 6, 6, 0]} barSize={6} fill="rgba(255,255,255,0.08)" animationDuration={600} />
                              <Bar dataKey="current" name="current" radius={[0, 6, 6, 0]} barSize={9} animationDuration={600} animationEasing="ease-out">
                                {habitChartData.map((d, i) => (
                                  <Cell key={i} fill={d.color} style={{ filter: d.current > 0 ? `drop-shadow(0 0 5px ${d.color}55)` : 'none' }} />
                                ))}
                              </Bar>
                              <Bar dataKey="week" name="week" radius={[0, 6, 6, 0]} barSize={4} fill="#a78bfa" opacity={0.65} animationDuration={600} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )})()
                  }
                  {chartTab === 'streaks' && (() => {
                    const dailyData = scopeWeek.map(day => ({
                      label: day.label === 'Today' ? 'Now' : day.weekday.slice(0, 3),
                      completed: HABIT_TYPES.filter(h => {
                        if (h.key === 'workout') return workouts.some((w: Workout) => w.date === day.fullDate)
                        if (h.key === 'nutrition') return meals.some((m: Meal) => m.date === day.fullDate && m.calories > 0)
                        if (h.key === 'sleep') return sleep.some((s: SleepEntry) => s.date === day.fullDate)
                        if (h.key === 'hydration') return hydration.some((h2: HydrationEntry) => h2.date === day.fullDate)
                        if (h.key === 'recovery') return recoveryEntries.some((r: RecoveryEntry) => r.date === day.fullDate)
                        if (h.key === 'supplements') return supplementLogs.some((s: SupplementLog) => s.date === day.fullDate)
                        return false
                      }).length
                    }))
                    return (
                    <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Daily Completion</span>
                        <span className="text-[8px] text-gray-600">· habits done per day</span>
                      </div>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyData} barCategoryGap={8}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 6]} ticks={[0, 2, 4, 6]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                              itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }}
                              formatter={(v: number) => [`${v}/6 habits`, 'Completed']} />
                            <Bar dataKey="completed" radius={[6, 6, 0, 0]} maxBarSize={32} animationDuration={600} animationEasing="ease-out">
                              {dailyData.map((entry, i) => (
                                <Cell key={i} fill={entry.completed >= 4 ? '#a855f7' : entry.completed >= 2 ? '#8b5cf6' : '#6b7280'}
                                  style={{ filter: entry.completed >= 4 ? 'drop-shadow(0 0 6px rgba(168,85,247,0.4))' : 'none' }} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    )})()
                  }
                  {chartTab === 'history' && (() => {
                    type StreakSegment = { label: string; color: string; icon: typeof Dumbbell; start: string; end: string; length: number; isActive: boolean }
                    const buildSegments = (dates: string[]) => {
                      const unique = [...new Set(dates)].sort()
                      if (unique.length === 0) return []
                      const segs: { start: string; end: string; length: number }[] = []
                      let rs = unique[0]
                      for (let i = 1; i < unique.length; i++) {
                        const diff = Math.round((new Date(unique[i]).getTime() - new Date(unique[i-1]).getTime()) / 86400000)
                        if (diff > 1) { segs.push({ start: rs, end: unique[i-1], length: i - unique.indexOf(rs) }); rs = unique[i] }
                      }
                      segs.push({ start: rs, end: unique[unique.length-1], length: unique.length - unique.indexOf(rs) })
                      return segs
                    }
                    const allSegments: StreakSegment[] = HABIT_TYPES.flatMap(h => {
                      const dates = h.key === 'workout' ? workouts.map((w: Workout) => w.date) : h.key === 'nutrition' ? meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date) : h.key === 'sleep' ? sleep.map((s: SleepEntry) => s.date) : h.key === 'hydration' ? hydration.map((h2: HydrationEntry) => h2.date) : h.key === 'recovery' ? recoveryEntries.map((r: RecoveryEntry) => r.date) : supplementLogs.map((s: SupplementLog) => s.date)
                      const allDates = [...new Set(dates)].sort()
                      const lastDate = allDates.pop()
                      return buildSegments(dates).map(s => ({ ...s, label: h.label, color: h.color, icon: h.icon, isActive: s.end === lastDate && (new Date(s.end).getTime() >= Date.now() - 86400000 * 2 || dates.some(d => d === new Date().toISOString().split('T')[0])) }))
                    }).sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime()).slice(0, 40)
                    const timelineData = allSegments.slice(0, 14).map(s => ({ ...s, yLabel: `${s.label} · ${new Date(s.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${s.isActive ? ' ⚡' : ''}` }))
                    const months: Record<string, number> = {}
                    workouts.forEach((w: Workout) => { const m = w.date.slice(0, 7); months[m] = (months[m] || 0) + 1 })
                    const monthlyTrend = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([m, c]) => ({ label: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), workouts: c }))
                    return <>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Streak Timeline</span>
                          <span className="text-[8px] text-gray-600">· all time · latest first</span>
                        </div>
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timelineData} layout="vertical" barCategoryGap={5}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                              <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="yLabel" width={110} tick={{ fill: '#9ca3af', fontSize: 8 }} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }}
                                formatter={(v: number) => [`${v} days`, 'Streak']} />
                              <Bar dataKey="length" radius={[0, 6, 6, 0]} barSize={9} animationDuration={600}>
                                {timelineData.map((s, i) => (
                                  <Cell key={i} fill={s.color} style={{ filter: s.isActive ? `drop-shadow(0 0 6px ${s.color}66)` : 'none' }} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Monthly Workout Trend</span>
                          <span className="text-[8px] text-gray-600">· last 12 months</span>
                        </div>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyTrend}>
                            <defs>
                              <linearGradient id="monthlyTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                              itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }}
                              formatter={(v: number) => [`${v} workouts`, 'Total']} />
                            <Area type="monotone" dataKey="workouts" stroke="#f59e0b" strokeWidth={2} fill="url(#monthlyTrendGrad)" dot={{ fill: '#f59e0b', r: 2.5, strokeWidth: 0 }} activeDot={{ r: 4, fill: '#f59e0b', stroke: '#000', strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                        </div>
                      </div>
                    </>})()
                  }
                  {chartTab === 'goals' && (() => {
                    const level = LEVEL_THRESHOLDS.slice().reverse().find(t => stats.totalWorkouts >= t.min) || LEVEL_THRESHOLDS[0]
                    const nextLevel = LEVEL_THRESHOLDS.find(t => t.min > stats.totalWorkouts)
                    const levelProgress = nextLevel ? ((stats.totalWorkouts - level.min) / (nextLevel.min - level.min)) * 100 : 100
                    const estimateDate = (target: number) => {
                      if (stats.weeklyAverage <= 0) return '—'
                      const remaining = target - stats.totalWorkouts
                      if (remaining <= 0) return 'Achieved!'
                      const weeks = Math.ceil(remaining / stats.weeklyAverage)
                      const d = new Date(); d.setDate(d.getDate() + weeks * 7)
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    const milestoneTargets = [7, 14, 30, 50, 100]
                    const milestones = milestoneTargets.map(t => ({
                      target: t, current: stats.longestStreak, achieved: stats.longestStreak >= t,
                      color: t <= 7 ? '#f59e0b' : t <= 14 ? '#f97316' : t <= 30 ? '#f43f5e' : t <= 50 ? '#8b5cf6' : '#10b981',
                      icon: t <= 7 ? '🌟' : t <= 14 ? '🔥' : t <= 30 ? '⚡' : t <= 50 ? '💎' : '👑',
                      label: `${t}-Day Streak`
                    })).concat({ target: 100, current: stats.totalWorkouts, achieved: stats.totalWorkouts >= 100, color: '#06b6d4', icon: '🏆', label: '100 Workouts' })
                    const overallProgress = HABIT_TYPES.reduce((sum, h) => sum + habitStats[h.key].current, 0)
                    const overallTarget = HABIT_TYPES.length * 30
                    return (
                      <div className="space-y-2.5">
                        {/* Level Card — Gamified */}
                        <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-4">
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
                          <div className="relative flex items-center gap-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/30 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shadow-xl shadow-amber-500/15">
                                <span className="text-3xl drop-shadow-xl">{level.icon}</span>
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-gray-900 flex items-center justify-center shadow-lg">
                                <span className="text-[6px] font-black text-gray-900">{level.level}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-bold text-white">{level.title}</span>
                                {nextLevel && (
                                  <span className="flex items-center gap-1.5 text-[8px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                                    Next: {nextLevel.icon} {nextLevel.title}
                                  </span>
                                )}
                              </div>
                              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden shadow-inner relative mt-1.5">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                  className="h-full rounded-full relative" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444)', boxShadow: '0 0 12px rgba(251,191,36,0.3)' }}>
                                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                                </motion.div>
                              </div>
                              <div className="flex justify-between mt-1 text-[8px]">
                                <span className="text-gray-500"><span className="text-white font-bold tabular-nums">{stats.totalWorkouts}</span> workouts</span>
                                {nextLevel && <span className="text-gray-600">Goal: <span className="text-gray-400 font-semibold">{nextLevel.min}</span></span>}
                              </div>
                            </div>
                          </div>
                          {/* Level Dots */}
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/[0.04]">
                            {LEVEL_THRESHOLDS.filter(t => t.min > 0).map(t => {
                              const reached = stats.totalWorkouts >= t.min
                              return (
                                <div key={t.level} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${reached ? 'shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'bg-white/10'}`}
                                    style={{ background: reached ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : '' }} />
                                  <span className={`text-[6px] font-bold ${reached ? 'text-amber-400/80' : 'text-gray-600'}`}>{t.icon}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Overall Streak Pulse */}
                        <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-transparent p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Flame className="w-3.5 h-3.5 text-violet-400" />
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Total Streak Power</span>
                            </div>
                            <span className="text-sm font-black text-white tabular-nums">{overallProgress}<span className="text-[9px] text-gray-600 font-normal">/{overallTarget}</span></span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((overallProgress / overallTarget) * 100, 100)}%` }} transition={{ duration: 1 }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.3)' }} />
                          </div>
                        </div>

                        {/* Milestones */}
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Milestones</span>
                            <span className="text-[8px] text-gray-600">· streak & workout goals</span>
                          </div>
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={milestones} barCategoryGap={12}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0}
                                  tick={({ x, y, payload }: { x: number; y: number; payload: { value: string; index: number } }) => {
                                    const m = milestones[payload.index]
                                    return (
                                      <g transform={`translate(${x},${y})`}>
                                        <text x={0} y={10} textAnchor="middle" fill="#9ca3af" fontSize={7} fontWeight={700}>{m.label}</text>
                                        <text x={0} y={19} textAnchor="middle" fill={m.achieved ? '#34d399' : '#6b7280'} fontSize={6}>
                                          {m.achieved ? 'ACHIEVED' : `est. ${estimateDate(m.target)}`}
                                        </text>
                                      </g>
                                    )
                                  }} />
                                <YAxis domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                                <Tooltip
                                  contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                  itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }}
                                  formatter={(v: number) => [`${v}`, 'Progress']} />
                                <Bar dataKey="current" radius={[6, 6, 0, 0]} barSize={28} animationDuration={600}>
                                  {milestones.map((m, i) => (
                                    <Cell key={i} fill={m.achieved ? '#10b981' : m.color} style={{ filter: m.achieved ? 'drop-shadow(0 0 6px rgba(16,185,129,0.4))' : 'none' }} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Achievements */}
                        <div className="flex items-center gap-2 pt-1">
                          <Award className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Achievements</span>
                          <span className="text-[8px] text-white font-bold ml-auto bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06] tabular-nums">{unlocked.size}/{ACHIEVEMENTS.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ACHIEVEMENTS.map(a => {
                            const isUnlocked = unlocked.has(a.id)
                            return (
                              <motion.div key={a.id} whileHover={isUnlocked ? { scale: 1.05, y: -1 } : {}}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all duration-300 ${isUnlocked ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent shadow-sm shadow-emerald-500/5' : 'border-white/[0.04] bg-white/[0.02] opacity-35 hover:opacity-50'}`}>
                                {isUnlocked && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />}
                                <span className="text-xs drop-shadow-sm">{a.icon}</span>
                                <span className={`text-[7px] font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{a.name}</span>
                                {isUnlocked && <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />}
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )})()
                  }
                  {chartTab === 'goals' && (() => {
                    return (
                      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-3 h-3 text-emerald-400" />
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Habit Balance</span>
                          <span className="text-[8px] text-gray-600">· score distribution</span>
                        </div>
                        <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={scoreBreakdown} cx="50%" cy="50%" outerRadius="70%">
                            <PolarGrid stroke="rgba(255,255,255,0.05)" />
                            <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 8 }} tickCount={4} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                              itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }} />
                            <Radar name="Score" dataKey="value" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} />
                          </RadarChart>
                        </ResponsiveContainer>
                        </div>
                      </div>
                    )})()
                  }
                </div>
              </div>

              {/* Insights Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {streakPrediction && stats.currentStreak > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full -ml-16 -mt-16 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20"><Zap className="w-3.5 h-3.5 text-amber-400" /></div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Streak Prediction</span>
                      </div>
                      <p className="text-sm font-bold text-white">On track for <span className="text-amber-400 text-lg">{streakPrediction.predictedStreak}d</span></p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${streakPrediction.confidence}%` }} transition={{ duration: 1, delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400" style={{ boxShadow: '0 0 8px rgba(251,191,36,0.3)' }} />
                        </div>
                        <span className="text-[10px] text-amber-400/80 font-semibold">{streakPrediction.confidence}%</span>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-1.5">Avg streak: {streakPrediction.avgStreak}d · {streakPrediction.confidence >= 70 ? 'Strong momentum!' : streakPrediction.confidence >= 40 ? 'Building up' : 'Early stage'}</p>
                    </div>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Weekly Average</span>
                  </div>
                  <p className="text-2xl font-black text-white">{stats.weeklyAverage} <span className="text-xs text-gray-500 font-normal">workouts/wk</span></p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                    <span>Best month: <span className="text-white font-semibold">{stats.bestMonthName || 'N/A'}</span></span>
                  </div>
                </motion.div>
                {correlations.length > 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-violet-500/20"><Activity className="w-3.5 h-3.5 text-violet-400" /></div>
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Correlation</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{correlations[0]}</p>
                    </div>
                  </motion.div>
                ) : diversityData.uniqueExercises >= 5 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20"><Activity className="w-3.5 h-3.5 text-cyan-400" /></div>
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Diversity</span>
                    </div>
                    <p className="text-xs text-gray-300">{diversityData.uniqueExercises} exercises · {diversityData.categoryCount} categories</p>
                    {diversityData.topCategory && <p className="text-[10px] text-gray-500 mt-1">Top: <span className="text-white capitalize">{diversityData.topCategory}</span></p>}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL 3: Milestones & Achievements */}
      <AnimatePresence>
        {workouts.length > 0 && activePanel === 'milestones' && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-[12px] p-4 md:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Crown className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Milestones</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Levels, achievements & challenges</p>
                </div>
              </div>

              {/* Level Card */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent p-5 mb-6">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/8 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="relative flex items-center gap-5">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-600/10 shadow-xl shadow-amber-500/15 border border-amber-500/15">
                    <Crown className="w-7 h-7 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl drop-shadow-xl">{levelData.current.icon}</span>
                      <div>
                        <p className="text-xl font-bold text-white">{levelData.current.title}</p>
                        <p className="text-xs text-gray-500">{stats.totalWorkouts} total workouts</p>
                      </div>
                    </div>
                    {levelData.next && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                          <span>Next: <span className="text-white font-semibold">{levelData.next.icon} {levelData.next.title}</span></span>
                          <span className="font-bold text-white">{stats.totalWorkouts}<span className="text-gray-600 font-normal">/{levelData.next.min}</span></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden shadow-inner relative">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${levelData.progress}%` }} transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="h-full rounded-full relative" style={{ background: 'linear-gradient(90deg, #f59e0b, #f97316, #ef4444)', boxShadow: '0 0 12px rgba(251,191,36,0.3)' }}>
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] animate-shimmer" />
                          </motion.div>
                        </div>
                      </div>
                    )}
                    {/* Level milestones */}
                    {stats.totalWorkouts > 0 && (
                      <div className="flex items-center gap-1 mt-3">
                        {LEVEL_THRESHOLDS.filter(t => t.min > 0).map(t => {
                          const reached = stats.totalWorkouts >= t.min
                          return (
                            <div key={t.level} className="flex-1 flex flex-col items-center gap-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${reached ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]' : 'bg-white/10'}`} />
                              <span className={`text-[6px] font-bold ${reached ? 'text-amber-400/80' : 'text-gray-600'}`}>L{t.level}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Achievements Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Achievements</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex">
                      {ACHIEVEMENTS.map((a) => (
                        <div key={a.id} className={`w-1.5 h-1.5 rounded-full -ml-0.5 first:ml-0 ${unlocked.has(a.id) ? 'bg-emerald-400' : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-400 font-medium">{unlocked.size}/{ACHIEVEMENTS.length}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {ACHIEVEMENTS.map((ach) => {
                    const isUnlocked = unlocked.has(ach.id)
                    return (
                      <motion.div key={ach.id} whileHover={isUnlocked ? { scale: 1.08, y: -2 } : {}}
                        className={`relative overflow-hidden rounded-xl p-2.5 text-center border transition-all duration-500 ${
                          isUnlocked ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/15' : 'border-white/[0.04] bg-white/[0.02] opacity-35 hover:opacity-50'
                        }`}>
                        {isUnlocked && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />}
                        <div className="relative">
                          <span className="text-xl block mb-1 drop-shadow-lg">{ach.icon}</span>
                          <p className={`text-[7px] font-bold leading-tight ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Active Challenges */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Challenges</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeChallenges.map((ch) => {
                    const progress = Math.min(ch.current / ch.target, 1)
                    const isCompleted = ch.current >= ch.target
                    return (
                      <motion.div key={ch.id} whileHover={{ y: -2, scale: 1.01 }}
                        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${isCompleted ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent shadow-lg shadow-emerald-500/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'}`}>
                        {isCompleted && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-8 -mt-8 blur-2xl" />}
                        <div className="relative flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${isCompleted ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                            {ch.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>{ch.name}</p>
                              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress * 100, 100)}%` }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'}`}
                                  style={isCompleted ? {} : { boxShadow: '0 0 8px rgba(16,185,129,0.3)' }} />
                              </div>
                              <span className="text-[9px] text-gray-500 font-medium shrink-0 tabular-nums">{ch.current}/{ch.target}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Diversity Badges */}
              {diversityData.uniqueExercises > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Workout Diversity</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-xs">🏋️</span>
                      <span className="text-[10px] text-rose-200 font-semibold">{diversityData.uniqueExercises} exercises</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <span className="text-xs">📂</span>
                      <span className="text-[10px] text-violet-200 font-semibold">{diversityData.categoryCount} categories</span>
                    </div>
                    {diversityData.topCategory && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <span className="text-xs">🏆</span>
                        <span className="text-[10px] text-amber-200 font-semibold capitalize">{diversityData.topCategory}</span>
                      </div>
                    )}
                    {diversityData.uniqueExercises >= 25 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-xs">📚</span>
                        <span className="text-[10px] text-emerald-200 font-semibold">Collector</span>
                      </div>
                    )}
                    {diversityData.categoryCount >= 5 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <span className="text-xs">🎯</span>
                        <span className="text-[10px] text-cyan-200 font-semibold">All-Rounder</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Achievement Toast */}
      <AnimatePresence>
        {showNewBadge && (() => {
          const ach = ACHIEVEMENTS.find(a => a.id === showNewBadge)
          if (!ach) return null
          return (
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="fixed bottom-6 right-6 z-50">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-5 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)]" />
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 10, delay: 0.15 }}
                    className="p-3 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 shadow-xl shadow-emerald-500/20">
                    <span className="text-2xl">{ach.icon}</span>
                  </motion.div>
                  <div>
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                      className="text-xs text-emerald-300/80 uppercase tracking-wider font-medium">Achievement Unlocked!</motion.p>
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                      className="text-lg font-bold text-white">{ach.name}</motion.p>
                  </div>
                  <button onClick={() => setShowNewBadge(null)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors">x</button>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
