import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Zap, Target, TrendingUp,
  BarChart3, Crown, Activity, CalendarCheck, CheckCircle2,
  Dumbbell, Utensils, Moon, Droplets, Heart, Pill,
  Layers, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Workout, Meal, SleepEntry, HydrationEntry } from '@/types/domain'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

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

const ACHIEVEMENTS: { id: string; name: string; icon: string; desc: string; category: string; check: (s: OverallStats) => boolean; progress: (s: OverallStats) => { current: number; target: number }; color: string }[] = [
  { id: 'first_step', name: 'First Step', icon: '🌟', desc: 'Log your very first workout', category: 'Milestones', check: s => s.totalWorkouts >= 1, progress: s => ({ current: Math.min(s.totalWorkouts, 1), target: 1 }), color: '#10b981' },
  { id: 'week_warrior', name: 'Week Warrior', icon: '⚔️', desc: 'Complete 7 workouts total', category: 'Milestones', check: s => s.totalWorkouts >= 7, progress: s => ({ current: Math.min(s.totalWorkouts, 7), target: 7 }), color: '#06b6d4' },
  { id: 'dedicated', name: 'Dedicated', icon: '🎯', desc: 'Complete 30 workouts total', category: 'Milestones', check: s => s.totalWorkouts >= 30, progress: s => ({ current: Math.min(s.totalWorkouts, 30), target: 30 }), color: '#8b5cf6' },
  { id: 'century_club', name: 'Century Club', icon: '🏆', desc: 'Complete 100 workouts total', category: 'Milestones', check: s => s.totalWorkouts >= 100, progress: s => ({ current: Math.min(s.totalWorkouts, 100), target: 100 }), color: '#f59e0b' },
  { id: 'double_century', name: 'Double Century', icon: '💯', desc: 'Complete 200 workouts total', category: 'Milestones', check: s => s.totalWorkouts >= 200, progress: s => ({ current: Math.min(s.totalWorkouts, 200), target: 200 }), color: '#ec4899' },
  { id: 'iron_will', name: 'Iron Will', icon: '🔥', desc: 'Reach a 7-day streak', category: 'Streaks', check: s => s.longestStreak >= 7, progress: s => ({ current: Math.min(s.longestStreak, 7), target: 7 }), color: '#f97316' },
  { id: 'unstoppable', name: 'Unstoppable', icon: '⚡', desc: 'Reach a 14-day streak', category: 'Streaks', check: s => s.longestStreak >= 14, progress: s => ({ current: Math.min(s.longestStreak, 14), target: 14 }), color: '#ef4444' },
  { id: 'legendary', name: 'Legendary', icon: '👑', desc: 'Reach a 30-day streak', category: 'Streaks', check: s => s.longestStreak >= 30, progress: s => ({ current: Math.min(s.longestStreak, 30), target: 30 }), color: '#a855f7' },
  { id: 'monthly_master', name: 'Monthly Master', icon: '📆', desc: 'Train 20 times in a month', category: 'Monthly', check: s => s.thisMonthWorkouts >= 20, progress: s => ({ current: Math.min(s.thisMonthWorkouts, 20), target: 20 }), color: '#2563eb' },
  { id: 'locked_in', name: 'Locked In', icon: '🔒', desc: 'Keep a 75% training consistency', category: 'Consistency', check: s => s.consistency >= 75, progress: s => ({ current: Math.min(s.consistency, 75), target: 75 }), color: '#16a34a' },
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

      {/* PANEL 1: Streak Dashboard — Unified with Score */}
      <AnimatePresence>
        {workouts.length > 0 && activePanel === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-xl p-4 md:p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              {/* Header */}
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

              {/* Hero Score Ring */}
              <div className="flex justify-center mb-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="relative w-[180px] h-[180px]">
                  <svg width="180" height="180" className="-rotate-90">
                    <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="90" cy="90" r="68" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                    <motion.circle cx="90" cy="90" r="80" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={502.65} initial={{ strokeDashoffset: 502.65 }}
                      animate={{ strokeDashoffset: 502.65 * (1 - habitScore / 100) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.5))' }} />
                  </svg>
                  <svg width="0" height="0"><defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs></svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white drop-shadow-lg tabular-nums">{habitScore}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">/ 100</span>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">90-Day Health Score</span>
                  </div>
                </motion.div>
              </div>

              {/* 6 Habit Cards — Streak + Score Integrated */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {HABIT_TYPES.map((habit, idx) => {
                  const hs = habitStats[habit.key]; const done = habitsDoneToday[habit.key]; const wk = weeklyCompletion[habit.key]
                  const ringMax = Math.max(hs.longest, 1)
                  const scoreItem = scoreBreakdown.find(s => s.key === habit.key)
                  const scoreVal = scoreItem?.value ?? 0
                  const scoreMax = scoreItem?.max ?? 1
                  return (
                    <motion.div key={habit.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.07 }}
                      whileHover={{ y: -4, scale: 1.02 }} className="relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group cursor-default"
                      style={{ borderColor: `${habit.color}25`, background: `linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`, boxShadow: `0 4px 20px ${habit.glow}15` }}>
                      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${habit.color}30, transparent 70%)` }} />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${habit.color}08, transparent 50%)` }} />
                      <div className="relative">
                        {/* Icon + Name + Done */}
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
                        {/* Streak Ring + Numbers */}
                        <div className="flex items-center gap-3">
                          <StreakRing value={hs.current} max={ringMax} size={48} strokeWidth={3} color={habit.color} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-white drop-shadow-lg tabular-nums">{hs.current}</span>
                              <span className="text-[10px] text-gray-500">days</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500">Best: <span className="text-white font-semibold">{hs.longest}</span></span>
                              <span className="w-1 h-1 rounded-full bg-gray-600" />
                              <span className="text-[10px] text-gray-500">Wk: <span className="text-white font-semibold">{wk}/7</span></span>
                            </div>
                          </div>
                        </div>
                        {/* Score Contribution Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider">Score</span>
                            <span className="text-[10px] font-bold text-white">{scoreVal}<span className="text-gray-600 font-normal">/{scoreMax}</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(scoreVal / scoreMax) * 100}%` }} transition={{ duration: 1, delay: 0.4 + idx * 0.07, ease: 'easeOut' }}
                              className="h-full rounded-full relative" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}66)`, boxShadow: `0 0 8px ${habit.color}44` }}>
                              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
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
                    const streakLevel = (days: number) =>
                      days >= 30 ? { label: 'Platinum', color: '#a855f7', icon: '💎' } :
                      days >= 14 ? { label: 'Gold', color: '#f59e0b', icon: '🥇' } :
                      days >= 7 ? { label: 'Silver', color: '#9ca3af', icon: '🥈' } :
                      days >= 3 ? { label: 'Bronze', color: '#d97706', icon: '🥉' } :
                      { label: 'Starter', color: '#6b7280', icon: '🌱' }
                    const streakStatus = (current: number) =>
                      current >= 14 ? { label: 'On Fire', icon: '🔥', color: '#f43f5e' } :
                      current >= 7 ? { label: 'Blazing', icon: '⚡', color: '#f59e0b' } :
                      current >= 3 ? { label: 'Building', icon: '🚀', color: '#06b6d4' } :
                      current >= 1 ? { label: 'Started', icon: '🌱', color: '#10b981' } :
                      { label: 'Inactive', icon: '💤', color: '#6b7280' }
                    const weekEnd = scopeWeek[6].fullDate
                    const weekSet = new Set(scopeWeek.map(d => d.fullDate))
                    const getDates = (h: typeof HABIT_TYPES[number]): string[] =>
                      h.key === 'workout' ? workouts.map((w: Workout) => w.date) :
                      h.key === 'nutrition' ? meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date) :
                      h.key === 'sleep' ? sleep.map((s: SleepEntry) => s.date) :
                      h.key === 'hydration' ? hydration.map((x: HydrationEntry) => x.date) :
                      h.key === 'recovery' ? recoveryEntries.map((r: RecoveryEntry) => r.date) :
                      supplementLogs.map((s: SupplementLog) => s.date)
                    const countInWeek = (dates: string[]) => { let n = 0; dates.forEach(d => { if (weekSet.has(d)) n++ }); return n }
                    const streakAt = (dates: string[], endDate: string) => {
                      const set = new Set(dates); let n = 0; const d = new Date(endDate)
                      while (set.has(d.toISOString().split('T')[0])) { n++; d.setDate(d.getDate() - 1) }
                      return n
                    }
                    const weekTotal = HABIT_TYPES.reduce((s, h) => s + countInWeek(getDates(h)), 0)
                    const dayTotals = scopeWeek.map(day => HABIT_TYPES.filter(h => getDates(h).includes(day.fullDate)).length)
                    const maxDay = Math.max(...dayTotals, 1)
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                          <div className="p-1.5 rounded-lg bg-violet-500/15 border border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]"><Activity className="w-3 h-3 text-violet-400" /></div>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Habit Streaks</span>
                          <span className="text-[8px] text-gray-600">{isScopeCurrentWeek ? '· live · best · week' : '· streak at week end'}</span>
                          <div className="flex-1" />
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 tabular-nums">{scopeWeekLabel}</span>
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tabular-nums">{HABIT_TYPES.filter(h => countInWeek(getDates(h)) > 0).length}/6 in week</span>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {HABIT_TYPES.map((habit, idx) => {
                            const hs = habitStats[habit.key]
                            const dates = getDates(habit)
                            const wk = countInWeek(dates)
                            const ws = streakAt(dates, weekEnd)
                            const display = isScopeCurrentWeek ? hs.current : ws
                            const level = streakLevel(display)
                            const status = streakStatus(display)
                            const pct = Math.min(display / Math.max(hs.longest, 1), 1)
                            const weekDays: boolean[] = scopeWeek.map(day => dates.includes(day.fullDate))
                            return (
                              <motion.div key={habit.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                className="flex items-center gap-3 px-3 py-2.5 group hover:bg-white/[0.02] transition-colors duration-300">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                                  style={{ background: `${habit.color}16`, boxShadow: `inset 0 0 0 1px ${habit.color}30` }}>
                                  <habit.icon size={15} style={{ color: habit.color, filter: `drop-shadow(0 0 4px ${habit.glow})` }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-white">{habit.label}</span>
                                    <span className="text-[7px] font-bold px-1.5 py-px rounded-full uppercase tracking-wider" style={{ background: `${level.color}18`, color: level.color, boxShadow: `inset 0 0 0 1px ${level.color}35` }}>{level.icon} {level.label}</span>
                                    {wk > 0 && <span className="text-[7px] font-bold px-1.5 py-px rounded-full uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">wk {wk}/7</span>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct * 100, display > 0 ? 8 : 0)}%` }} transition={{ duration: 0.8, delay: 0.15 + idx * 0.04 }}
                                        className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}55)`, boxShadow: display > 0 ? `0 0 6px ${habit.glow}` : 'none' }} />
                                    </div>
                                    <span className="text-[7px] text-gray-600 tabular-nums shrink-0">best {hs.longest}d</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-white tabular-nums drop-shadow-sm leading-none">{display}<span className="text-[8px] text-gray-600 font-normal">d</span></span>
                                    <span className="text-[9px] leading-none" style={{ filter: `drop-shadow(0 0 4px ${status.color})` }}>{status.icon}</span>
                                  </div>
                                  <div className="flex items-center gap-[3px]" title={`Week of ${scopeWeekLabel}: ${wk}/7 days`}>
                                    {weekDays.map((done, j) => (
                                      <div key={j} className={`w-[6px] h-[6px] rounded-[2px] transition-all duration-300 ${done ? '' : 'bg-white/[0.05] scale-90'}`}
                                        style={{ background: done ? habit.color : '', boxShadow: done ? `0 0 4px ${habit.glow}` : 'none' }} />
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                        <div className="px-3 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[8px] text-gray-600 uppercase tracking-wider font-semibold shrink-0">Week</span>
                            <div className="flex-1 h-[5px] rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((weekTotal / (HABIT_TYPES.length * 7)) * 100, 100)}%` }} transition={{ duration: 1, delay: 0.3 }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.35)' }} />
                            </div>
                            <span className="text-[8px] font-bold text-violet-300 tabular-nums shrink-0">{weekTotal}/42</span>
                          </div>
                          <div className="flex items-end gap-1.5 mt-2 h-4" title="Habit-days per day of the selected week">
                            {dayTotals.map((t, j) => (
                              <div key={j} className="flex-1 flex flex-col items-center gap-0.5">
                                <div className="w-full rounded-t-[3px] bg-gradient-to-t from-violet-500/40 to-violet-400/80 transition-all duration-500"
                                  style={{ height: `${Math.max((t / maxDay) * 14, 1)}px`, boxShadow: t > 0 ? '0 0 6px rgba(139,92,246,0.3)' : 'none' }} title={`${scopeWeek[j].weekday}: ${t}/6`} />
                                <span className={`text-[6px] font-bold ${t > 0 ? 'text-violet-300/80' : 'text-gray-700'}`}>{scopeWeek[j].weekday[0]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )})()
                  }
                  {chartTab === 'history' && (() => {
                    type StreakSegment = { label: string; color: string; icon: typeof Dumbbell; start: string; end: string; length: number; isActive: boolean }
                    const weekEnd = scopeWeek[6].fullDate
                    const weekStart = scopeWeek[0].fullDate
                    const weekSet = new Set(scopeWeek.map(d => d.fullDate))
                    const getDates = (h: typeof HABIT_TYPES[number]): string[] =>
                      h.key === 'workout' ? workouts.map((w: Workout) => w.date) :
                      h.key === 'nutrition' ? meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date) :
                      h.key === 'sleep' ? sleep.map((s: SleepEntry) => s.date) :
                      h.key === 'hydration' ? hydration.map((x: HydrationEntry) => x.date) :
                      h.key === 'recovery' ? recoveryEntries.map((r: RecoveryEntry) => r.date) :
                      supplementLogs.map((s: SupplementLog) => s.date)
                    const streakAt = (dates: string[], endDate: string) => {
                      const set = new Set(dates); let n = 0; const d = new Date(endDate)
                      while (set.has(d.toISOString().split('T')[0])) { n++; d.setDate(d.getDate() - 1) }
                      return n
                    }
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
                      const dates = getDates(h)
                      const allDates = [...new Set(dates)].sort()
                      const lastDate = allDates.pop()
                      return buildSegments(dates).map(s => ({ ...s, label: h.label, color: h.color, icon: h.icon, isActive: s.end === lastDate && (new Date(s.end).getTime() >= Date.now() - 86400000 * 2 || dates.some(d => d === new Date().toISOString().split('T')[0])) }))
                    }).sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
                    const weekSegments = allSegments.filter(s => s.start <= weekEnd && s.end >= weekStart)
                    const maxLen = Math.max(...weekSegments.map(s => s.length), 1)
                    const grouped = weekSegments.reduce((acc, s) => {
                      const key = s.end.slice(0, 7); if (!acc[key]) acc[key] = []; acc[key].push(s); return acc
                    }, {} as Record<string, StreakSegment[]>)
                    const sortedGroups = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
                    const snapshot = HABIT_TYPES.map(h => {
                      const dates = getDates(h)
                      const wk = dates.filter(d => weekSet.has(d)).length
                      const ws = streakAt(dates, weekEnd)
                      return { habit: h, wk, ws }
                    })
                    const snapTotal = snapshot.reduce((s, x) => s + x.wk, 0)
                    return (
                      <div className="space-y-2.5">
                        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
                          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]"><CalendarCheck className="w-3 h-3 text-amber-400" /></div>
                            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Week Snapshot</span>
                            <span className="text-[8px] text-gray-600">· {scopeWeekLabel}</span>
                            <div className="flex-1" />
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 tabular-nums">{snapTotal}/42 habit-days</span>
                          </div>
                          <div className="divide-y divide-white/[0.04] px-3 py-1">
                            {snapshot.map(({ habit, wk, ws }, idx) => {
                              const pct = Math.min(wk / 7, 1)
                              const heat = ws >= 3 ? { label: `${ws}d streak`, color: '#f59e0b', icon: '🔥' } : ws >= 1 ? { label: `${ws}d streak`, color: '#06b6d4', icon: '⚡' } : wk > 0 ? { label: 'scattered', color: '#6b7280', icon: '…' } : { label: 'off', color: '#4b5563', icon: '—' }
                              return (
                                <motion.div key={habit.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                                  className="flex items-center gap-2.5 py-1.5 group hover:bg-white/[0.02] transition-colors duration-300">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${habit.color}14`, boxShadow: `inset 0 0 0 1px ${habit.color}28` }}>
                                    <habit.icon size={12} style={{ color: habit.color }} />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-300 w-16 shrink-0">{habit.label}</span>
                                  <div className="flex-1 h-[4px] rounded-full bg-white/[0.05] overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct * 100, wk > 0 ? 6 : 0)}%` }} transition={{ duration: 0.6, delay: idx * 0.03 }}
                                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${habit.color}, ${habit.color}66)` }} />
                                  </div>
                                  <span className="text-[8px] font-bold text-gray-400 tabular-nums shrink-0 w-7 text-right">{wk}/7</span>
                                  <span className="text-[7px] font-bold px-1.5 py-px rounded-full shrink-0" style={{ background: `${heat.color}16`, color: heat.color, boxShadow: `inset 0 0 0 1px ${heat.color}30` }}>{heat.icon} {heat.label}</span>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
                          {weekSegments.length > 0 ? (
                            <>
                              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]"><Layers className="w-3 h-3 text-gray-400" /></div>
                                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Segments in this week</span>
                                <div className="flex-1" />
                                <span className="text-[8px] text-gray-600 tabular-nums">longest {maxLen}d</span>
                              </div>
                              <div className="max-h-56 overflow-y-auto">
                                {sortedGroups.map(([month, streaks]) => {
                                  const d = new Date(month + '-01')
                                  return (
                                    <div key={month}>
                                      <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5" style={{ background: 'linear-gradient(180deg, #0f0f13, #0f0f13d9)' }}>
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.08]" />
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.08]" />
                                      </div>
                                      <div className="divide-y divide-white/[0.04]">
                                        {streaks.map((s, i) => {
                                          const pct = s.length / maxLen
                                          return (
                                            <motion.div key={`${s.label}-${s.start}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                              className="flex items-center gap-3 px-3 py-2 group hover:bg-white/[0.02] transition-colors duration-300">
                                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}14`, boxShadow: `inset 0 0 0 1px ${s.color}28` }}>
                                                <s.icon size={13} style={{ color: s.color }} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-[10px] font-bold text-gray-300">{s.label}</span>
                                                  <span className="text-[8px] text-gray-600 tabular-nums">{new Date(s.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(s.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="h-[5px] rounded-full bg-white/[0.05] overflow-hidden relative">
                                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(pct * 100, 1)}%` }} transition={{ duration: 0.6, delay: i * 0.03 }}
                                                    className="h-full rounded-full relative overflow-hidden"
                                                    style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}66)`, boxShadow: s.isActive ? `0 0 8px ${s.color}55` : 'none' }}>
                                                    {s.isActive && <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-shimmer" />}
                                                  </motion.div>
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-sm font-black text-white tabular-nums leading-none drop-shadow-sm">{s.length}<span className="text-[8px] text-gray-600 font-normal">d</span></span>
                                                {s.isActive ? (
                                                  <span className="flex items-center gap-1 px-1.5 py-px rounded-full bg-emerald-500/10 border border-emerald-500/25">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.7)]" />
                                                    <span className="text-[6px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                                                  </span>
                                                ) : <span className="text-[7px] text-gray-600 tabular-nums">streak</span>}
                                              </div>
                                            </motion.div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="py-8 flex flex-col items-center justify-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center"><Layers className="w-4 h-4 text-gray-600" /></div>
                              <p className="text-sm font-semibold text-gray-400">No streaks in {scopeWeekLabel.toLowerCase()}</p>
                              <p className="text-[10px] text-gray-600">Navigate weeks to explore your streak history</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )})()
                  }
                  {chartTab === 'goals' && (() => {
                    const weekSet = new Set(scopeWeek.map(d => d.fullDate))
                    const getDates = (h: typeof HABIT_TYPES[number]): string[] =>
                      h.key === 'workout' ? workouts.map((w: Workout) => w.date) :
                      h.key === 'nutrition' ? meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date) :
                      h.key === 'sleep' ? sleep.map((s: SleepEntry) => s.date) :
                      h.key === 'hydration' ? hydration.map((x: HydrationEntry) => x.date) :
                      h.key === 'recovery' ? recoveryEntries.map((r: RecoveryEntry) => r.date) :
                      supplementLogs.map((s: SupplementLog) => s.date)
                    const weeklyTargets: Record<string, number> = {
                      workout: Math.max(Math.round(stats.weeklyAverage), 3),
                      nutrition: 6, sleep: 7, hydration: 5, recovery: 3, supplements: 6,
                    }
                    const rows = HABIT_TYPES.map(h => {
                      const done = getDates(h).filter(d => weekSet.has(d)).length
                      const target = weeklyTargets[h.key]
                      const pct = Math.min(done / target, 1)
                      const status = done >= target ? { label: 'goal met', icon: '✅', color: '#10b981' }
                        : done >= target * 0.8 ? { label: 'almost there', icon: '🔥', color: '#f59e0b' }
                        : done >= target * 0.5 ? { label: 'halfway', icon: '⚡', color: '#06b6d4' }
                        : done > 0 ? { label: 'started', icon: '🌱', color: '#8b5cf6' }
                        : { label: 'no days', icon: '💤', color: '#6b7280' }
                      return { habit: h, done, target, pct, status }
                    })
                    const totalDone = rows.reduce((s, r) => s + r.done, 0)
                    const totalTarget = rows.reduce((s, r) => s + r.target, 0)
                    const metCount = rows.filter(r => r.done >= r.target).length
                    return (
                      <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-cyan-500/3 to-transparent overflow-hidden">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                          <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]"><Zap className="w-3 h-3 text-cyan-400" /></div>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Weekly Goals</span>
                          <span className="text-[8px] text-gray-600">· {scopeWeekLabel}</span>
                          <div className="flex-1" />
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tabular-nums">{metCount}/{HABIT_TYPES.length} met</span>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {rows.map((row, idx) => (
                            <motion.div key={row.habit.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                              className="flex items-center gap-3 px-3 py-2.5 group hover:bg-white/[0.02] transition-colors duration-300">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                                style={{ background: `${row.habit.color}16`, boxShadow: `inset 0 0 0 1px ${row.habit.color}30` }}>
                                <row.habit.icon size={15} style={{ color: row.habit.color, filter: `drop-shadow(0 0 4px ${row.habit.glow})` }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[11px] font-bold text-white">{row.habit.label}</span>
                                  <span className="text-[7px] font-bold px-1.5 py-px rounded-full uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">goal {row.target}</span>
                                </div>
                                <div className="h-[4px] rounded-full bg-white/[0.06] overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(row.pct * 100, row.done > 0 ? 6 : 0)}%` }} transition={{ duration: 0.8, delay: 0.15 + idx * 0.04 }}
                                    className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${row.habit.color}, ${row.habit.color}66)`, boxShadow: row.done > 0 ? `0 0 6px ${row.habit.glow}` : 'none' }} />
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-sm font-black text-white tabular-nums leading-none drop-shadow-sm">{row.done}<span className="text-[8px] text-gray-600 font-normal">/{row.target}</span></span>
                                <span className="text-[7px] font-bold px-1.5 py-px rounded-full" style={{ background: `${row.status.color}16`, color: row.status.color, boxShadow: `inset 0 0 0 1px ${row.status.color}30` }}>{row.status.icon} {row.status.label}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2.5 px-3 py-2 border-t border-white/[0.04] bg-white/[0.01]">
                          <span className="text-[8px] text-gray-600 uppercase tracking-wider font-semibold shrink-0">Total</span>
                          <div className="flex-1 h-[5px] rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalDone / totalTarget) * 100, 100)}%` }} transition={{ duration: 1, delay: 0.3 }}
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.35)' }} />
                          </div>
                          <span className="text-[8px] font-bold text-cyan-300 tabular-nums shrink-0">{totalDone}/{totalTarget}</span>
                        </div>
                      </div>
                    )})()
                  }
                  {chartTab === 'goals' && (() => {
                    const weekSet = new Set(scopeWeek.map(d => d.fullDate))
                    const weekData = scoreBreakdown.map(a => {
                      const dates = a.key === 'workout' ? workouts.map((w: Workout) => w.date) :
                        a.key === 'nutrition' ? meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date) :
                        a.key === 'sleep' ? sleep.map((s: SleepEntry) => s.date) :
                        a.key === 'hydration' ? hydration.map((x: HydrationEntry) => x.date) :
                        a.key === 'recovery' ? recoveryEntries.map((r: RecoveryEntry) => r.date) :
                        supplementLogs.map((s: SupplementLog) => s.date)
                      const done = dates.filter(d => weekSet.has(d)).length
                      return { ...a, value: Math.round((done / 7) * a.max) }
                    })
                    const weekBalanceTotal = weekData.reduce((s, a) => s + a.value, 0)
                    return (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.12)]"><Target className="w-3 h-3 text-emerald-400" /></div>
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Habit Balance</span>
                          <span className="text-[8px] text-gray-600">· {scopeWeekLabel}</span>
                          <div className="flex-1" />
                          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 tabular-nums">{weekBalanceTotal}/100</span>
                        </div>
                        <div className="h-52 relative">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_65%)] pointer-events-none" />
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={weekData} cx="50%" cy="50%" outerRadius="72%">
                              <PolarGrid stroke="rgba(255,255,255,0.07)" />
                              <PolarAngleAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                              <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 8 }} tickCount={4} />
                              <Tooltip
                                contentStyle={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, fontSize: 11, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                                itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af', fontWeight: 700, fontSize: 10, marginBottom: 4 }} />
                              <Radar name="Score" dataKey="value" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.18} />
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
              {/* Milestone Path — one smart tool */}
              {(() => {
                const nextUp = ACHIEVEMENTS
                  .filter(a => !unlocked.has(a.id))
                  .map(a => ({ a, p: a.progress(stats) }))
                  .filter(x => x.p.current > 0)
                  .sort((x, y) => (y.p.current / x.p.target) - (x.p.current / x.p.target))[0]
                const pace = stats.weeklyAverage || 0
                const todayKey = new Date().toISOString().slice(0, 10)
                const workedOutToday = workouts.some(w => (w.date || '').startsWith(todayKey))
                const left = nextUp ? nextUp.p.target - Math.min(nextUp.p.current, nextUp.p.target) : 0
                const pct = nextUp ? Math.min(Math.round((nextUp.p.current / nextUp.p.target) * 100), 100) : 0
                const unit = nextUp ? (nextUp.a.category === 'Streaks' ? 'days' : nextUp.a.category === 'Monthly' ? 'workouts this month' : nextUp.a.category === 'Consistency' ? '% consistency' : 'workouts') : 'workouts'
                const eta = nextUp && pace > 0 ? (() => { const w = Math.max(1, Math.ceil(left / pace)); const d = new Date(Date.now() + w * 7 * 86400000); return { weeks: w, date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } })() : null
                const coachMessage = nextUp
                  ? `Your next milestone is ${nextUp.a.name} — ${left} more ${unit} to go${eta ? ` (ETA ~${eta.date} at ${pace.toFixed(1)}/wk)` : ''}. ${workedOutToday ? (stats.currentStreak > 0 ? `Your ${stats.currentStreak}-day streak is alive — keep the momentum.` : 'You trained today — keep showing up and the streak will build itself.') : stats.currentStreak > 0 ? `Your ${stats.currentStreak}-day streak is at risk — train today to keep it alive.` : 'Log a workout today to start your first streak.'}`
                  : 'All achievements unlocked — you are a legend. Keep the journey going.'
                return (
                  <>
                    {/* Milestone Path header */}
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/25 to-amber-500/5 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/10">
                          <Crown className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-white tracking-wide">Milestone Path</span>
                          <p className="text-[10px] text-gray-500">One mission · one path · keep moving</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex">
                          {ACHIEVEMENTS.map((a) => (
                            <div key={a.id} className={`w-1.5 h-1.5 rounded-full -ml-0.5 first:ml-0 ${unlocked.has(a.id) ? 'bg-emerald-400' : 'bg-white/10'}`} />
                          ))}
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium tabular-nums">{unlocked.size}/{ACHIEVEMENTS.length}</span>
                      </div>
                    </div>

                    {/* Mission — you are here */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/5 p-5 mb-6">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_60%)]" />
                      <div className="relative">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl drop-shadow-lg">{levelData.current.icon}</span>
                            <div>
                              <p className="text-base font-bold text-white">{levelData.current.title}</p>
                              <p className="text-[10px] text-gray-500">{stats.totalWorkouts} workouts · rank {levelData.current.level}</p>
                            </div>
                          </div>
                          {levelData.next && (
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${levelData.progress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                                  className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#f59e0b,#f97316)', boxShadow: '0 0 8px rgba(251,191,36,0.4)' }} />
                              </div>
                              <span className="text-[9px] text-gray-500 tabular-nums font-semibold">{stats.totalWorkouts}/{levelData.next.min}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex items-center gap-5">
                          <div className="relative w-16 h-16 shrink-0">
                            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                              <defs>
                                <linearGradient id="mpGrad" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                              </defs>
                              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                              <motion.circle cx="32" cy="32" r="27" fill="none" stroke="url(#mpGrad)" strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 27} initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - pct / 100) }} transition={{ duration: 1.4, ease: 'easeOut' }} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-base font-black text-white tabular-nums leading-none">{pct}<span className="text-[8px] text-gray-500 font-semibold">%</span></span>
                            </div>
                          </div>
                          {nextUp ? (
                            <div className="flex-1 min-w-0">
                              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-400/80">Mission</p>
                              <p className="text-sm font-bold text-white truncate">{nextUp.a.icon} {nextUp.a.name} <span className="text-[10px] text-gray-500 font-medium">· {nextUp.a.category}</span></p>
                              <p className="text-[10px] text-gray-400 mt-1">{left > 0 ? `${left} more ${unit} to go` : 'Almost there'}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[9px] text-gray-400 font-semibold tabular-nums">{Math.min(nextUp.p.current, nextUp.p.target)}/{nextUp.p.target}</span>
                                {eta && <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-[9px] text-amber-300 font-bold">ETA ~{eta.date}</span>}
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25 text-[9px] font-bold text-violet-300">
                                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />LIVE
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white">All achievements unlocked</p>
                              <p className="text-[10px] text-gray-400 mt-1">You are a legend — keep the journey going.</p>
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-300 leading-relaxed mt-4 border-t border-white/5 pt-3">🤖 {coachMessage.length > 150 ? `${coachMessage.slice(0, 147)}…` : coachMessage}</p>
                      </div>
                    </motion.div>

                    {/* The path */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">The path</span>
                        <span className="text-[9px] text-gray-500 font-medium tabular-nums">{unlocked.size}/{ACHIEVEMENTS.length} milestones</span>
                      </div>
                      <div className="flex items-center">
                        {ACHIEVEMENTS.map((ach, i) => {
                          const isUnlocked = unlocked.has(ach.id)
                          const isNext = nextUp !== undefined && nextUp.a.id === ach.id
                          const p = ach.progress(stats)
                          const pct = Math.min(Math.round((p.current / p.target) * 100), 100)
                          return (
                            <div key={ach.id} className="flex items-center flex-1 last:flex-none">
                              <motion.div whileHover={{ scale: 1.2, y: -2 }} transition={{ type: 'spring', stiffness: 300 }}
                                title={`${ach.name} — ${ach.desc}\n${isUnlocked ? 'Unlocked ✓' : `${Math.min(p.current, p.target)}/${p.target} · ${pct}%`}`}
                                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] border transition-all duration-500 ${isUnlocked ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.35)]' : isNext ? 'bg-amber-500/25 border-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-white/[0.03] border-white/10 hover:border-white/25'}`}>
                                <span className={`leading-none ${isUnlocked ? '' : 'opacity-80'}`}>{isUnlocked ? '✓' : ach.icon}</span>
                                {isNext && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]" />}
                              </motion.div>
                              {i < ACHIEVEMENTS.length - 1 && (
                                <div className={`flex-1 h-[2px] mx-1 rounded-full ${isUnlocked ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { icon: '🔥', label: 'Streak', value: `${stats.currentStreak}d` },
                        { icon: '📆', label: 'This month', value: `${stats.thisMonthWorkouts}` },
                        { icon: '⚡', label: 'Pace', value: `${pace.toFixed(1)}/wk` },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 transition-colors hover:bg-white/[0.06]">
                          <span className="text-[10px] leading-none">{s.icon}</span>
                          <span className="text-[10px] font-bold text-white tabular-nums leading-none">{s.value}</span>
                          <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
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
