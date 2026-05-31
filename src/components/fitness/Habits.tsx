import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Zap, Target, Award, Trophy, Star, TrendingUp, Medal,
  BarChart3, Crown, Activity, Shuffle, CalendarCheck, CheckCircle2,
  Dumbbell, Utensils, Moon, Droplets,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Workout, Meal, SleepEntry, HydrationEntry } from '@/types/domain'

const HABIT_TYPES = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: '#f43f5e', bgGradient: 'from-rose-500/20 border-rose-500/30' },
  { key: 'nutrition', label: 'Nutrition', icon: Utensils, color: '#f97316', bgGradient: 'from-orange-500/20 border-orange-500/30' },
  { key: 'sleep', label: 'Sleep', icon: Moon, color: '#8b5cf6', bgGradient: 'from-violet-500/20 border-violet-500/30' },
  { key: 'hydration', label: 'Hydration', icon: Droplets, color: '#06b6d4', bgGradient: 'from-sky-500/20 border-sky-500/30' },
] as const

const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, title: 'Beginner', icon: '🌱' },
  { level: 2, min: 10, title: 'Consistent', icon: '🔥' },
  { level: 3, min: 30, title: 'Dedicated', icon: '⚡' },
  { level: 4, min: 60, title: 'Warrior', icon: '💪' },
  { level: 5, min: 100, title: 'Elite', icon: '👑' },
  { level: 6, min: 200, title: 'Legend', icon: '⭐' },
  { level: 7, min: 365, title: 'Immortal', icon: '🏆' },
]

interface OverallStats {
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
  thisMonthWorkouts: number
  uniqueDays: number
  weeklyAverage: number
  consistency: number
  bestMonthName: string
  daysSinceFirst: number
}

const ACHIEVEMENTS: { id: string; name: string; description: string; icon: 'flame' | 'zap' | 'trophy' | 'star' | 'medal' | 'award' | 'trending'; check: (s: OverallStats) => boolean }[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete your first workout', icon: 'star', check: s => s.totalWorkouts >= 1 },
  { id: 'week_warrior', name: 'Week Warrior', description: 'Complete 7 workouts total', icon: 'award', check: s => s.totalWorkouts >= 7 },
  { id: 'dedicated', name: 'Dedicated', description: 'Complete 30 workouts total', icon: 'medal', check: s => s.totalWorkouts >= 30 },
  { id: 'century_club', name: 'Century Club', description: 'Complete 100 workouts', icon: 'trophy', check: s => s.totalWorkouts >= 100 },
  { id: 'iron_will', name: 'Iron Will', description: 'Reach a 7-day streak', icon: 'flame', check: s => s.longestStreak >= 7 },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Reach a 14-day streak', icon: 'zap', check: s => s.longestStreak >= 14 },
  { id: 'legendary', name: 'Legendary', description: 'Reach a 30-day streak', icon: 'trending', check: s => s.longestStreak >= 30 },
  { id: 'monthly_master', name: 'Monthly Master', description: 'Complete 20 workouts in a month', icon: 'trophy', check: s => s.thisMonthWorkouts >= 20 },
]

const ACHIEVEMENT_ICONS: Record<string, typeof Flame> = {
  flame: Flame, zap: Zap, trophy: Trophy, star: Star, medal: Medal, award: Award, trending: TrendingUp,
}

function computeHabitStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 }
  const unique = [...new Set(dates)].sort()
  let longest = 0
  let currentRun = 1
  for (let i = 1; i < unique.length; i++) {
    const d1 = new Date(unique[i - 1])
    const d2 = new Date(unique[i])
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
      const d1 = new Date(unique[i - 1])
      const d2 = new Date(unique[i])
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) temp++
      else break
    }
    current = temp
  }
  return { current, longest }
}

