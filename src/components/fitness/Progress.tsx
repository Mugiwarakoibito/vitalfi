import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Star, Award, X,
  Dumbbell, Flame, BarChart3, Activity,
  Sparkles, Target, CheckCircle2, Medal,
  Calendar,
  Brain, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import type { Workout, BodyMetric, WorkoutExercise, ExerciseSet } from '@/types/domain'

interface PR {
  id: string
  exerciseName: string
  weight: number
  reps: number
  date: string
  type: 'weight' | 'reps' | 'volume'
  goalWeight?: number
  goalReps?: number
  goalVolume?: number
  notes?: string
}

interface StrengthLevel {
  exercise: string
  level: string
  color: string
  ratio: number
  weight: number
  bodyWeight: number
}

const STORAGE_KEY = 'vitalfi_progress_records'
const ACHIEVEMENTS_KEY = 'vitalfi_progress_achievements'
const CONFETTI_COLORS = ['#F59E0B', '#A78BFA', '#10B981', '#EF4444', '#3B82F6']

const ACHIEVEMENT_DEFS: { id: string; name: string; icon: keyof typeof ACHIEVEMENT_ICON_MAP; description: string; check: (stats: { prCount: number; totalVolume: number; exercises: number; bestRatio: number; streak: number; hasAdvanced: boolean }) => boolean }[] = [
  { id: 'first_pr', name: 'First PR', icon: 'star', description: 'Log your first personal record', check: s => s.prCount >= 1 },
  { id: 'five_prs', name: 'On Fire', icon: 'flame', description: 'Log 5 personal records', check: s => s.prCount >= 5 },
  { id: 'ten_prs', name: 'Rising Star', icon: 'award', description: 'Log 10 personal records', check: s => s.prCount >= 10 },
  { id: 'twenty_five_prs', name: 'Dedicated', icon: 'medal', description: 'Log 25 personal records', check: s => s.prCount >= 25 },
  { id: 'fifty_prs', name: 'PR Machine', icon: 'trophy', description: 'Log 50 personal records', check: s => s.prCount >= 50 },
  { id: 'hundred_prs', name: 'Legendary', icon: 'trophy', description: 'Log 100 personal records', check: s => s.prCount >= 100 },
  { id: 'volume_100k', name: 'Volume Novice', icon: 'flame', description: 'Reach 100,000 total volume', check: s => s.totalVolume >= 100000 },
  { id: 'volume_master', name: 'Volume Master', icon: 'flame', description: 'Reach 1,000,000 total volume', check: s => s.totalVolume >= 1000000 },
  { id: 'five_exercises', name: 'Explorer', icon: 'star', description: 'Log PRs in 5 different exercises', check: s => s.exercises >= 5 },
  { id: 'ten_exercises', name: 'Versatile', icon: 'award', description: 'Log PRs in 10 different exercises', check: s => s.exercises >= 10 },
  { id: 'strength_milestone', name: 'Strength Milestone', icon: 'medal', description: 'Reach Advanced tier on any exercise', check: s => s.hasAdvanced },
  { id: 'elite_milestone', name: 'Elite Status', icon: 'star', description: 'Reach Elite tier on any exercise', check: s => s.bestRatio >= 2.5 },
  { id: 'seven_day_streak', name: 'Consistent', icon: 'flame', description: 'PR on 7 different days', check: s => s.streak >= 7 },
  { id: 'fourteen_day_streak', name: 'Unstoppable', icon: 'trophy', description: 'PR on 14 different days', check: s => s.streak >= 14 },
]

const ACHIEVEMENT_ICON_MAP = {
  star: Star, award: Award, medal: Medal, trophy: Trophy, flame: Flame,
}

function classifyStrength(exerciseName: string, weight: number, bodyWeight: number): { level: string; color: string } | null {
  if (!bodyWeight) return null
  const ratio = weight / bodyWeight
  const name = exerciseName.toLowerCase()
  let thresholds: { level: string; minRatio: number; color: string }[]
  if (name.includes('bench')) {
    thresholds = [
      { level: 'Elite', minRatio: 2.5, color: '#f59e0b' },
      { level: 'Advanced', minRatio: 2.0, color: '#ef4444' },
      { level: 'Intermediate', minRatio: 1.5, color: '#8b5cf6' },
      { level: 'Novice', minRatio: 1.0, color: '#10b981' },
    ]
  } else if (name.includes('squat') || name.includes('deadlift')) {
    thresholds = [
      { level: 'Elite', minRatio: 3.0, color: '#f59e0b' },
      { level: 'Advanced', minRatio: 2.5, color: '#ef4444' },
      { level: 'Intermediate', minRatio: 2.0, color: '#8b5cf6' },
      { level: 'Novice', minRatio: 1.5, color: '#10b981' },
    ]
  } else { return null }
  for (const t of thresholds) { if (ratio >= t.minRatio) return { level: t.level, color: t.color } }
  return { level: 'Untrained', color: '#6b7280' }
}

function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number; size: number }[]>([])
  useEffect(() => {
    if (active) {
      const p = Array.from({ length: 30 }, (_, i) => ({
        id: i, x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5, size: Math.random() * 8 + 4,
      }))
      setParticles(p)
      const timer = setTimeout(() => setParticles([]), 2000)
      return () => clearTimeout(timer)
    }
    setParticles([])
  }, [active])
  if (particles.length === 0) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id} initial={{ opacity: 1, y: -20, x: `${p.x}vw`, rotate: 0 }}
          animate={{ opacity: 0, y: '100vh', rotate: 720 }}
          transition={{ duration: 1.5 + p.delay, ease: 'easeIn' }}
          className="absolute" style={{ left: `${p.x}%`, top: -10 }}>
          <div className="rounded-sm" style={{ width: p.size, height: p.size * 0.6, backgroundColor: p.color, borderRadius: '2px' }} />
        </motion.div>
      ))}
    </div>
  )
}

