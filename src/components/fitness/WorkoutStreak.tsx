import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Zap, Target, Calendar, Award, Trophy, Star, TrendingUp, Medal
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { Workout } from '@/lib/storage'

interface Achievement {
  id: string
  name: string
  description: string
  icon: 'flame' | 'zap' | 'trophy' | 'star' | 'medal' | 'award' | 'trending'
  check: (stats: StreakStats) => boolean
}

interface StreakStats {
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

const ACHIEVEMENTS: Achievement[] = [
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

function getMotivationalMessage(weekCount: number): { message: string; emoji: string } {
  if (weekCount === 0) return { message: 'Time to get moving!', emoji: '💪' }
  if (weekCount === 1) return { message: 'Great start, keep it up!', emoji: '🔥' }
  if (weekCount <= 3) return { message: "You're on a roll!", emoji: '⚡' }
  if (weekCount <= 5) return { message: 'Crushing it this week!', emoji: '🚀' }
  return { message: 'Beast mode activated!', emoji: '👑' }
}

function formatMonthName(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function loadAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem('vitalfi_achievements')
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveAchievements(ids: Set<string>) {
  localStorage.setItem('vitalfi_achievements', JSON.stringify([...ids]))
}

function computeStats(workouts: Workout[]): StreakStats {
  if (workouts.length === 0) {
    return {
      currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisMonthWorkouts: 0,
      uniqueDays: 0, weeklyAverage: 0, consistency: 0, bestMonthName: '', daysSinceFirst: 0,
    }
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const uniqueDates = [...new Set(workouts.map(w => w.date))].sort()
  const totalWorkouts = workouts.length
  const uniqueDays = uniqueDates.length

  const thisMonthWorkouts = workouts.filter(w => {
    const d = new Date(w.date)
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }).length

  let longestStreak = 0
  let current = 0
  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) { current = 1; continue }
    const d1 = new Date(uniqueDates[i - 1])
    const d2 = new Date(uniqueDates[i])
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) { current++ }
    else { longestStreak = Math.max(longestStreak, current); current = 1 }
  }
  longestStreak = Math.max(longestStreak, current)

  let currentStreak = 0
  if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
    let temp = 0
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      if (i === uniqueDates.length - 1) { temp = 1; continue }
      const d1 = new Date(uniqueDates[i])
      const d2 = new Date(uniqueDates[i + 1])
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) { temp++ }
      else break
    }
    currentStreak = temp
  }

  const firstDate = new Date(uniqueDates[0])
  const daysSinceFirst = Math.max(1, Math.round((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
  const weeksSinceFirst = Math.max(1, daysSinceFirst / 7)
  const weeklyAverage = Math.round((totalWorkouts / weeksSinceFirst) * 10) / 10
  const consistency = Math.round((uniqueDays / daysSinceFirst) * 100)

  const monthMap = new Map<string, number>()
  workouts.forEach(w => {
    const key = w.date.slice(0, 7)
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  })
  let bestMonthKey = ''
  let bestMonthCount = 0
  monthMap.forEach((count, key) => {
    if (count > bestMonthCount) { bestMonthCount = count; bestMonthKey = key }
  })
  const bestMonthName = bestMonthKey ? formatMonthName(bestMonthKey + '-01') : ''

  return {
    currentStreak, longestStreak, totalWorkouts, thisMonthWorkouts,
    uniqueDays, weeklyAverage, consistency, bestMonthName, daysSinceFirst,
  }
}

function generateCalendarDays(workouts: Workout[]) {
  const today = new Date()
  const workoutDates = new Set(workouts.map(w => w.date))
  const days: { date: string; day: number; hasWorkout: boolean; isToday: boolean }[] = []

  for (let i = 27; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      day: d.getDate(),
      hasWorkout: workoutDates.has(dateStr),
      isToday: dateStr === today.toISOString().split('T')[0],
    })
  }
  return days
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

export function WorkoutStreak() {
  const { workouts } = useAppStore()
  const [unlocked, setUnlocked] = useState<Set<string>>(loadAchievements)
  const [showNewBadge, setShowNewBadge] = useState<string | null>(null)

  const stats = useMemo(() => computeStats(workouts), [workouts])
  const calendarDays = useMemo(() => generateCalendarDays(workouts), [workouts])

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

  const weekCount = workouts.filter(w => {
    const d = new Date(w.date)
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    return d >= startOfWeek
  }).length

  const { message: motivation } = getMotivationalMessage(weekCount)

  const prediction = (() => {
    if (stats.currentStreak === 0) return 'Complete a workout today to start your streak!'
    const nextMilestone = [7, 14, 21, 30, 60, 90, 100].find(m => m > stats.currentStreak)
    if (nextMilestone) return `Work out tomorrow to reach a ${nextMilestone}-day streak!`
    return ''
  })()

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          { icon: Flame, label: 'Current Streak', value: stats.currentStreak, suffix: 'days', gradient: 'from-orange-500/10', border: 'border-orange-500/20', iconColor: 'text-orange-400' },
          { icon: Zap, label: 'Best Streak', value: stats.longestStreak, suffix: 'days', gradient: 'from-amber-400/10', border: 'border-amber-400/20', iconColor: 'text-amber-400' },
          { icon: Target, label: 'Total Workouts', value: stats.totalWorkouts, suffix: '', gradient: 'from-purple-500/10', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
          { icon: Calendar, label: 'This Month', value: stats.thisMonthWorkouts, suffix: '', gradient: 'from-blue-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
        ] as const).map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} to-transparent p-6 text-center backdrop-blur-sm`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-full -mr-12 -mt-12" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/[0.02] to-transparent rounded-full -ml-8 -mb-8" />
            <div className="relative">
              <card.icon className={`w-5 h-5 md:w-6 md:h-6 ${card.iconColor} mx-auto mb-2 drop-shadow-[0_0_8px_currentColor]`} />
              <motion.div
                key={card.value}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-black text-white"
              >
                {card.value}
                {card.suffix && <span className="text-sm md:text-base font-normal text-gray-400 ml-1">{card.suffix}</span>}
              </motion.div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {stats.currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(251,146,60,0.08),transparent_70%)]" />
          <div className="relative flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
            <p className="text-sm text-orange-200/90 font-medium">{prediction}</p>
          </div>
        </motion.div>
      )}

      <Container>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white text-sm">This Week</h4>
          <span className="text-xs text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full">{weekCount} workout{weekCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${weekCount >= 3 ? 'text-emerald-400' : weekCount > 0 ? 'text-orange-400' : 'text-gray-600'}`} />
          <p className="text-sm text-gray-400">
            This week you've done <span className="text-white font-semibold">{weekCount}</span> workout{weekCount !== 1 ? 's' : ''}. <span className="text-gray-300">{motivation}</span>
          </p>
        </div>
      </Container>

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

      <Container>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white text-sm">Achievements</h4>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">{unlocked.size}/{ACHIEVEMENTS.length}</span>
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
                className={`relative rounded-xl p-3 md:p-4 text-center border transition-all duration-300 ${
                  isUnlocked
                    ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-amber-500/5'
                    : 'border-white/[0.04] bg-white/[0.02]'
                }`}
              >
                {isUnlocked && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.06),transparent_70%)] pointer-events-none rounded-xl" />
                )}
                <div className={`relative ${isUnlocked ? '' : 'opacity-30 grayscale'}`}>
                  <div className={`inline-flex p-2 rounded-full mb-2 ${
                    isUnlocked ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/10' : 'bg-white/[0.03]'
                  }`}>
                    <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${isUnlocked ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.3)]' : 'text-gray-600'}`} />
                  </div>
                  <p className={`text-xs font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{ach.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Container>

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
                    ×
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