function computeStats(workouts: Workout[]): OverallStats {
  if (workouts.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisMonthWorkouts: 0, uniqueDays: 0, weeklyAverage: 0, consistency: 0, bestMonthName: '', daysSinceFirst: 0 }
  }
  const today = new Date()
  const uniqueDates = [...new Set(workouts.map(w => w.date))].sort()
  const totalWorkouts = workouts.length
  const uniqueDays = uniqueDates.length
  const thisMonthWorkouts = workouts.filter(w => { const d = new Date(w.date); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() }).length
  const { current: currentStreak, longest: longestStreak } = computeHabitStreak(workouts.map(w => w.date))
  const firstDate = new Date(uniqueDates[0])
  const daysSinceFirst = Math.max(1, Math.round((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
  const weeksSinceFirst = Math.max(1, daysSinceFirst / 7)
  const weeklyAverage = Math.round((totalWorkouts / weeksSinceFirst) * 10) / 10
  const consistency = Math.round((uniqueDays / daysSinceFirst) * 100)
  const monthMap = new Map<string, number>()
  workouts.forEach(w => { const key = w.date.slice(0, 7); monthMap.set(key, (monthMap.get(key) || 0) + 1) })
  let bestMonthKey = ''
  let bestMonthCount = 0
  monthMap.forEach((count, key) => { if (count > bestMonthCount) { bestMonthCount = count; bestMonthKey = key } })
  const bestMonthName = bestMonthKey ? new Date(bestMonthKey + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
  return { currentStreak, longestStreak, totalWorkouts, thisMonthWorkouts, uniqueDays, weeklyAverage, consistency, bestMonthName, daysSinceFirst }
}

function loadAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem('vitalfi_achievements')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveAchievements(ids: Set<string>) {
  localStorage.setItem('vitalfi_achievements', JSON.stringify([...ids]))
}

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      {children}
    </motion.div>
  )
}

export function Habits() {
  const { workouts, meals, sleep, hydration } = useAppStore()
  const [unlocked, setUnlocked] = useState<Set<string>>(loadAchievements)
  const [showNewBadge, setShowNewBadge] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const habitStats = useMemo(() => ({
    workout: computeHabitStreak(workouts.map((w: Workout) => w.date)),
    nutrition: computeHabitStreak(meals.filter((m: Meal) => m.calories > 0).map((m: Meal) => m.date)),
    sleep: computeHabitStreak(sleep.map((s: SleepEntry) => s.date)),
    hydration: computeHabitStreak(hydration.map((h: HydrationEntry) => h.date)),
  }), [workouts, meals, sleep, hydration])

  const habitsDoneToday = {
    workout: workouts.some((w: Workout) => w.date === today),
    nutrition: meals.some((m: Meal) => m.date === today),
    sleep: sleep.some((s: SleepEntry) => s.date === today),
    hydration: hydration.some((h: HydrationEntry) => h.date === today),
  }

  const stats = useMemo(() => computeStats(workouts), [workouts])

  useEffect(() => {
    const prev = loadAchievements()
    const newSet = new Set(prev)
    let newlyUnlocked: string | null = null
    ACHIEVEMENTS.forEach(a => {
      if (!newSet.has(a.id) && a.check(stats)) {
        newSet.add(a.id)
        newlyUnlocked = a.id
      }
    })
    if (newlyUnlocked) {
      setShowNewBadge(newlyUnlocked)
      setTimeout(() => setShowNewBadge(null), 4000)
    }
    if (newSet.size !== prev.size) {
      saveAchievements(newSet)
    }
    setUnlocked(newSet)
  }, [stats])

  const levelData = useMemo(() => {
    const current = LEVEL_THRESHOLDS.slice().reverse().find(t => stats.totalWorkouts >= t.min) || LEVEL_THRESHOLDS[0]
    const next = LEVEL_THRESHOLDS.find(t => t.min > stats.totalWorkouts)
    const progress = next ? ((stats.totalWorkouts - current.min) / (next.min - current.min)) * 100 : 100
    return { current, next, progress: Math.min(100, Math.max(0, progress)) }
  }, [stats.totalWorkouts])

  const monthlyData = useMemo(() => {
    const map = new Map<string, number>()
    workouts.forEach((w: Workout) => { const key = w.date.slice(0, 7); map.set(key, (map.get(key) || 0) + 1) })
    const now = new Date()
    const months: { month: string; count: number; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      months.push({ month: key, count: map.get(key) || 0, label: d.toLocaleDateString('en-US', { month: 'short' }) })
    }
    return months
  }, [workouts])

  const diversityData = useMemo(() => {
    const categories = new Set<string>()
    const exerciseIds = new Set<string>()
    const categoryCounts: Record<string, number> = {}
    workouts.forEach((w: Workout) => {
      const cat = w.category || 'other'
      categories.add(cat)
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      w.exercises?.forEach(e => exerciseIds.add(e.exerciseId))
    })
    const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
    return {
      categoryCount: categories.size,
      uniqueExercises: exerciseIds.size,
      topCategory: sortedCats[0]?.[0] || '',
      topCategoryCount: sortedCats[0]?.[1] || 0,
    }
  }, [workouts])

  const diversityBadges = useMemo(() => [
    { id: 'explorer', name: 'Explorer', icon: '🧭', unlocked: diversityData.uniqueExercises >= 10, description: `Try 10+ different exercises (${diversityData.uniqueExercises})` },
    { id: 'collector', name: 'Collector', icon: '📚', unlocked: diversityData.uniqueExercises >= 25, description: `Try 25+ different exercises (${diversityData.uniqueExercises})` },
    { id: 'all_rounder', name: 'All-Rounder', icon: '🎯', unlocked: diversityData.categoryCount >= 5, description: `Use 5+ workout categories (${diversityData.categoryCount})` },
    { id: 'versatile', name: 'Versatile', icon: '💎', unlocked: diversityData.categoryCount >= 8, description: `Use 8+ workout categories (${diversityData.categoryCount})` },
    { id: 'specialist', name: 'Specialist', icon: '🎪', unlocked: diversityData.topCategoryCount >= 20, description: `Do 20+ workouts in one category (${diversityData.topCategoryCount})` },
  ], [diversityData])

  const activeChallenges = useMemo(() => {
    const thisMonth = today.slice(0, 7)
    const thisMonthCount = workouts.filter((w: Workout) => w.date.startsWith(thisMonth)).length
    const cs = stats.currentStreak
    return [
      { id: 'month_10', name: '10 in a Month', description: 'Complete 10 workouts this month', target: 10, current: thisMonthCount, icon: '📅' },
      { id: 'month_15', name: '15 in a Month', description: 'Complete 15 workouts this month', target: 15, current: thisMonthCount, icon: '🔥' },
      { id: 'month_20', name: '20 in a Month', description: 'Complete 20 workouts this month', target: 20, current: thisMonthCount, icon: '⚡' },
      { id: 'streak_7', name: '7-Day Streak', description: 'Maintain a 7-day streak', target: 7, current: cs, icon: '🔗' },
      { id: 'streak_14', name: '14-Day Streak', description: 'Maintain a 14-day streak', target: 14, current: cs, icon: '⛓️' },
      { id: 'diverse_5', name: 'Mix It Up', description: 'Use 5 different categories this month', target: 5, current: diversityData.categoryCount, icon: '🎨' },
    ]
  }, [workouts, stats.currentStreak, diversityData.categoryCount, today])

  const calendarDays = useMemo(() => {
    const workoutDates = new Set(workouts.map((w: Workout) => w.date))
    const days: { date: string; day: number; hasWorkout: boolean; isToday: boolean }[] = []
    const now = new Date()
    for (let i = 27; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({ date: dateStr, day: d.getDate(), hasWorkout: workoutDates.has(dateStr), isToday: dateStr === today })
    }
    return days
  }, [workouts, today])

  const weeklyDistData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = [0, 0, 0, 0, 0, 0, 0]
    workouts.forEach((w: Workout) => { counts[new Date(w.date).getDay()]++ })
    return days.map((day, i) => ({ day, count: counts[i] }))
  }, [workouts])

  return (
    <div className="space-y-5">
      {/* Habit Streaks Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {HABIT_TYPES.map((habit) => {
          const hs = habitStats[habit.key]
          const done = habitsDoneToday[habit.key]
          return (
            <div key={habit.key}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${habit.bgGradient} to-transparent p-5 shadow-lg`}
              style={{ boxShadow: `0 0 20px ${habit.color}10` }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10" style={{ background: `${habit.color}15` }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <habit.icon size={16} style={{ color: habit.color }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: habit.color }}>{habit.label}</span>
                  {done && <CheckCircle2 size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-white">{hs.current}</span>
                  <span className="text-[10px] text-gray-500">day{hs.current !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Best: {hs.longest} days</p>
                {done && (
                  <div className="absolute bottom-3 right-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent p-6 shadow-lg shadow-orange-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="relative">
            <div className="text-orange-400/80 text-xs font-medium uppercase tracking-wider mb-2">Current Streak</div>
            <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">{stats.currentStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/20 via-amber-400/5 to-transparent p-6 shadow-lg shadow-amber-400/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="relative">
            <div className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mb-2">Best Streak</div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{stats.longestStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-purple-500/5 to-transparent p-6 shadow-lg shadow-purple-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="relative">
            <div className="text-purple-400/80 text-xs font-medium uppercase tracking-wider mb-2">Total Workouts</div>
            <p className="text-3xl font-bold text-purple-400 drop-shadow-lg">{stats.totalWorkouts}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent p-6 shadow-lg shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="relative">
            <div className="text-blue-400/80 text-xs font-medium uppercase tracking-wider mb-2">This Month</div>
            <p className="text-3xl font-bold text-blue-400 drop-shadow-lg">{stats.thisMonthWorkouts}</p>
          </div>
        </div>
      </div>

      {/* Level & Monthly Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Container>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 shadow-lg shadow-amber-500/5">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-white">Level</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl drop-shadow-lg">{levelData.current.icon}</span>
            <div>
              <p className="text-xl font-bold text-white">{levelData.current.title}</p>
              <p className="text-sm text-gray-500">{stats.totalWorkouts} total workouts</p>
            </div>
          </div>
          {levelData.next && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Next: <span className="text-white font-medium">{levelData.next.title}</span></span>
                <span className="font-medium">{stats.totalWorkouts}/{levelData.next.min}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${levelData.progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-sm"
                />
              </div>
            </div>
          )}
        </Container>
        <Container>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 shadow-lg shadow-violet-500/5">
              <BarChart3 className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white">12-Month Activity</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} interval={0} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
                  formatter={(value: number) => [`${value} workouts`, '']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={16}>
                  {monthlyData.map((_, idx) => (
                    <Cell key={idx} fill={monthlyData[idx].count > 0 ? '#8b5cf6' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Container>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Container>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-semibold text-white">Weekly Average</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.weeklyAverage}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">workouts per week</div>
        </Container>
        <Container>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white">Consistency</span>
          </div>
          <div className="text-3xl font-black text-white">{stats.consistency}%</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stats.uniqueDays} of {stats.daysSinceFirst} days</div>
          <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(stats.consistency, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
        </Container>
        <Container>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10">
              <Medal className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white">Best Month</span>
          </div>
          <div className="text-lg font-bold text-white leading-tight">{stats.bestMonthName || 'N/A'}</div>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            {stats.bestMonthName ? 'most workouts ever' : 'start logging to find out'}
          </div>
        </Container>
      </div>

      {/* Week Summary */}
      {stats.currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(251,146,60,0.08),transparent_70%)]" />
          <div className="relative flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
            <p className="text-sm text-orange-200/90 font-medium">
              {stats.currentStreak > 0
                ? `Keep it going! Work out tomorrow to extend your ${stats.currentStreak}-day streak.`
                : 'Complete a workout today to start your streak!'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Weekly Distribution */}
      {workouts.length >= 7 && (
        <Container>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white">Workout Distribution by Day</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDistData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
                  formatter={(value: number) => [`${value} workouts`, '']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {weeklyDistData.map((_, idx) => (
                    <Cell key={idx} fill={weeklyDistData[idx].count > 0 ? '#f97316' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Container>
      )}

      {/* Calendar */}
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white text-sm">Last 28 Days</h4>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Today</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] md:text-xs text-gray-600 font-medium pb-1">{d}</div>
          ))}
          {calendarDays.map((day, i) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015 }}
              className={`aspect-square rounded-xl flex items-center justify-center text-[11px] md:text-xs font-medium transition-all duration-200 relative ${
                day.isToday
                  ? 'ring-1 ring-orange-400/50 bg-gradient-to-br from-orange-500/25 to-orange-600/10 text-orange-200'
                  : day.hasWorkout
                    ? 'bg-gradient-to-br from-orange-500/40 to-rose-500/20 text-white shadow-[0_0_10px_rgba(251,146,60,0.15)]'
                    : 'bg-white/[0.03] text-gray-600 hover:bg-white/[0.06]'
              }`}
            >
              {day.hasWorkout && !day.isToday && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400/60" />
              )}
              {day.day}
            </motion.div>
          ))}
        </div>
      </Container>

      {/* Achievements */}
      <Container>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center"><Award className="w-3.5 h-3.5 text-orange-400" /></div>
            <h4 className="font-semibold text-white text-sm">Achievements</h4>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 font-medium uppercase tracking-wider">{unlocked.size}/{ACHIEVEMENTS.length}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((ach, i) => {
            const isUnlocked = unlocked.has(ach.id)
            const IconComponent = ACHIEVEMENT_ICONS[ach.icon] || Award
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative overflow-hidden rounded-xl p-3 md:p-4 text-center border transition-all duration-500 ${
                  isUnlocked
                    ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent shadow-lg shadow-orange-500/5 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/50'
                    : 'border-white/[0.04] bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {isUnlocked && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.08),transparent_70%)] pointer-events-none rounded-xl" />
                    <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 rounded-full -mr-6 -mt-6 blur-md" />
                  </>
                )}
                <div className={`relative ${isUnlocked ? '' : 'opacity-40 saturate-0'}`}>
                  <div className={`inline-flex p-2.5 rounded-xl mb-2.5 transition-all duration-500 ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-orange-500/25 to-amber-500/10 shadow-lg shadow-orange-500/10'
                      : 'bg-white/[0.03]'
                  }`}>
                    <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${
                      isUnlocked
                        ? 'text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]'
                        : 'text-gray-600'
                    }`} />
                  </div>
                  <p className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{ach.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>

      {/* Diversity Badges */}
      {diversityBadges.some(b => b.unlocked) && (
        <Container>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-600/10 flex items-center justify-center">
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h4 className="font-semibold text-white text-sm">Diversity Badges</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {diversityBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative overflow-hidden rounded-xl p-4 text-center border transition-all ${
                  badge.unlocked
                    ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-purple-900/10 to-transparent shadow-lg shadow-amber-500/5'
                    : 'border-white/[0.04] bg-white/[0.02] opacity-50'
                }`}
              >
                {badge.unlocked && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)] pointer-events-none" />}
                <div className="relative">
                  <span className="text-3xl block mb-2 drop-shadow-lg">{badge.icon}</span>
                  <p className={`text-xs font-bold ${badge.unlocked ? 'text-white' : 'text-gray-500'}`}>{badge.name}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      )}

      {/* Monthly Challenges */}
      <Container>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <h4 className="font-semibold text-white text-sm">Active Challenges</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeChallenges.map((ch) => {
            const progress = Math.min(ch.current / ch.target, 1)
            const isCompleted = ch.current >= ch.target
            return (
              <div
                key={ch.id}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-transparent'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>{ch.name}</p>
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{ch.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                          }`}
                          style={{ width: `${Math.min(progress * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium shrink-0">{ch.current}/{ch.target}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>

      {/* New Achievement Toast */}
      <AnimatePresence>
        {showNewBadge && (() => {
          const ach = ACHIEVEMENTS.find(a => a.id === showNewBadge)
          if (!ach) return null
          const IconComponent = ACHIEVEMENT_ICONS[ach.icon] || Award
          return (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div className="relative overflow-hidden rounded-2xl border border-orange-400/30 bg-gradient-to-br from-gray-900 to-gray-950 p-5 shadow-2xl shadow-orange-500/20 backdrop-blur-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.1),transparent_70%)]" />
                <div className="relative flex items-center gap-4">
                  <div className="p-3 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20">
                    <IconComponent className="w-6 h-6 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-300/80 uppercase tracking-wider font-medium">Achievement Unlocked!</p>
                    <p className="text-lg font-bold text-white">{ach.name}</p>
                    <p className="text-xs text-gray-400">{ach.description}</p>
                  </div>
                  <button
                    onClick={() => setShowNewBadge(null)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    x
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