function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

export function Progress() {
  const { workouts, bodyMetrics } = useAppStore()
  const [records, setRecords] = useState<PR[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [showModal, setShowModal] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [justAdded, setJustAdded] = useState('')
  const [formData, setFormData] = useState({
    exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0],
    type: 'weight' as 'weight' | 'reps' | 'volume',
    goalWeight: '', goalReps: '', goalVolume: '', notes: '',
  })
  const [selectedExercise] = useState<string>('')
  const [bodyGoalWeight] = useState<string>(() => localStorage.getItem('vitalfi_body_goal_weight') ?? '')
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [showAchievements, setShowAchievements] = useState(false)
  const [showPerfCoach, setShowPerfCoach] = useState(false)
  const [showPerfFocusPref, setShowPerfFocusPref] = useState(false)
  const [showPerfScope, setShowPerfScope] = useState(false)
  const [perfFocus, setPerfFocus] = useState<'strength' | 'hypertrophy' | 'endurance' | 'power' | 'overall'>('overall')
  const [scopeOffset, setScopeOffset] = useState(0)
  const [chartTab, setChartTab] = useState<'prs' | 'volume' | 'weight'>('prs')
  const [targetDate, setTargetDate] = useState(new Date())
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  const navigateDate = useMemo(() => ({
    left: () => { const d = new Date(targetDate); d.setDate(d.getDate() - 1); setTargetDate(d) },
    right: () => { const d = new Date(targetDate); d.setDate(d.getDate() + 1); setTargetDate(d) },
    today: () => setTargetDate(new Date()),
  }), [targetDate])

  const isToday = useMemo(() =>
    targetDate.toDateString() === today.toDateString(),
    [targetDate, today]
  )

  const scopeWeek = useMemo(() => {
    const end = new Date(today)
    end.setDate(end.getDate() - scopeOffset * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    return { start, end }
  }, [scopeOffset, today])

  const isScopeCurrentWeek = useMemo(() => scopeOffset === 0, [scopeOffset])

  const exercises = useMemo(() => [...new Set(records.map(r => r.exerciseName))].sort(), [records])

  const latestWeight = useMemo(() => {
    const withWeight = bodyMetrics.filter((m: BodyMetric) => m.weight != null)
    if (withWeight.length === 0) return null
    return withWeight.sort((a: BodyMetric, b: BodyMetric) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight!
  }, [bodyMetrics])

  const bodyWeightData = useMemo(() => {
    return [...bodyMetrics]
      .filter((m: BodyMetric) => m.weight != null)
      .sort((a: BodyMetric, b: BodyMetric) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((m: BodyMetric) => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight!,
        bodyFat: m.bodyFat ?? null,
      }))
  }, [bodyMetrics])

  const weeklyVolumeComparison = useMemo(() => {
    const now = new Date()
    const weeks: { label: string; current: number; prior: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() - i * 7)
      const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6)
      const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const priorWeekEnd = new Date(weekStart); priorWeekEnd.setDate(priorWeekEnd.getDate() - 1)
      const priorWeekStart = new Date(priorWeekEnd); priorWeekStart.setDate(priorWeekStart.getDate() - 6)
      const currentVol = workouts
        .filter((w: Workout) => w.date >= weekStart.toISOString().split('T')[0] && w.date <= weekEnd.toISOString().split('T')[0])
        .reduce((s: number, w: Workout) => s + (w.exercises?.reduce((se: number, ex: WorkoutExercise) => se + ex.sets.reduce((st: number, set: ExerciseSet) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0), 0)
      const priorVol = workouts
        .filter((w: Workout) => w.date >= priorWeekStart.toISOString().split('T')[0] && w.date <= priorWeekEnd.toISOString().split('T')[0])
        .reduce((s: number, w: Workout) => s + (w.exercises?.reduce((se: number, ex: WorkoutExercise) => se + ex.sets.reduce((st: number, set: ExerciseSet) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0), 0)
      weeks.unshift({ label: weekLabel, current: currentVol, prior: priorVol })
    }
    return weeks.slice(-8)
  }, [workouts])

  const totalVolume = useMemo(() =>
    workouts.reduce((s: number, w: Workout) => s + (w.exercises?.reduce((se: number, ex: WorkoutExercise) => se + ex.sets.reduce((st: number, set: ExerciseSet) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0), 0),
    [workouts]
  )

  const best1RM = useMemo(() => {
    if (records.length === 0) return 0
    return Math.max(...records.map(r => estimate1RM(r.weight, r.reps)))
  }, [records])

  const filteredRecords = useMemo(() => {
    return records
  }, [records])

  const chartData = useMemo(() => {
    const targetRecords = selectedExercise
      ? filteredRecords.filter(r => r.exerciseName === selectedExercise)
      : filteredRecords
    return targetRecords
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        weight: r.weight, reps: r.reps, volume: r.weight * r.reps, estimated1RM: estimate1RM(r.weight, r.reps),
      }))
  }, [filteredRecords, selectedExercise])

  const perExerciseBests = useMemo(() => {
    const map: Record<string, { bestWeight: number; bestReps: number; bestVolume: number }> = {}
    records.forEach(r => {
      if (!map[r.exerciseName]) {
        map[r.exerciseName] = { bestWeight: 0, bestReps: 0, bestVolume: 0 }
      }
      const e = map[r.exerciseName]
      if (r.weight > e.bestWeight) e.bestWeight = r.weight
      if (r.reps > e.bestReps) e.bestReps = r.reps
      if (r.weight * r.reps > e.bestVolume) e.bestVolume = r.weight * r.reps
    })
    return map
  }, [records])

  const strengthLevels = useMemo(() => {
    if (!latestWeight) return []
    const levels: StrengthLevel[] = []
    Object.entries(perExerciseBests).forEach(([name, data]) => {
      const classification = classifyStrength(name, data.bestWeight, latestWeight)
      if (classification) {
        levels.push({ exercise: name, level: classification.level, color: classification.color,
          ratio: Math.round((data.bestWeight / latestWeight) * 100) / 100,
          weight: data.bestWeight, bodyWeight: latestWeight })
      }
    })
    return levels
  }, [perExerciseBests, latestWeight])

  const hasAdvancedTier = useMemo(() =>
    strengthLevels.some(s => s.level === 'Advanced' || s.level === 'Elite'),
    [strengthLevels]
  )

  const prLeaderboard = useMemo(() => {
    const countMap: Record<string, { count: number; bestWeight: number; bestReps: number }> = {}
    records.forEach(r => {
      if (!countMap[r.exerciseName]) countMap[r.exerciseName] = { count: 0, bestWeight: 0, bestReps: 0 }
      countMap[r.exerciseName].count++
      if (r.weight > countMap[r.exerciseName].bestWeight) countMap[r.exerciseName].bestWeight = r.weight
      if (r.reps > countMap[r.exerciseName].bestReps) countMap[r.exerciseName].bestReps = r.reps
    })
    return Object.entries(countMap).sort((a, b) => b[1].count - a[1].count)
  }, [records])

  const prStreak = useMemo(() => {
    if (records.length === 0) return 0
    const sorted = [...new Set(records.map(r => r.date))].sort().reverse()
    let streak = 0
    const today = new Date()
    for (let i = 0; i < sorted.length; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (sorted.includes(ds)) streak++
      else if (i > 1) break
      else return 0
    }
    return streak
  }, [records])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_KEY)
      if (saved) setEarned(new Set(JSON.parse(saved)))
    } catch {}
  }, [])

  useEffect(() => {
    const newSet = new Set(earned)
    let changed = false
    const bestRatio = Math.max(0, ...strengthLevels.map(s => s.ratio))
    const uniqueDays = new Set(records.map(r => r.date)).size
    const stats = { prCount: records.length, totalVolume, exercises: exercises.length, bestRatio, streak: uniqueDays, hasAdvanced: hasAdvancedTier }
    ACHIEVEMENT_DEFS.forEach(a => {
      if (!newSet.has(a.id) && a.check(stats)) { newSet.add(a.id); changed = true }
    })
    if (changed) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...newSet]))
      setEarned(newSet)
    }
  }, [records.length, totalVolume, exercises.length, strengthLevels, hasAdvancedTier])

  const perfInsights = useMemo(() => {
    const tips: { icon: string; text: string; color: string }[] = []
    if (records.length === 0) {
      tips.push({ icon: '💡', text: 'Log your first PR to unlock personalized performance insights.', color: 'text-amber-400' })
      return tips
    }
    const totalPRs = records.length
    const focusTips: Record<string, string> = {
      strength: 'Prioritize low-rep (3-6), high-weight sets. Track your 1RM progression on compound lifts.',
      hypertrophy: 'Focus on moderate-rep (8-12) sets with controlled tempo. Volume is your primary driver.',
      endurance: 'Aim for high-rep (15-20+) sets with shorter rest periods. Track muscular endurance gains.',
      power: 'Incorporate explosive movements and speed work. Track velocity and rate of force development.',
      overall: 'Keep a balanced approach across rep ranges. Track PRs in all categories for comprehensive growth.',
    }
    tips.push({ icon: '🎯', text: focusTips[perfFocus], color: 'text-amber-400' })

    const bestPR = records.reduce((a, b) => estimate1RM(a.weight, a.reps) > estimate1RM(b.weight, b.reps) ? a : b)
    const best1RMVal = estimate1RM(bestPR.weight, bestPR.reps)
    tips.push({ icon: '🏋️', text: `Your strongest lift: ${bestPR.exerciseName} — ${best1RMVal}lbs estimated 1RM.`, color: 'text-purple-400' })

    if (prStreak > 0) tips.push({ icon: '🔥', text: `You're on a ${prStreak}-day PR streak! Keep showing up.`, color: 'text-orange-400' })

    if (latestWeight && strengthLevels.length > 0) {
      const highest = strengthLevels.reduce((a, b) => a.ratio > b.ratio ? a : b)
      if (highest.ratio > 2) tips.push({ icon: '💪', text: `${highest.exercise} ratio of ${highest.ratio}x BW is Elite level!`, color: 'text-amber-400' })
      else if (highest.ratio > 1.5) tips.push({ icon: '📈', text: `${highest.exercise} at ${highest.ratio}x BW — ${highest.level} tier. Next milestone: ${highest.level === 'Intermediate' ? 'Advanced (2.0x)' : 'Intermediate (1.5x)'}.`, color: 'text-violet-400' })
    }

    if (totalVolume > 1000000) tips.push({ icon: '🏆', text: 'Over 1M total volume — you\'re a Volume Master!', color: 'text-emerald-400' })
    else if (totalVolume > 500000) tips.push({ icon: '📊', text: `${(totalVolume / 1000000).toFixed(1)}M total volume — ${((1000000 - totalVolume) / 1000).toFixed(0)}k more to hit Volume Master!`, color: 'text-emerald-400' })

    if (totalPRs >= 50) tips.push({ icon: '🏅', text: `${totalPRs} PRs logged — you're in the top tier of consistency!`, color: 'text-amber-400' })
    else if (totalPRs >= 10) tips.push({ icon: '📊', text: `${totalPRs} PRs logged — review your progress weekly to spot trends.`, color: 'text-violet-400' })
    else tips.push({ icon: '🌱', text: `${totalPRs} PR${totalPRs !== 1 ? 's' : ''} logged — every record builds momentum. Aim for 10 to unlock trend insights.`, color: 'text-sky-400' })

    const prByExercise = new Set(records.map(r => r.exerciseName)).size
    if (prByExercise >= 5) tips.push({ icon: '🎯', text: `You've set PRs in ${prByExercise} different exercises — great variety!`, color: 'text-amber-400' })

    const prDates = new Set(records.map(r => r.date)).size
    if (prDates >= 14) tips.push({ icon: '📅', text: `${prDates} different training days with PRs — consistency is key!`, color: 'text-emerald-400' })

    if (latestWeight && records.some(r => r.exerciseName.toLowerCase().includes('bench') && (r.weight / latestWeight) < 1)) {
      tips.push({ icon: '🎯', text: 'Aim for 1x BW bench as your next milestone.', color: 'text-amber-400' })
    }
    return tips
  }, [records, perfFocus, prStreak, latestWeight, strengthLevels, totalVolume, exercises])

  const saveRecord = () => {
    const w = Number(formData.weight); const r = Number(formData.reps)
    if (!formData.exerciseName.trim() || w <= 0 || r <= 0) return
    const newRecord: PR = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      exerciseName: formData.exerciseName.trim(), weight: w, reps: r, date: formData.date, type: formData.type,
    }
    if (formData.goalWeight) newRecord.goalWeight = Number(formData.goalWeight)
    if (formData.goalReps) newRecord.goalReps = Number(formData.goalReps)
    if (formData.goalVolume) newRecord.goalVolume = Number(formData.goalVolume)
    if (formData.notes) newRecord.notes = formData.notes
    setRecords(prev => [...prev, newRecord])
    setShowModal(false)
    setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', goalWeight: '', goalReps: '', goalVolume: '', notes: '' })
    setConfettiTrigger(prev => prev + 1)
    setJustAdded(`${formData.exerciseName} — ${w}lbs × ${r} reps`)
    setTimeout(() => setJustAdded(''), 3000)
  }

  return (
    <div className="space-y-6">
      <Confetti active={confettiTrigger > 0} />

      {justAdded && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-amber-500/10 p-4 shadow-lg shadow-emerald-500/10">
          <div className="relative flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="text-sm font-bold text-white">New PR! {justAdded}</p>
            <button onClick={() => setJustAdded('')} className="ml-auto p-1 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </motion.div>
      )}

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={navigateDate.left} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30" disabled={isToday}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <input type="date" value={targetDate.toISOString().split('T')[0]}
              onChange={e => setTargetDate(new Date(e.target.value + 'T00:00:00'))}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={navigateDate.right} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={navigateDate.today} className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showPerfCoach ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowPerfCoach(p => !p)} title="PerfCoach">
              <Brain className="w-5 h-5" />
            </button>
          )}
          {records.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showPerfScope ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowPerfScope(p => !p)} title="PerfScope">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          {records.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showAchievements ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowAchievements(p => !p)} title="Achievements">
              <Trophy className="w-5 h-5" />
            </button>
          )}
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-1" />Add PR
            </Button>
          </div>
      </motion.div>

      {/* 6 Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10"><Trophy className="w-4 h-4 text-amber-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{records.length}</p>
              <p className="text-xs text-gray-500">Total PRs</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10"><Award className="w-4 h-4 text-purple-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{best1RM} <span className="text-sm font-normal text-gray-500">lbs</span></p>
              <p className="text-xs text-gray-500">Best 1RM</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10"><Flame className="w-4 h-4 text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
              <p className="text-xs text-gray-500">Total Volume</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10"><Activity className="w-4 h-4 text-sky-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{exercises.length}</p>
              <p className="text-xs text-gray-500">Exercises</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10"><Flame className="w-4 h-4 text-rose-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{prStreak} <span className="text-sm font-normal text-gray-500">d</span></p>
              <p className="text-xs text-gray-500">PR Streak</p>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-black/60 backdrop-blur-[12px] p-4 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.04] to-transparent pointer-events-none" />
          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10"><Medal className="w-4 h-4 text-violet-400" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{strengthLevels.length}</p>
              <p className="text-xs text-gray-500">Strength Levels</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PERFCOACH Panel */}
      <AnimatePresence>
        {showPerfCoach && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">PERFCOACH</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <button onClick={() => setShowPerfFocusPref(p => !p)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showPerfFocusPref
                        ? perfFocus === 'strength' ? 'bg-red-500/15 border-red-500/30 text-red-400'
                          : perfFocus === 'hypertrophy' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : perfFocus === 'endurance' ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : perfFocus === 'power' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                      title="Training focus">
                      <span className="text-[11px] leading-none">{perfFocus === 'strength' ? '🏋️' : perfFocus === 'hypertrophy' ? '💪' : perfFocus === 'endurance' ? '🏃' : perfFocus === 'power' ? '⚡' : '🎯'}</span>
                    </button>
                    {showPerfFocusPref && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowPerfFocusPref(false)} />
                        <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Training Focus</p>
                          <div className="flex flex-col gap-1">
                            {([
                              { key: 'overall' as const, label: '🎯 Overall' },
                              { key: 'strength' as const, label: '🏋️ Strength' },
                              { key: 'hypertrophy' as const, label: '💪 Hypertrophy' },
                              { key: 'endurance' as const, label: '🏃 Endurance' },
                              { key: 'power' as const, label: '⚡ Power' },
                            ]).map(opt => (
                              <button key={opt.key} onClick={() => { setPerfFocus(opt.key); setShowPerfFocusPref(false) }}
                                className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${perfFocus === opt.key
                                  ? opt.key === 'strength' ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                    : opt.key === 'hypertrophy' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : opt.key === 'endurance' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                    : opt.key === 'power' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
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
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">PRs</p>
                  <p className="text-lg font-bold text-amber-400">{records.length}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Best 1RM</p>
                  <p className="text-lg font-bold text-purple-400">{best1RM}<span className="text-xs text-gray-500 font-normal"> lbs</span></p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Volume</p>
                  <p className="text-lg font-bold text-emerald-400">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider">Streak</p>
                  <p className="text-lg font-bold text-rose-400">{prStreak}<span className="text-xs text-gray-500 font-normal"> d</span></p>
                </div>
              </div>

              {/* Coach cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Medal className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-gray-400">Strength Levels</span>
                  </div>
                  {strengthLevels.length > 0 ? (
                    <>
                      <p className="text-sm font-bold text-white">{strengthLevels.length}<span className="text-xs text-gray-500 font-normal"> exercises</span></p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Best: <span className="text-amber-300 font-semibold">{strengthLevels.reduce((a, b) => a.ratio > b.ratio ? a : b).level}</span>
                      </p>
                      <div className="space-y-1 mt-2">
                        {strengthLevels.slice(0, 2).map(sl => (
                          <div key={sl.exercise} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
                            <span className="text-[9px] text-gray-500 truncate">{sl.exercise}</span>
                            <span className="text-[9px] font-semibold ml-auto" style={{ color: sl.color }}>{sl.level}</span>
                          </div>
                        ))}
                        {strengthLevels.length > 2 && <p className="text-[9px] text-gray-500">+{strengthLevels.length - 2} more</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-500">No data yet</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Log BW + lifts to see strength levels</p>
                    </>
                  )}
                </div>
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Flame className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-gray-400">Volume Overview</span>
                  </div>
                  <p className="text-sm font-bold text-white">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}<span className="text-xs text-gray-500 font-normal"> total lbs</span></p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{records.length > 0 ? `${(totalVolume / records.length).toFixed(0)} avg per PR` : 'Log PRs to see averages'}</p>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all" style={{ width: `${Math.min((totalVolume / 500000) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              {perfInsights.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">AI INSIGHTS</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {perfInsights.slice(0, 3).map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-xs">
                        <span className="text-sm leading-none mt-0.5">{tip.icon}</span>
                        <p className="text-gray-300 flex-1 min-w-0">{tip.text}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PerfScope Panel */}
      <AnimatePresence>
        {showPerfScope && (
          <motion.div key="perfscope" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Performance Scope</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setScopeOffset(p => p + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                    {scopeWeek.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {scopeWeek.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => scopeOffset > 0 && setScopeOffset(p => Math.max(0, p - 1))} disabled={scopeOffset === 0}
                    className={`p-1.5 rounded-xl transition-all ${scopeOffset === 0
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
                  {[
                    { key: 'prs' as const, label: 'PRs', icon: '📊' },
                    { key: 'volume' as const, label: 'Volume', icon: '📈' },
                    { key: 'weight' as const, label: 'Weight', icon: '⚖️' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setChartTab(m.key)}
                      className={`relative px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        chartTab === m.key
                          ? m.key === 'prs' ? 'text-amber-300 bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/25 shadow-lg shadow-amber-500/8'
                          : m.key === 'volume' ? 'text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/8'
                          : 'text-violet-300 bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/25 shadow-lg shadow-violet-500/8'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span>{m.icon}</span>{m.label}
                      </span>
                      {chartTab === m.key && <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="h-64 rounded-2xl bg-gradient-to-br from-black/60 via-white/[0.02] to-transparent border border-white/[0.06] p-4 shadow-inner shadow-white/5 relative overflow-hidden" style={{ minHeight: '260px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 h-full">
                  {chartTab === 'prs' && (
                    chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <defs>
                            <linearGradient id="prWeightGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" stopOpacity={0.55} /><stop offset="50%" stopColor="#f43f5e" stopOpacity={0.2} /><stop offset="100%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                            <linearGradient id="pr1rmGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} /><stop offset="60%" stopColor="#a78bfa" stopOpacity={0.15} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient>
                            <filter id="glowPrWeight"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="glowPr1rm"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.025)" vertical={false} strokeWidth={1} />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={6} interval="preserveStartEnd" />
                          <YAxis yAxisId="left" stroke="#f43f5e" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={[0, 'dataMax + 5']} width={32} tickFormatter={v => `${v}`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={[0, 'dataMax + 10']} width={32} tickFormatter={v => `${v}`} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload as any
                            const idx = chartData.indexOf(d)
                            const prev = idx > 0 ? chartData[idx - 1] : null
                            const delta = prev ? d.weight - prev.weight : null
                            return (
                              <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-rose-500/5 min-w-[190px]">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                                <div className="relative space-y-2">
                                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-white font-bold text-xs">{d.date}</span>
                                    {delta != null && (
                                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                        {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta).toFixed(1)} <span className="text-gray-500 font-normal">lbs</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-lg shadow-rose-400/40" style={{ filter: 'url(#glowPrWeight)' }} />
                                    <span className="text-gray-400 font-medium">Weight</span>
                                    <span className="text-white font-bold ml-auto text-sm">{d.weight} <span className="text-[10px] font-normal text-gray-500">lbs</span></span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/40" style={{ filter: 'url(#glowPr1rm)' }} />
                                    <span className="text-gray-400 font-medium">Est. 1RM</span>
                                    <span className="text-purple-300 font-bold ml-auto text-sm">{d.estimated1RM} <span className="text-[10px] font-normal text-gray-500">lbs</span></span>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          }} cursor={{ fill: 'rgba(244,63,94,0.1)' }} />
                          <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={2.5} fill="url(#prWeightGrad)" dot={false} activeDot={{ r: 6, fill: '#f43f5e', strokeWidth: 2.5, stroke: '#1a1a2e', filter: 'url(#glowPrWeight)' }} animationDuration={600} animationEasing="ease-out" name="Weight (lbs)" />
                          {chartData.some(d => d.estimated1RM != null) && (
                            <Line yAxisId="right" type="monotone" dataKey="estimated1RM" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#a78bfa', strokeWidth: 2.5, stroke: '#1a1a2e', filter: 'url(#glowPr1rm)' }} name="Est. 1RM (lbs)" animationDuration={600} animationEasing="ease-out" />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log your first PR to see trends</div>
                    )
                  )}
                  {chartTab === 'volume' && (
                    weeklyVolumeComparison.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyVolumeComparison.map(d => ({ ...d, label: d.label.replace(/^\w+\s/, '') }))} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <defs>
                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="50%" stopColor="#10b981" stopOpacity={0.18} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            <linearGradient id="volPriorGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6b7280" stopOpacity={0.35} /><stop offset="60%" stopColor="#6b7280" stopOpacity={0.1} /><stop offset="100%" stopColor="#6b7280" stopOpacity={0} /></linearGradient>
                            <filter id="glowVolCurr"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="glowVolPrior"><feGaussianBlur stdDeviation="2" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.025)" vertical={false} strokeWidth={1} />
                          <XAxis dataKey="label" stroke="#6b7280" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={6} interval="preserveStartEnd" />
                          <YAxis stroke="#6b7280" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} width={32} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload as any
                            const current = d.current ?? 0
                            const prior = d.prior ?? 0
                            const delta = current - prior
                            return (
                              <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-emerald-500/5 min-w-[170px]">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                                <div className="relative space-y-2">
                                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                    <span className="text-white font-bold text-xs">{d.label}</span>
                                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                      {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" style={{ filter: 'url(#glowVolCurr)' }} />
                                    <span className="text-gray-400 font-medium">This Week</span>
                                    <span className="text-white font-bold ml-auto text-sm">{current.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shadow-lg shadow-gray-500/40" style={{ filter: 'url(#glowVolPrior)' }} />
                                    <span className="text-gray-400 font-medium">Last Week</span>
                                    <span className="text-gray-300 font-bold ml-auto text-sm">{prior.toLocaleString()}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          }} cursor={{ fill: 'rgba(16,185,129,0.1)' }} />
                          <Area yAxisId="left" type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2.5} fill="url(#volGrad)" dot={false} activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2.5, stroke: '#1a1a2e', filter: 'url(#glowVolCurr)' }} animationDuration={600} animationEasing="ease-out" name="This Week" />
                          <Line yAxisId="left" type="monotone" dataKey="prior" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: '#6b7280', strokeWidth: 2, stroke: '#1a1a2e', filter: 'url(#glowVolPrior)' }} name="Last Week" animationDuration={600} animationEasing="ease-out" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">Not enough workout data yet — keep training!</div>
                    )
                  )}
                  {chartTab === 'weight' && (
                    bodyWeightData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={bodyWeightData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                          <defs>
                            <linearGradient id="bodyWeightGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} /><stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                            <linearGradient id="bodyFatGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} /><stop offset="60%" stopColor="#f59e0b" stopOpacity={0.12} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                            <filter id="glowBw"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            <filter id="glowBf"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.025)" vertical={false} strokeWidth={1} />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={6} interval="preserveStartEnd" />
                          <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} width={32} tickFormatter={v => `${v}`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} width={32} tickFormatter={v => `${v}%`} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload as any
                            const prev = bodyWeightData[bodyWeightData.indexOf(d) - 1]
                            const delta = prev?.weight != null && d.weight != null ? d.weight - prev.weight : null
                            return (
                              <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-violet-500/5 min-w-[170px]">
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/5">
                                    <span className="text-white font-bold text-xs">{d.date}</span>
                                    {delta != null && (
                                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${delta > 0 ? 'text-rose-400' : delta < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta).toFixed(2)} kg
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/40" style={{ filter: 'url(#glowBw)' }} />
                                      <span className="text-gray-400 font-medium">Weight</span>
                                      <span className="text-white font-bold ml-auto text-sm">{d.weight} <span className="text-[10px] font-normal text-gray-500">kg</span></span>
                                    </div>
                                    {d.bodyFat != null && (
                                      <div className="flex items-center gap-2.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/40" style={{ filter: 'url(#glowBf)' }} />
                                        <span className="text-gray-400 font-medium">Body Fat</span>
                                        <span className="text-white font-bold ml-auto text-sm">{d.bodyFat} <span className="text-[10px] font-normal text-gray-500">%</span></span>
                                      </div>
                                    )}
                                    {bodyGoalWeight && !isNaN(Number(bodyGoalWeight)) && (
                                      <div className="flex items-center gap-2.5 pt-1.5 border-t border-white/5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                                        <span className="text-gray-400 font-medium">Goal</span>
                                        <span className="text-emerald-400 font-bold ml-auto">{Number(bodyGoalWeight).toFixed(1)} kg</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          }} cursor={{ fill: 'rgba(139,92,246,0.1)' }} />
                          <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#bodyWeightGrad)" dot={false} activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2.5, stroke: '#1a1a2e', filter: 'url(#glowBw)' }} animationDuration={600} animationEasing="ease-out" />
                          {bodyWeightData.some(d => d.bodyFat != null) && (
                            <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2.5, stroke: '#1a1a2e', filter: 'url(#glowBf)' }} name="Body Fat %" animationDuration={600} animationEasing="ease-out" />
                          )}
                          {bodyGoalWeight && !isNaN(Number(bodyGoalWeight)) && (
                            <Line yAxisId="left" type="monotone" dataKey={() => Number(bodyGoalWeight)} stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 4" dot={false} opacity={0.7} name="Goal" animationDuration={400} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log your body weight in the Body tab to see trends here.</div>
                    )
                  )}
                </div>
              </div>

              {/* Stats strip */}
              {(() => {
                if (chartTab === 'prs' && chartData.length > 0) {
                  const avgW = chartData.reduce((s, d) => s + d.weight, 0) / chartData.length
                  const maxW = Math.max(...chartData.map(d => d.weight))
                  const best1RM = Math.max(...chartData.map(d => d.estimated1RM ?? 0))
                  const lastW = chartData[chartData.length - 1]?.weight ?? 0
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>📊 Avg Weight <span className="font-semibold text-rose-400">{avgW.toFixed(1)}</span></span>
                        <span>📈 Best Weight <span className="font-semibold text-gray-300">{maxW.toFixed(1)}</span></span>
                        <span>🏋️ Best 1RM <span className="font-semibold text-amber-400">{best1RM}</span></span>
                        <span>📋 Latest <span className="font-semibold text-violet-400">{lastW.toFixed(1)}</span></span>
                        <span>📝 Entries <span className="font-semibold text-indigo-400">{chartData.length}</span></span>
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(records.length / 30 * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                if (chartTab === 'volume' && weeklyVolumeComparison.length > 0) {
                  const currents = weeklyVolumeComparison.map(d => d.current)
                  const maxC = Math.max(...currents)
                  const avgC = currents.reduce((s, v) => s + v, 0) / currents.length
                  const totalW = workouts.length
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>📊 Avg Vol <span className="font-semibold text-emerald-400">{avgC.toFixed(0)}</span></span>
                        <span>📈 Peak <span className="font-semibold text-gray-300">{maxC.toFixed(0)}</span></span>
                        <span>📋 Workouts <span className="font-semibold text-violet-400">{totalW}</span></span>
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(workouts.length / 30 * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                if (chartTab === 'weight' && bodyWeightData.length > 1) {
                  const vals = bodyWeightData.map(d => d.weight)
                  const avg = vals.reduce((s, v) => s + v, 0) / vals.length
                  const max = Math.max(...vals)
                  const min = Math.min(...vals)
                  const hasBf = bodyWeightData.some(d => d.bodyFat != null)
                  const bfVals = bodyWeightData.filter(d => d.bodyFat != null).map(d => d.bodyFat!)
                  const avgBf = bfVals.length > 0 ? bfVals.reduce((s, v) => s + v, 0) / bfVals.length : null
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>📊 Avg <span className="font-semibold text-violet-400">{avg.toFixed(1)}</span> kg</span>
                        <span>📈 High <span className="font-semibold text-gray-300">{max.toFixed(1)}</span> kg</span>
                        <span>📉 Low <span className="font-semibold text-gray-300">{min.toFixed(1)}</span> kg</span>
                        <span>📋 Entries <span className="font-semibold text-violet-400">{bodyWeightData.length}</span></span>
                        {hasBf && avgBf != null && <span>🟡 Body Fat <span className="font-semibold text-amber-400">{avgBf.toFixed(1)}%</span></span>}
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(bodyWeightData.length / 30 * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements Panel (toggleable) */}
      <AnimatePresence>
        {showAchievements && records.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-yellow-500/3 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-500/20 border border-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">ACHIEVEMENTS</span>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden min-w-[60px]">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700" style={{ width: `${(earned.size / ACHIEVEMENT_DEFS.length) * 100}%` }} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400">{earned.size}/{ACHIEVEMENT_DEFS.length}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACHIEVEMENT_DEFS.map((ach) => {
                  const isUnlocked = earned.has(ach.id)
                  const IconComponent = ACHIEVEMENT_ICON_MAP[ach.icon]
                  return (
                    <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      whileHover={isUnlocked ? { scale: 1.03, y: -1 } : {}}
                      className={`relative overflow-hidden rounded-xl p-3.5 text-center border transition-all duration-500 ${
                        isUnlocked
                          ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/8 to-transparent shadow-lg shadow-amber-500/5'
                          : 'border-white/[0.04] bg-white/[0.02] opacity-40 hover:opacity-60'
                      }`}>
                      {isUnlocked && (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.06),transparent_70%)] pointer-events-none rounded-xl" />
                          <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/8 rounded-full blur-xl" />
                        </>
                      )}
                      <div className="relative">
                        <div className={`inline-flex p-2 rounded-xl mb-2.5 transition-all duration-500 ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-amber-500/25 to-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20'
                            : 'bg-white/[0.03]'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${isUnlocked ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]' : 'text-gray-600'}`} />
                        </div>
                        <p className={`text-[11px] font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                        <p className={`text-[9px] mt-1 leading-tight ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>{ach.description}</p>
                        {isUnlocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PR Leaderboard */}
      {prLeaderboard.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-[12px] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">PR Leaderboard</h4>
          </div>
          <div className="space-y-1.5">
            {prLeaderboard.map(([name, data], idx) => (
              <div key={name} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5 border border-white/5">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                  idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                  idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-white/5 text-gray-500'
                }`}>{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{name}</p>
                  <p className="text-[10px] text-gray-500">{data.count} PR{data.count !== 1 ? 's' : ''} · Best: {data.bestWeight}lbs</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">{data.count}</p>
                  <p className="text-[10px] text-gray-500">PRs</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PR Cards / Empty State */}
      {records.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-10 text-center">
          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">No Records Yet</h3>
          <p className="text-gray-400 mb-1">Time to crush some PRs!</p>
          <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-1.5" />Add Your First PR
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...new Set(records.map(r => r.exerciseName))].sort().map((exercise, idx) => {
            const recs = records.filter(r => r.exerciseName === exercise)
            const bestW = Math.max(...recs.map(r => r.weight))
            const bestR = Math.max(...recs.map(r => r.reps))
            const bestV = Math.max(...recs.map(r => r.weight * r.reps))
            const goals = recs.filter(r => r.goalWeight || r.goalReps || r.goalVolume)
            return (
              <motion.div key={exercise} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-5 text-left w-full">
                <div className="relative">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-amber-400" />{exercise}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Weight</p>
                      <p className="text-sm font-bold text-amber-300">{bestW}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Reps</p>
                      <p className="text-sm font-bold text-purple-300">{bestR}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2 text-center">
                      <p className="text-[10px] text-gray-500 uppercase">Volume</p>
                      <p className="text-sm font-bold text-emerald-300">{bestV.toLocaleString()}</p>
                    </div>
                  </div>
                  {goals.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                      {goals.map(g => {
                        if (g.goalWeight) {
                          const pct = Math.min(100, Math.round((g.weight / g.goalWeight) * 100))
                          const achieved = pct >= 100
                          return (
                            <div key={g.id} className="text-xs">
                              <div className="flex justify-between text-gray-400 mb-0.5">
                                <span className="flex items-center gap-1"><Target className="w-3 h-3 text-amber-400" />Goal: {g.goalWeight}lbs</span>
                                <span className={achieved ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                                  {achieved && <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-400" />}{pct}%
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        }
                        if (g.goalReps) {
                          const pct = Math.min(100, Math.round((g.reps / g.goalReps) * 100))
                          const achieved = pct >= 100
                          return (
                            <div key={g.id} className="text-xs">
                              <div className="flex justify-between text-gray-400 mb-0.5">
                                <span className="flex items-center gap-1"><Target className="w-3 h-3 text-purple-400" />Goal: {g.goalReps} reps</span>
                                <span className={achieved ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                                  {achieved && <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-400" />}{pct}%
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        }
                        if (g.goalVolume) {
                          const pct = Math.min(100, Math.round(((g.weight * g.reps) / g.goalVolume) * 100))
                          const achieved = pct >= 100
                          return (
                            <div key={g.id} className="text-xs">
                              <div className="flex justify-between text-gray-400 mb-0.5">
                                <span className="flex items-center gap-1"><Target className="w-3 h-3 text-emerald-400" />Goal: {g.goalVolume.toLocaleString()} vol</span>
                                <span className={achieved ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
                                  {achieved && <CheckCircle2 className="w-3 h-3 inline mr-0.5 text-emerald-400" />}{pct}%
                                </span>
                              </div>
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${achieved ? 'bg-emerald-500' : 'bg-emerald-500/60'}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add PR Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => { setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', goalWeight: '', goalReps: '', goalVolume: '', notes: '' }); setShowModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative w-full max-w-lg my-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative rounded-2xl border border-white/[0.08] bg-gray-900/90 backdrop-blur-xl p-[1px] shadow-2xl shadow-amber-500/5">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative rounded-2xl bg-gray-950/90 backdrop-blur-xl p-5 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.04]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Trophy className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">New Personal Record</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">Log your latest achievement</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Exercise */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                            <Dumbbell className="w-3 h-3 text-amber-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-300/70">Exercise</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
                        </div>
                        <div>
                          <input type="text" value={formData.exerciseName}
                            onChange={e => setFormData({ ...formData, exerciseName: e.target.value })}
                            placeholder="e.g., Bench Press"
                            list="exercise-list"
                            className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-amber-500/25 hover:border-white/[0.15]" />
                          <datalist id="exercise-list">{exercises.map(ex => <option key={ex} value={ex} />)}</datalist>
                        </div>
                      </div>
                    </div>

                    {/* Weight & Reps */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-purple-500/15 flex items-center justify-center">
                            <Award className="w-3 h-3 text-purple-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-purple-300/70">Lift Details</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/20 via-purple-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Weight (lbs)</label>
                            <input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="0"
                              className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-purple-500/25 hover:border-white/[0.15]" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 mb-1">Reps</label>
                            <input type="number" value={formData.reps} onChange={e => setFormData({ ...formData, reps: e.target.value })}
                              placeholder="0"
                              className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-purple-500/25 hover:border-white/[0.15]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-violet-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300/70">Date</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />
                        </div>
                        <input type="date" value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15] [color-scheme:dark]" />
                      </div>
                    </div>

                    {/* PR Category */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                            <Star className="w-3 h-3 text-emerald-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-300/70">PR Category</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([{ value: 'weight', label: 'Weight', icon: Award }, { value: 'reps', label: 'Reps', icon: Star }, { value: 'volume', label: 'Volume', icon: Flame }] as const).map(({ value, label, icon: Icon }) => (
                            <motion.button key={value} type="button"
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setFormData({ ...formData, type: value })}
                              className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all ${
                                formData.type === value
                                  ? value === 'weight' ? 'bg-amber-500/15 border-amber-500/40' : value === 'reps' ? 'bg-purple-500/15 border-purple-500/40' : 'bg-emerald-500/15 border-emerald-500/40'
                                  : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.15]'
                              }`}>
                              <Icon className={`w-4 h-4 ${formData.type === value ? (value === 'weight' ? 'text-amber-300' : value === 'reps' ? 'text-purple-300' : 'text-emerald-300') : 'text-gray-500'}`} />
                              <span className={`text-[8px] font-semibold ${formData.type === value ? (value === 'weight' ? 'text-amber-300' : value === 'reps' ? 'text-purple-300' : 'text-emerald-300') : 'text-gray-500'}`}>{label} PR</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Est. 1RM */}
                    {formData.weight && formData.reps && Number(formData.weight) > 0 && Number(formData.reps) > 0 && (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                        <div className="rounded-xl bg-gray-900/60 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                              <Flame className="w-3 h-3 text-amber-300" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-300/70">Estimated 1RM</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
                          </div>
                          <div className="text-center py-2">
                            <span className="text-2xl font-bold text-amber-300">{estimate1RM(Number(formData.weight), Number(formData.reps))}</span>
                            <span className="text-xs text-gray-500 ml-1">lbs</span>
                            <p className="text-[9px] text-gray-500 mt-1">Based on Epley formula: weight × (1 + reps / 30)</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-sky-500/15 flex items-center justify-center">
                            <Activity className="w-3 h-3 text-sky-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-sky-300/70">Notes</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-sky-500/20 via-sky-500/5 to-transparent" />
                        </div>
                        <textarea value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="How did this feel? Any technique notes..."
                          rows={2}
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-sky-500/25 hover:border-white/[0.15] resize-none" />
                      </div>
                    </div>

                    {/* Save */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={saveRecord}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-emerald-500/20 border border-amber-500/25 text-amber-300 font-bold text-xs uppercase tracking-widest hover:from-amber-500/25 hover:via-amber-500/15 hover:to-emerald-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Trophy className="w-4 h-4" />
                      Save Personal Record
                    </motion.button>
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
