import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Star, Award, X,
  Dumbbell, Flame, BarChart3,
  Sparkles, Target, CheckCircle2, Medal,
  Calendar,
  Brain, ChevronLeft, ChevronRight, RotateCcw, Pencil, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  ComposedChart, Bar, Line,
  BarChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useAppStore } from '@/store/useAppStore'
import type { Workout, BodyMetric, WorkoutExercise, ExerciseSet, PersonalRecord } from '@/types/domain'

interface StrengthLevel {
  exercise: string
  level: string
  color: string
  ratio: number
  weight: number
  bodyWeight: number
}

const ACHIEVEMENTS_KEY = 'vitalfi_progress_achievements'
const CONFETTI_COLORS = ['#F59E0B', '#A78BFA', '#10B981', '#EF4444', '#3B82F6']

const ACHIEVEMENT_TIERS: { key: string; label: string; icon: string; gradient: string; border: string; text: string; bg: string }[] = [
  { key: 'milestones', label: 'Milestones', icon: '🏆', gradient: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/20', text: 'text-amber-300', bg: 'bg-amber-500/[0.04]' },
  { key: 'volume', label: 'Volume', icon: '📊', gradient: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300', bg: 'bg-emerald-500/[0.04]' },
  { key: 'variety', label: 'Variety', icon: '🎯', gradient: 'from-violet-500/20 to-purple-500/10', border: 'border-violet-500/20', text: 'text-violet-300', bg: 'bg-violet-500/[0.04]' },
  { key: 'strength', label: 'Strength', icon: '💪', gradient: 'from-rose-500/20 to-pink-500/10', border: 'border-rose-500/20', text: 'text-rose-300', bg: 'bg-rose-500/[0.04]' },
  { key: 'consistency', label: 'Consistency', icon: '🔥', gradient: 'from-cyan-500/20 to-sky-500/10', border: 'border-cyan-500/20', text: 'text-cyan-300', bg: 'bg-cyan-500/[0.04]' },
]

const ACHIEVEMENT_DEFS: { id: string; name: string; icon: keyof typeof ACHIEVEMENT_ICON_MAP; description: string; tier: string; check: (stats: { prCount: number; totalVolume: number; exercises: number; bestRatio: number; streak: number; hasAdvanced: boolean }) => boolean; progress?: (stats: { prCount: number; totalVolume: number; exercises: number; bestRatio: number; streak: number; hasAdvanced: boolean }) => { current: number; target: number } }[] = [
  { id: 'first_pr', name: 'First PR', icon: 'star', description: 'Log your first personal record', tier: 'milestones', check: s => s.prCount >= 1, progress: s => ({ current: Math.min(s.prCount, 1), target: 1 }) },
  { id: 'five_prs', name: 'On Fire', icon: 'flame', description: 'Log 5 personal records', tier: 'milestones', check: s => s.prCount >= 5, progress: s => ({ current: Math.min(s.prCount, 5), target: 5 }) },
  { id: 'ten_prs', name: 'Rising Star', icon: 'award', description: 'Log 10 personal records', tier: 'milestones', check: s => s.prCount >= 10, progress: s => ({ current: Math.min(s.prCount, 10), target: 10 }) },
  { id: 'twenty_five_prs', name: 'Dedicated', icon: 'medal', description: 'Log 25 personal records', tier: 'milestones', check: s => s.prCount >= 25, progress: s => ({ current: Math.min(s.prCount, 25), target: 25 }) },
  { id: 'fifty_prs', name: 'PR Machine', icon: 'trophy', description: 'Log 50 personal records', tier: 'milestones', check: s => s.prCount >= 50, progress: s => ({ current: Math.min(s.prCount, 50), target: 50 }) },
  { id: 'hundred_prs', name: 'Legendary', icon: 'trophy', description: 'Log 100 personal records', tier: 'milestones', check: s => s.prCount >= 100, progress: s => ({ current: Math.min(s.prCount, 100), target: 100 }) },
  { id: 'volume_100k', name: 'Volume Novice', icon: 'flame', description: 'Reach 100,000 total volume', tier: 'volume', check: s => s.totalVolume >= 100000, progress: s => ({ current: Math.min(Math.round(s.totalVolume / 1000), 100), target: 100 }) },
  { id: 'volume_master', name: 'Volume Master', icon: 'flame', description: 'Reach 1,000,000 total volume', tier: 'volume', check: s => s.totalVolume >= 1000000, progress: s => ({ current: Math.min(Math.round(s.totalVolume / 10000), 100), target: 100 }) },
  { id: 'five_exercises', name: 'Explorer', icon: 'star', description: 'Log PRs in 5 different exercises', tier: 'variety', check: s => s.exercises >= 5, progress: s => ({ current: Math.min(s.exercises, 5), target: 5 }) },
  { id: 'ten_exercises', name: 'Versatile', icon: 'award', description: 'Log PRs in 10 different exercises', tier: 'variety', check: s => s.exercises >= 10, progress: s => ({ current: Math.min(s.exercises, 10), target: 10 }) },
  { id: 'strength_milestone', name: 'Strength Milestone', icon: 'medal', description: 'Reach Advanced tier on any exercise', tier: 'strength', check: s => s.hasAdvanced },
  { id: 'elite_milestone', name: 'Elite Status', icon: 'star', description: 'Reach Elite tier on any exercise', tier: 'strength', check: s => s.bestRatio >= 2.5, progress: s => ({ current: Math.min(Math.round(s.bestRatio * 10), 25), target: 25 }) },
  { id: 'seven_day_streak', name: 'Consistent', icon: 'flame', description: 'PR on 7 different days', tier: 'consistency', check: s => s.streak >= 7, progress: s => ({ current: Math.min(s.streak, 7), target: 7 }) },
  { id: 'fourteen_day_streak', name: 'Unstoppable', icon: 'trophy', description: 'PR on 14 different days', tier: 'consistency', check: s => s.streak >= 14, progress: s => ({ current: Math.min(s.streak, 14), target: 14 }) },
]

const ACHIEVEMENT_ICON_MAP = {
  star: Star, award: Award, medal: Medal, trophy: Trophy, flame: Flame,
}

function classifyStrength(exerciseName: string, weight: number, bodyWeight: number): { level: string; color: string; ratio: number } | null {
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
  for (const t of thresholds) { if (ratio >= t.minRatio) return { level: t.level, color: t.color, ratio } }
  return { level: 'Untrained', color: '#6b7280', ratio }
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
  const { workouts, bodyMetrics, personalRecords, dataVersion, addPersonalRecord, updatePersonalRecord, deletePersonalRecord } = useAppStore()
  const records = personalRecords
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<PersonalRecord | null>(null)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [justAdded, setJustAdded] = useState('')
  const [formData, setFormData] = useState({
    exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0],
    type: 'weight' as 'weight' | 'reps' | 'volume' | 'endurance' | 'speed',
    rpe: 0, sets: '', duration: '', distance: '',
    contextTags: [] as string[],
    goalWeight: '', goalReps: '', goalVolume: '', notes: '',
  })
  const [selectedExercise] = useState<string>('')
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [showAchievements, setShowAchievements] = useState(false)
  const [showPerfCoach, setShowPerfCoach] = useState(false)
  const [showPerfFocusPref, setShowPerfFocusPref] = useState(false)
  const [showPerfScope, setShowPerfScope] = useState(false)
  const [achTab, setAchTab] = useState<string>('milestones')
  const [perfFocus, setPerfFocus] = useState<'strength' | 'hypertrophy' | 'endurance' | 'power' | 'overall'>('overall')
  const [scopeOffset, setScopeOffset] = useState(0)
  const [chartTab, setChartTab] = useState<'prs' | 'progression' | 'matrix'>('prs')
  const [recordType, setRecordType] = useState<'all' | 'weight' | 'reps' | 'volume' | 'endurance' | 'speed'>('all')
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

  const filteredRecords = useMemo(() => {
    if (recordType === 'all') return records
    return records.filter(r => r.type === recordType)
  }, [records, recordType])

  const strengthProgression = useMemo(() => {
    const top5 = [...new Set(filteredRecords.map(r => r.exerciseName))]
      .map(ex => ({ ex, count: filteredRecords.filter(r => r.exerciseName === ex).length }))
      .sort((a, b) => b.count - a.count).slice(0, 5).map(e => e.ex)
    const allDates = [...new Set(filteredRecords.map(r => r.date))].sort()
    const data = allDates.map(date => {
      const point: Record<string, string | number | null> = {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
      }
      for (const ex of top5) {
        const bestUpTo = filteredRecords
          .filter(r => r.exerciseName === ex && r.date <= date)
          .reduce((best, r) => Math.max(best, estimate1RM(r.weight, r.reps)), 0)
        point[ex] = bestUpTo > 0 ? bestUpTo : null
      }
      return point
    })
    return { data, exercises: top5 }
  }, [filteredRecords])

  const strengthMatrix = useMemo(() => {
    return [...new Map(filteredRecords.map(r => [r.exerciseName, r])).values()]
      .map(r => {
        const allRecords = filteredRecords.filter(pr => pr.exerciseName === r.exerciseName)
        const best = allRecords.reduce((a, b) => estimate1RM(a.weight, a.reps) > estimate1RM(b.weight, b.reps) ? a : b)
        const e1rm = estimate1RM(best.weight, best.reps)
        const classification = latestWeight
          ? classifyStrength(best.exerciseName, best.weight, latestWeight)
          : null
        const maxReps = Math.max(...allRecords.map(x => x.reps), 0)
        const maxVolume = Math.max(...allRecords.map(x => x.weight * x.reps), 0)
        const maxDuration = Math.max(...allRecords.map(x => x.duration ?? 0), 0)
        const speeds = allRecords.filter(x => (x.distance ?? 0) > 0 && (x.duration ?? 0) > 0).map(x => x.distance! / (x.duration! / 3600))
        const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
        return { name: best.exerciseName, best1RM: e1rm, ratio: classification?.ratio ?? 0, level: classification?.level ?? '', color: classification?.color ?? '#6b7280', maxReps, maxVolume, maxDuration, maxSpeed }
      })
      .sort((a, b) => b.best1RM - a.best1RM)
  }, [filteredRecords, latestWeight])

  const exerciseColors = useMemo(() => {
    const exNames = [...new Set(records.map(r => r.exerciseName))]
    const palette = ['#10b981', '#8b5cf6', '#f59e0b', '#3b82f6', '#f43f5e', '#06b6d4', '#ec4899', '#84cc16']
    return Object.fromEntries(exNames.map((n, i) => [n, palette[i % palette.length]]))
  }, [records])

  const progressionRadarData = useMemo(() => {
    const exNames = [...new Set(filteredRecords.map(r => r.exerciseName))]
    const top6 = exNames.map(ex => ({ ex, count: filteredRecords.filter(r => r.exerciseName === ex).length })).sort((a, b) => b.count - a.count).slice(0, 6).map(e => e.ex)
    return top6.map(ex => {
      const exRecords = filteredRecords.filter(r => r.exerciseName === ex).sort((a, b) => a.date.localeCompare(b.date))
      const current = exRecords.length > 0 ? estimate1RM(exRecords[exRecords.length - 1].weight, exRecords[exRecords.length - 1].reps) : 0
      const first = exRecords.length > 0 ? estimate1RM(exRecords[0].weight, exRecords[0].reps) : 0
      const ratio = latestWeight && latestWeight > 0 ? parseFloat((current / latestWeight).toFixed(2)) : current
      const level = classifyStrength(ex, current, latestWeight || 0)
      const gain = current - first
      const isRatio = latestWeight && latestWeight > 0
      const maxReps = Math.max(...exRecords.map(r => r.reps), 0)
      const maxVolume = Math.max(...exRecords.map(r => r.weight * r.reps), 0)
      const maxDuration = Math.max(...exRecords.map(r => r.duration ?? 0), 0)
      const speeds = exRecords.filter(r => (r.distance ?? 0) > 0 && (r.duration ?? 0) > 0).map(r => r.distance! / (r.duration! / 3600))
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
      const latestRecord = exRecords[exRecords.length - 1]
      return { exercise: ex.replace(/_/g, ' '), ratio, value: ratio, current, first, gain, level: level?.level || '', color: level?.color || '#8b5cf6', isRatio, maxReps, maxVolume, maxDuration, maxSpeed, latestType: latestRecord?.type ?? 'weight' }
    })
  }, [filteredRecords, latestWeight])

  const totalVolume = useMemo(() =>
    workouts.length > 0
      ? workouts.reduce((s: number, w: Workout) => s + (w.exercises?.reduce((se: number, ex: WorkoutExercise) => se + ex.sets.reduce((st: number, set: ExerciseSet) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0), 0)
      : records.reduce((s, r) => s + (r.weight || 0) * (r.reps || 0), 0),
    [workouts, records]
  )

  const best1RM = useMemo(() => {
    if (records.length === 0) return 0
    return Math.max(...records.map(r => estimate1RM(r.weight, r.reps)))
  }, [records])

  const metricConfig = useMemo(() => {
    if (recordType === 'all' || recordType === 'weight') return { barKey: 'weight' as const, barLabel: 'Weight', barUnit: 'lbs', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'best1RM' as const, matrixLabel: '1RM', progKey: 'ratio' as const, progLabel: 'Strength Ratio', progUnit: 'x BW', progFormat: (v: number) => `${v}x` }
    if (recordType === 'reps') return { barKey: 'reps' as const, barLabel: 'Reps', barUnit: 'reps', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'maxReps' as const, matrixLabel: 'Max Reps', progKey: 'maxReps' as const, progLabel: 'Max Reps', progUnit: 'reps', progFormat: (v: number) => `${v}` }
    if (recordType === 'volume') return { barKey: 'volume' as const, barLabel: 'Volume', barUnit: 'lbs', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'maxVolume' as const, matrixLabel: 'Max Volume', progKey: 'maxVolume' as const, progLabel: 'Max Volume', progUnit: 'lbs', progFormat: (v: number) => v.toLocaleString() }
    if (recordType === 'endurance') return { barKey: 'duration' as const, barLabel: 'Duration', barUnit: 'min:sec', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'maxDuration' as const, matrixLabel: 'Max Duration', progKey: 'maxDuration' as const, progLabel: 'Max Duration', progUnit: 'min:sec', progFormat: (v: number) => { const m = Math.floor(v / 60); const s = Math.floor(v % 60); return `${m}:${s.toString().padStart(2, '0')}` } }
    if (recordType === 'speed') return { barKey: 'distance' as const, barLabel: 'Distance', barUnit: 'mi', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'maxSpeed' as const, matrixLabel: 'Max Speed', progKey: 'maxSpeed' as const, progLabel: 'Max Speed', progUnit: 'mph', progFormat: (v: number) => `${v.toFixed(1)}` }
    return { barKey: 'weight' as const, barLabel: 'Weight', barUnit: 'lbs', refKey: 'estimated1RM' as const, refLabel: 'Est 1RM', refUnit: 'lbs', matrixKey: 'best1RM' as const, matrixLabel: '1RM', progKey: 'ratio' as const, progLabel: 'Strength Ratio', progUnit: 'x BW', progFormat: (v: number) => `${v}x` }
  }, [recordType])

  const chartData = useMemo(() => {
    const targetRecords = selectedExercise
      ? filteredRecords.filter(r => r.exerciseName === selectedExercise)
      : filteredRecords
    return targetRecords
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        weight: r.weight, reps: r.reps, volume: r.weight * r.reps, estimated1RM: estimate1RM(r.weight, r.reps),
        exerciseName: r.exerciseName,
        type: r.type, duration: r.duration ?? 0, distance: r.distance ?? 0,
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

  const saveRecord = async () => {
    if (!formData.exerciseName.trim()) return
    const w = Number(formData.weight)
    const r = Number(formData.reps)
    if (formData.type !== 'endurance' && formData.type !== 'speed' && (w <= 0 || r <= 0) && !formData.duration && !formData.distance) return
    const now = new Date().toISOString()
    const record: PersonalRecord = {
      id: editingRecord?.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      exerciseName: formData.exerciseName.trim(),
      weight: formData.type === 'endurance' ? 0 : (w || 0),
      reps: formData.type === 'endurance' ? 0 : (r || 0),
      date: formData.date, type: formData.type,
      rpe: formData.rpe || undefined,
      sets: Number(formData.sets) || undefined,
      duration: Number(formData.duration) || undefined,
      distance: Number(formData.distance) || undefined,
      contextTags: formData.contextTags.length > 0 ? formData.contextTags : undefined,
      createdAt: editingRecord?.createdAt ?? now,
      updatedAt: now,
    }
    if (formData.goalWeight) record.goalWeight = Number(formData.goalWeight)
    if (formData.goalReps) record.goalReps = Number(formData.goalReps)
    if (formData.goalVolume) record.goalVolume = Number(formData.goalVolume)
    if (formData.notes) record.notes = formData.notes
    if (editingRecord) {
      await updatePersonalRecord(record)
    } else {
      await addPersonalRecord(record)
    }
    setShowModal(false)
    setEditingRecord(null)
    setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', rpe: 0, sets: '', duration: '', distance: '', contextTags: [], goalWeight: '', goalReps: '', goalVolume: '', notes: '' })
    if (!editingRecord) {
      setConfettiTrigger(prev => prev + 1)
      setShowPerfCoach(true)
      setShowPerfScope(true)
      setJustAdded(`${formData.exerciseName} — ${formData.type === 'endurance' ? `${formData.duration || 0}s` : formData.type === 'speed' ? `${formData.distance || 0}m` : `${w}lbs × ${r} reps`}`)
      setTimeout(() => setJustAdded(''), 4000)
    }
  }

  const formatDur = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }

  return (
    <div className="space-y-4">
      <Confetti active={confettiTrigger > 0} />

      {justAdded && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 via-amber-500/10 to-violet-500/10 p-4 shadow-lg shadow-emerald-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5" />
          <div className="relative flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">New PR Logged!</p>
              <p className="text-[11px] text-emerald-300/70 mt-0.5">{justAdded}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setShowPerfCoach(p => !p); setShowPerfScope(false) }}
                className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${showPerfCoach ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                <Brain className="w-3 h-3 inline mr-1" />Coach
              </button>
              <button onClick={() => { setShowPerfScope(p => !p); setShowPerfCoach(false) }}
                className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${showPerfScope ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                <BarChart3 className="w-3 h-3 inline mr-1" />Scope
              </button>
              <button onClick={() => setJustAdded('')} className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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
          <Button variant="primary" size="sm" onClick={() => { setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', rpe: 0, sets: '', duration: '', distance: '', contextTags: [], goalWeight: '', goalReps: '', goalVolume: '', notes: '' }); setEditingRecord(null); setShowModal(true) }}>
              <Plus className="w-4 h-4 mr-1" />Add PR
            </Button>
          </div>
      </motion.div>

      {/* Stat Cards — merged essentials */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: records.length === 1 ? 'PR' : 'PRs', value: records.length, icon: Trophy, color: 'amber', border: 'border-amber-500/25', bg: 'from-amber-500/8 to-transparent', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
          { label: 'Best 1RM', value: best1RM, suffix: ' lbs', icon: Award, color: 'purple', border: 'border-purple-500/25', bg: 'from-purple-500/8 to-transparent', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
          { label: 'Volume', value: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume, icon: Flame, color: 'emerald', border: 'border-emerald-500/25', bg: 'from-emerald-500/8 to-transparent', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
          { label: 'Streak', value: prStreak, suffix: 'd', icon: Flame, color: 'rose', border: 'border-rose-500/25', bg: 'from-rose-500/8 to-transparent', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400' },
        ].map((card, i) => (
          <motion.div key={i} whileHover={{ y: -1, scale: 1.01 }}
            className={`relative overflow-hidden rounded-xl border ${card.border} bg-black/60 backdrop-blur-xl p-3 group`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.bg} group-hover:opacity-150 transition-opacity`} />
            <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
            <div className="relative flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${card.iconBg} ring-1 ring-white/5`}>
                <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{card.value}{card.suffix && <span className="text-[10px] font-normal text-gray-500">{card.suffix}</span>}</p>
                <p className="text-[9px] text-gray-500">{card.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* PERFCOACH Panel */}
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
                <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/15 flex items-center justify-center">
                        <Medal className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Strength Levels</span>
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
              </div>
              <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/15 flex items-center justify-center">
                        <Flame className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Volume Overview</span>
                    </div>
                  <p className="text-sm font-bold text-white">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}<span className="text-xs text-gray-500 font-normal"> total lbs</span></p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{records.length > 0 ? `${(totalVolume / records.length).toFixed(0)} avg per PR` : 'Log PRs to see averages'}</p>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all" style={{ width: `${Math.min((totalVolume / 500000) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

              {/* AI Insights */}
              {perfInsights.length > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-violet-500/3" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/15 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">AI Insights</span>
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
              </div>
              )}
            </div>
          </motion.div>
        )}
        
      {/* PerfScope Panel */}
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
                    { key: 'progression' as const, label: 'Progression', icon: '📈' },
                    { key: 'matrix' as const, label: 'Matrix', icon: '🎯' },
                  ].map(m => (
                    <button key={m.key} onClick={() => setChartTab(m.key)}
                      className={`relative px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        chartTab === m.key
                          ? m.key === 'prs' ? 'text-amber-300 bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/25 shadow-lg shadow-amber-500/8'
                          : m.key === 'progression' ? 'text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/8'
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
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[
                    { key: 'all' as const, label: 'All', icon: '📋' },
                    { key: 'weight' as const, label: 'Weight', icon: '🏋️' },
                    { key: 'reps' as const, label: 'Reps', icon: '🔥' },
                    { key: 'volume' as const, label: 'Volume', icon: '📊' },
                    { key: 'endurance' as const, label: 'Endurance', icon: '⏱️' },
                    { key: 'speed' as const, label: 'Speed', icon: '⚡' },
                  ].map(t => (
                    <button key={t.key} onClick={() => setRecordType(t.key)}
                      className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
                        recordType === t.key
                          ? 'text-white bg-white/[0.08] border border-white/[0.1] shadow-sm'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      {t.key === 'all' ? t.label : `${t.icon}`}
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
                        <ResponsiveContainer width="100%" height="100%" key={`prs-${dataVersion}`}>
                          <ComposedChart data={chartData} barGap={4} barCategoryGap="25%" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                            <defs>
                              {[...new Set(chartData.map(d => d.exerciseName))].map(ex => (
                                <linearGradient key={ex} id={`cmpBar_${ex.replace(/\s/g, '_')}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={exerciseColors[ex] || '#8b5cf6'} stopOpacity={0.85} />
                                  <stop offset="100%" stopColor={exerciseColors[ex] || '#8b5cf6'} stopOpacity={0.15} />
                                </linearGradient>
                              ))}
                              <linearGradient id="cmpLineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                                <stop offset="50%" stopColor="#f59e0b" stopOpacity={1} />
                                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9} />
                              </linearGradient>
                              <filter id="cmpLineGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" vertical={false} strokeWidth={1} />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" fontSize={8} fontWeight={700} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
                            <YAxis stroke="rgba(255,255,255,0.12)" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} width={30} domain={[0, 'dataMax + 10']} tickFormatter={v => `${v}`} />
                            <ReferenceLine y={Math.max(...chartData.map(d => recordType === 'all' || recordType === 'weight' ? d.estimated1RM : (d as any)[metricConfig.barKey] ?? 0))} stroke="rgba(251,191,36,0.3)" strokeWidth={1.5} strokeDasharray="6 4"
                              label={{ value: `🏆 ${Math.max(...chartData.map(d => recordType === 'all' || recordType === 'weight' ? d.estimated1RM : (d as any)[metricConfig.barKey] ?? 0))}`, fill: '#fbbf24', fontSize: 10, fontWeight: 800, position: 'right' }} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0].payload as any
                              if (!d) return null
                              const maxBarVal = Math.max(...chartData.map(e => (e as any)[metricConfig.barKey] ?? 0))
                              const isBest = (d as any)[metricConfig.barKey] >= maxBarVal
                              const formatDur = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
                              return (
                                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                  className="bg-gray-950/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-black/40 min-w-[190px]">
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-violet-500/5 pointer-events-none" />
                                  <div className="relative space-y-1.5">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: exerciseColors[d.exerciseName] || '#8b5cf6', boxShadow: `0 0 6px ${exerciseColors[d.exerciseName] || '#8b5cf6'}66` }} />
                                        <span className="text-white font-bold text-xs">{d.exerciseName?.replace(/_/g, ' ') || 'PR'}</span>
                                      </div>
                                      {isBest && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">🏆 PB</span>}
                                    </div>
                                    {recordType === 'all' || recordType === 'weight' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Weight</div>
                                            <div className="text-sm font-bold text-white">{d.weight}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Est 1RM</div>
                                            <div className={`text-sm font-bold ${isBest ? 'text-amber-400' : 'text-emerald-300'}`}>{d.estimated1RM}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.reps} reps</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    ) : recordType === 'reps' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Reps</div>
                                            <div className="text-sm font-bold text-emerald-400">{d.reps}<span className="text-[9px] font-normal text-gray-500 ml-0.5">reps</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Weight</div>
                                            <div className="text-sm font-bold text-white">{d.weight}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.estimated1RM} est 1RM</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    ) : recordType === 'volume' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Volume</div>
                                            <div className="text-sm font-bold text-violet-400">{d.volume?.toLocaleString()}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Weight</div>
                                            <div className="text-sm font-bold text-white">{d.weight}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.reps} reps</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    ) : recordType === 'endurance' ? (
                                      <>
                                        <div className="grid grid-cols-1 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Duration</div>
                                            <div className="text-sm font-bold text-cyan-400">{formatDur(d.duration)}<span className="text-[9px] font-normal text-gray-500 ml-1">min:sec</span></div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.weight} lbs · {d.reps} reps</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    ) : recordType === 'speed' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Distance</div>
                                            <div className="text-sm font-bold text-amber-400">{d.distance?.toFixed(1) ?? '—'}<span className="text-[9px] font-normal text-gray-500 ml-0.5">mi</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Duration</div>
                                            <div className="text-sm font-bold text-white">{formatDur(d.duration)}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.distance && d.duration > 0 ? `${(d.distance / (d.duration / 3600)).toFixed(1)} mph` : '—'}</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Weight</div>
                                            <div className="text-sm font-bold text-white">{d.weight}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Est 1RM</div>
                                            <div className={`text-sm font-bold ${isBest ? 'text-amber-400' : 'text-emerald-300'}`}>{d.estimated1RM}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-gray-500">{d.reps} reps</span>
                                          <span className="text-gray-500">{d.date}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                            <Bar dataKey={metricConfig.barKey} radius={[6, 6, 0, 0]} maxBarSize={32} animationDuration={800} animationEasing="ease-out">
                              {chartData.map((entry, idx) => {
                                const maxVal = Math.max(...chartData.map(e => (e as any)[metricConfig.barKey] ?? 0))
                                const isBest = (entry as any)[metricConfig.barKey] >= maxVal
                                return <Cell key={idx} fill={`url(#cmpBar_${entry.exerciseName.replace(/\s/g, '_')})`} filter={isBest ? 'url(#cmpLineGlow)' : undefined} stroke={isBest ? '#fbbf24' : 'rgba(255,255,255,0.04)'} strokeWidth={isBest ? 1.5 : 0} />
                              })}
                            </Bar>
                            <Line type="monotone" dataKey="estimated1RM" stroke="url(#cmpLineGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#fbbf24', stroke: '#0f172a', strokeWidth: 3, filter: 'url(#cmpLineGlow)' }} connectNulls animationDuration={800} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log your first PR to see trends</div>
                      )
                    )}
                    {chartTab === 'progression' && (
                      progressionRadarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" key={`prog-${dataVersion}`}>
                          <RadarChart data={progressionRadarData} cx="50%" cy="50%" outerRadius="72%">
                            <defs>
                              <linearGradient id="radarRatioFill" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="50%" stopColor="#a855f7" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.04} />
                              </linearGradient>
                              <linearGradient id="radarRatioStroke" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.7} />
                              </linearGradient>
                              <filter id="radarDotGlow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            <PolarGrid stroke="rgba(255,255,255,0.05)" gridType="circle" />
                            <PolarAngleAxis dataKey="exercise" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
                            <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickFormatter={v => recordType === 'all' || recordType === 'weight' ? `${v}x` : `${v}`} />
                            <Radar name={metricConfig.progLabel} dataKey={metricConfig.progKey} stroke="url(#radarRatioStroke)" fill="url(#radarRatioFill)" strokeWidth={2.5}
                              dot={{ r: 3.5, fill: '#a78bfa', stroke: '#7c3aed', strokeWidth: 2, filter: 'url(#radarDotGlow)' }}
                              activeDot={{ r: 7, fill: '#c4b5fd', stroke: '#7c3aed', strokeWidth: 3, filter: 'url(#radarDotGlow)' }} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0]?.payload as any
                              if (!d) return null
                              const lmap: Record<string, string> = { Elite: '#f59e0b', Advanced: '#ef4444', Intermediate: '#8b5cf6', Novice: '#10b981', Untrained: '#6b7280' }
                              const formatDur = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
                              return (
                                <motion.div initial={{ opacity: 0, scale: 0.88, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className="bg-gray-950/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-black/40 min-w-[190px]">
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
                                  <div className="relative space-y-2">
                                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}66` }} />
                                        <span className="text-white font-bold text-xs">{d.exercise}</span>
                                      </div>
                                    </div>
                                    {recordType === 'all' || recordType === 'weight' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Ratio</div>
                                            <div className="text-sm font-bold text-white">{d.ratio}x <span className="text-[9px] font-normal text-gray-500">BW</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">1RM</div>
                                            <div className="text-sm font-bold text-violet-300">{d.current}<span className="text-[9px] font-normal text-gray-500"> lbs</span></div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                        <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: d.gain > 0 ? 'rgba(16,185,129,0.08)' : d.gain < 0 ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${d.gain > 0 ? 'rgba(16,185,129,0.2)' : d.gain < 0 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                                          <span className="text-gray-400 text-[10px] font-semibold">Change</span>
                                          <span className={`font-bold text-[11px] ${d.gain > 0 ? 'text-emerald-400' : d.gain < 0 ? 'text-rose-400' : 'text-gray-400'}`}>
                                            {d.gain >= 0 ? '+' : ''}{d.gain} lbs
                                          </span>
                                        </div>
                                      </>
                                    ) : recordType === 'reps' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Max Reps</div>
                                            <div className="text-sm font-bold text-emerald-400">{d.maxReps}<span className="text-[9px] font-normal text-gray-500"> reps</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Est 1RM</div>
                                            <div className="text-sm font-bold text-violet-300">{d.current}<span className="text-[9px] font-normal text-gray-500"> lbs</span></div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                      </>
                                    ) : recordType === 'volume' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Max Volume</div>
                                            <div className="text-sm font-bold text-violet-400">{d.maxVolume?.toLocaleString()}<span className="text-[9px] font-normal text-gray-500"> lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Est 1RM</div>
                                            <div className="text-sm font-bold text-violet-300">{d.current}<span className="text-[9px] font-normal text-gray-500"> lbs</span></div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                      </>
                                    ) : recordType === 'endurance' ? (
                                      <>
                                        <div className="grid grid-cols-1 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Max Duration</div>
                                            <div className="text-sm font-bold text-cyan-400">{formatDur(d.maxDuration)}<span className="text-[9px] font-normal text-gray-500 ml-1">min:sec</span></div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                      </>
                                    ) : recordType === 'speed' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Max Speed</div>
                                            <div className="text-sm font-bold text-amber-400">{d.maxSpeed?.toFixed(1)}<span className="text-[9px] font-normal text-gray-500"> mph</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Max Duration</div>
                                            <div className="text-sm font-bold text-cyan-400">{formatDur(d.maxDuration)}</div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                      </>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">Ratio</div>
                                            <div className="text-sm font-bold text-white">{d.ratio}x <span className="text-[9px] font-normal text-gray-500">BW</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[8px] text-gray-500 mb-0.5 font-semibold">1RM</div>
                                            <div className="text-sm font-bold text-violet-300">{d.current}<span className="text-[9px] font-normal text-gray-500"> lbs</span></div>
                                          </div>
                                        </div>
                                        {d.level ? (
                                          <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${(lmap[d.level] || '#6b7280')}12`, border: `1px solid ${(lmap[d.level] || '#6b7280')}20` }}>
                                            <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                            <span className={`font-bold text-[11px] capitalize`} style={{ color: lmap[d.level] || '#6b7280' }}>{d.level}</span>
                                          </div>
                                        ) : null}
                                      </>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mb-3">
                            <BarChart3 className="w-7 h-7 text-emerald-400/30" />
                          </div>
                          <p className="text-gray-400 text-sm font-medium mb-1">No progression data yet</p>
                          <p className="text-gray-500 text-xs max-w-[200px]">Log PRs to see your strength progression over time</p>
                        </div>
                      )
                    )}
                    {chartTab === 'matrix' && (
                      strengthMatrix.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" key={`mat-${dataVersion}`}>
                          <BarChart data={[...strengthMatrix].sort((a, b) => (b as any)[metricConfig.matrixKey] - (a as any)[metricConfig.matrixKey])} layout="vertical" barGap={2} barCategoryGap="16%" margin={{ left: 72, right: 16, top: 4, bottom: 4 }}>
                            <defs>
                              {strengthMatrix.map((m, i) => (
                                <linearGradient key={i} id={`hBarGrad_${i}`} x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor={m.color} stopOpacity={0.92} />
                                  <stop offset="60%" stopColor={m.color} stopOpacity={0.65} />
                                  <stop offset="100%" stopColor={m.color} stopOpacity={0.12} />
                                </linearGradient>
                              ))}
                              <filter id="hBarBestGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" horizontal={false} strokeWidth={1} />
                            <XAxis type="number" stroke="rgba(255,255,255,0.12)" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={[0, 'dataMax + 15']} tickFormatter={v => `${v}`} />
                            <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} width={70} tickFormatter={v => v.replace(/_/g, ' ')} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0]?.payload as any
                              if (!d) return null
                              const lmap: Record<string, string> = { novice: '#10b981', intermediate: '#f59e0b', advanced: '#f43f5e', elite: '#8b5cf6' }
                              const elMap: Record<string, string> = { novice: '🟢', intermediate: '🟡', advanced: '🔴', elite: '🟣' }
                              const idx = strengthMatrix.findIndex(m => m.name === d.name)
                              const avg = strengthMatrix.reduce((s, m) => s + ((m as any)[metricConfig.matrixKey] ?? 0), 0) / strengthMatrix.length
                              const formatDur = (s: number) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}` }
                              return (
                                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                  className="bg-gray-950/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-4 py-3.5 text-[11px] shadow-2xl shadow-black/40 min-w-[190px]">
                                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
                                  <div className="relative space-y-2">
                                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
                                      <span className="text-white font-bold text-xs flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}66` }} />
                                        {d.name.replace(/_/g, ' ')}
                                      </span>
                                      {idx === 0 && <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">🏆 #1</span>}
                                    </div>
                                    {recordType === 'all' || recordType === 'weight' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">1RM</div>
                                            <div className="text-sm font-bold text-white">{d.best1RM}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">vs Avg</div>
                                            <div className={`text-sm font-bold ${(d as any)[metricConfig.matrixKey] >= avg ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {(d as any)[metricConfig.matrixKey] >= avg ? '+' : ''}{Math.round((d as any)[metricConfig.matrixKey] - avg)}
                                            </div>
                                          </div>
                                        </div>
                                        {d.level && <div className="flex items-center justify-between rounded-lg px-3 py-1.5" style={{ backgroundColor: `${lmap[d.level.toLowerCase()] || '#6b7280'}12`, border: `1px solid ${lmap[d.level.toLowerCase()] || '#6b7280'}20` }}>
                                          <span className="text-gray-400 text-[10px] font-semibold">Level</span>
                                          <span className="font-bold capitalize text-[11px]" style={{ color: lmap[d.level.toLowerCase()] || '#6b7280' }}>
                                            {elMap[d.level.toLowerCase()] || '⚪'} {d.level}
                                          </span>
                                        </div>}
                                      </>
                                    ) : recordType === 'reps' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Max Reps</div>
                                            <div className="text-sm font-bold text-emerald-400">{d.maxReps}<span className="text-[9px] font-normal text-gray-500 ml-0.5">reps</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">vs Avg</div>
                                            <div className={`text-sm font-bold ${(d as any)[metricConfig.matrixKey] >= avg ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {(d as any)[metricConfig.matrixKey] >= avg ? '+' : ''}{Math.round((d as any)[metricConfig.matrixKey] - avg)}
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    ) : recordType === 'volume' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Max Volume</div>
                                            <div className="text-sm font-bold text-violet-400">{d.maxVolume?.toLocaleString()}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">vs Avg</div>
                                            <div className={`text-sm font-bold ${(d as any)[metricConfig.matrixKey] >= avg ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {(d as any)[metricConfig.matrixKey] >= avg ? '+' : ''}{Math.round((d as any)[metricConfig.matrixKey] - avg)}
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    ) : recordType === 'endurance' ? (
                                      <>
                                        <div className="grid grid-cols-1 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Max Duration</div>
                                            <div className="text-sm font-bold text-cyan-400">{formatDur(d.maxDuration)}<span className="text-[9px] font-normal text-gray-500 ml-1">min:sec</span></div>
                                          </div>
                                        </div>
                                      </>
                                    ) : recordType === 'speed' ? (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Max Speed</div>
                                            <div className="text-sm font-bold text-amber-400">{d.maxSpeed?.toFixed(1)}<span className="text-[9px] font-normal text-gray-500 ml-0.5">mph</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">Max Duration</div>
                                            <div className="text-sm font-bold text-cyan-400">{formatDur(d.maxDuration)}</div>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">1RM</div>
                                            <div className="text-sm font-bold text-white">{d.best1RM}<span className="text-[9px] font-normal text-gray-500 ml-0.5">lbs</span></div>
                                          </div>
                                          <div className="rounded-lg bg-white/[0.03] p-2 text-center border border-white/[0.04]">
                                            <div className="text-[9px] text-gray-500 mb-0.5">vs Avg</div>
                                            <div className={`text-sm font-bold ${(d as any)[metricConfig.matrixKey] >= avg ? 'text-emerald-400' : 'text-rose-400'}`}>
                                              {(d as any)[metricConfig.matrixKey] >= avg ? '+' : ''}{Math.round((d as any)[metricConfig.matrixKey] - avg)}
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    <div className="text-center text-[9px] text-gray-500">Rank #{idx + 1} of {strengthMatrix.length}</div>
                                  </div>
                                </motion.div>
                              )
                            }} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                            <Bar dataKey={metricConfig.matrixKey} radius={[0, 8, 8, 0]} maxBarSize={22} animationDuration={800} animationEasing="ease-out">
                              {[...strengthMatrix].sort((a, b) => (b as any)[metricConfig.matrixKey] - (a as any)[metricConfig.matrixKey]).map((entry, idx) => {
                                const origIdx = strengthMatrix.indexOf(entry)
                                return <Cell key={idx} fill={`url(#hBarGrad_${origIdx})`} filter={idx === 0 ? 'url(#hBarBestGlow)' : undefined} stroke={idx === 0 ? '#fbbf24' : 'rgba(255,255,255,0.04)'} strokeWidth={idx === 0 ? 1.5 : 0} />
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mb-3">
                            <Target className="w-7 h-7 text-violet-400/30" />
                          </div>
                          <p className="text-gray-400 text-sm font-medium mb-1">No strength matrix yet</p>
                          <p className="text-gray-500 text-xs max-w-[200px]">Log your first PR to see your strength matrix</p>
                        </div>
                      )
                    )}

                </div>
              </div>
              

              {/* Stats strip */}
              {(() => {
                if (chartTab === 'prs' && chartData.length > 0) {
                  const values = chartData.map(d => (d as any)[metricConfig.barKey] ?? 0)
                  const avgV = values.reduce((s, v) => s + v, 0) / values.length
                  const maxV = Math.max(...values)
                  const lastV = values[values.length - 1] ?? 0
                  const best1RMVal = Math.max(...chartData.map(d => d.estimated1RM ?? 0))
                  const pctChange = values.length > 1 ? ((lastV - values[0]) / values[0] * 100).toFixed(1) : null
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-rose-500/3 via-transparent to-violet-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>📊 Avg <span className="font-semibold text-rose-400">{recordType === 'endurance' ? formatDur(avgV) : avgV.toFixed(1)}</span></span>
                        <span>🏆 Peak <span className="font-semibold text-amber-400">{recordType === 'endurance' ? formatDur(maxV) : maxV.toFixed(1)}</span></span>
                        <span>⚡ Best 1RM <span className="font-semibold text-violet-400">{best1RMVal}</span></span>
                        <span>📋 Latest <span className="font-semibold text-cyan-400">{recordType === 'endurance' ? formatDur(lastV) : lastV.toFixed(1)}</span></span>
                        {pctChange !== null && <span>📈 Trend <span className={`font-semibold ${Number(pctChange) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{pctChange}%</span></span>}
                        <span>📝 Entries <span className="font-semibold text-indigo-400">{chartData.length}</span></span>
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-rose-500 via-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(records.length / 30 * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                if (chartTab === 'progression' && strengthProgression.exercises.length > 0) {
                  const totalEx = strengthProgression.exercises.length
                  const totalData = strengthProgression.data.length
                  const latestPoint = strengthProgression.data[strengthProgression.data.length - 1] ?? {}
                  const ranked = strengthProgression.exercises
                    .map(ex => ({ ex, val: (latestPoint[ex] as number) || 0 }))
                    .filter(e => e.val > 0)
                    .sort((a, b) => b.val - a.val)
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-transparent to-violet-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>🏋️ Exercises <span className="font-semibold text-emerald-400">{totalEx}</span></span>
                        <span>📊 Sessions <span className="font-semibold text-gray-300">{totalData}</span></span>
                        <span>🥇 Top <span className="font-semibold text-amber-400">{ranked[0]?.ex || '—'}</span></span>
                        {ranked.length > 1 && <span>🥈 <span className="font-semibold text-gray-400">{ranked[1]?.ex || '—'}</span></span>}
                        {ranked.length > 0 && <span>🏆 {ranked[0]?.val} <span className="text-gray-500 font-normal">lbs</span></span>}
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(totalEx / 8 * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                if (chartTab === 'matrix' && strengthMatrix.length > 0) {
                  const avg1RM = Math.round(strengthMatrix.reduce((s, m) => s + m.best1RM, 0) / strengthMatrix.length)
                  const max1RM = strengthMatrix[0].best1RM
                  const maxName = strengthMatrix[0].name
                  const totals = { novice: 0, intermediate: 0, advanced: 0, elite: 0, untrained: 0 }
                  for (const m of strengthMatrix) {
                    const key = (m.level.toLowerCase() in totals ? m.level.toLowerCase() : 'untrained') as keyof typeof totals
                    totals[key]++
                  }
                  return (
                    <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                      <div className="relative flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                        <span>🎯 Exercises <span className="font-semibold text-violet-400">{strengthMatrix.length}</span></span>
                        <span>📊 Avg 1RM <span className="font-semibold text-gray-300">{avg1RM}</span></span>
                        <span>🏆 Best <span className="font-semibold text-amber-400">{maxName} ({max1RM})</span></span>
                        {totals.elite > 0 && <span>🟣 Elite <span className="font-semibold text-violet-400">{totals.elite}</span></span>}
                        {totals.advanced > 0 && <span>🔴 Adv <span className="font-semibold text-rose-400">{totals.advanced}</span></span>}
                        {totals.intermediate > 0 && <span>🟡 Int <span className="font-semibold text-amber-400">{totals.intermediate}</span></span>}
                        {totals.novice > 0 && <span>🟢 Nov <span className="font-semibold text-emerald-400">{totals.novice}</span></span>}
                      </div>
                      <div className="relative h-0.5 bg-white/[0.03]">
                        <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 via-rose-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((totals.advanced + totals.elite) / Math.max(strengthMatrix.length, 1) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </motion.div>
        )}
        
      {/* Achievements Panel */}
      {showAchievements && records.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-xl p-5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-yellow-500/3 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-5 pb-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/10">
                    <Trophy className="w-5 h-5 text-amber-300" />
                  </div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-gray-950 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">{earned.size}</span>
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Achievements</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{earned.size} of {ACHIEVEMENT_DEFS.length} unlocked</p>
                </div>
              </div>
              <div className="relative">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke="url(#achRingGrad)" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${(earned.size / ACHIEVEMENT_DEFS.length) * 97} 97`}
                    initial={{ strokeDasharray: '0 97' }} animate={{ strokeDasharray: `${(earned.size / ACHIEVEMENT_DEFS.length) * 97} 97` }}
                    transition={{ duration: 1, ease: 'easeOut' }} />
                  <defs>
                    <linearGradient id="achRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {Math.round((earned.size / ACHIEVEMENT_DEFS.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Filter pills */}
            <div className="relative flex flex-wrap gap-1.5 mb-4">
              {[{ key: 'all', label: 'All', icon: '✦', gradient: 'from-white/20 to-white/5', text: 'text-white' }, ...ACHIEVEMENT_TIERS].map(tier => {
                const isAll = tier.key === 'all'
                const isActive = achTab === tier.key
                const tDefs = isAll ? ACHIEVEMENT_DEFS : ACHIEVEMENT_DEFS.filter(d => d.tier === tier.key)
                const tDone = tDefs.filter(d => earned.has(d.id)).length
                return (
                  <motion.button key={tier.key} onClick={() => setAchTab(tier.key)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                    className={`relative px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? isAll ? 'bg-white/10 text-white border border-white/15 shadow-sm' : `${tier.text} border-current/25 bg-current/12 shadow-sm shadow-current/8`
                        : 'bg-white/[0.03] text-gray-600 border border-white/[0.06] hover:text-gray-400 hover:border-white/[0.12]'
                    }`}
                    style={isActive && !isAll ? { boxShadow: `0 0 10px currentColor, 0 0 20px currentColor` } : {}}>
                    <span className="mr-1.5">{isAll ? '✦' : tier.icon}</span>
                    {tier.label}
                    <span className={`ml-1.5 font-bold ${isActive ? 'opacity-70' : 'text-gray-700'}`}>{tDone}</span>
                  </motion.button>
                )
              })}
            </div>

            {/* Achievement grid */}
            <div className="max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ACHIEVEMENT_DEFS.filter(a => achTab === 'all' || a.tier === achTab).map((ach, ai) => {
                  const tierMeta = ACHIEVEMENT_TIERS.find(t => t.key === ach.tier)!
                  const isUnlocked = earned.has(ach.id)
                  const stats = { prCount: records.length, totalVolume, exercises: exercises.length, bestRatio: Math.max(0, ...strengthLevels.map(s => s.ratio)), streak: new Set(records.map(r => r.date)).size, hasAdvanced: hasAdvancedTier }
                  const prog = ach.progress?.(stats)
                  const pct = prog ? Math.min(100, Math.round((prog.current / prog.target) * 100)) : isUnlocked ? 100 : 0
                  const IconComponent = ACHIEVEMENT_ICON_MAP[ach.icon]
                  return (
                    <motion.div key={ach.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ai * 0.025, ease: 'easeOut' }}
                      layout className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-white/[0.04] border-white/[0.08]'
                          : pct > 0
                          ? 'bg-white/[0.02] border-white/[0.06]'
                          : 'bg-white/[0.01] border-white/[0.03] opacity-35'
                      }`}>
                      {/* Tier accent bar */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tierMeta.gradient}`} />
                      {/* Tier dot */}
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current opacity-40" style={{ color: tierMeta.key === 'milestones' ? '#f59e0b' : tierMeta.key === 'volume' ? '#10b981' : tierMeta.key === 'variety' ? '#8b5cf6' : tierMeta.key === 'strength' ? '#f43f5e' : '#06b6d4' }} />
                      <div className="p-3 pt-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            isUnlocked
                              ? 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20'
                              : 'bg-white/[0.04] ring-1 ring-white/[0.06]'
                          }`}>
                            <IconComponent className={`w-3.5 h-3.5 ${isUnlocked ? 'text-amber-300' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-[10px] font-bold leading-tight truncate ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                              {isUnlocked && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                            </div>
                            <p className={`text-[7px] leading-tight line-clamp-2 ${isUnlocked ? 'text-gray-500' : 'text-gray-600'}`}>{ach.description}</p>
                            {!isUnlocked && prog && (
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className={`text-[7px] font-bold ${tierMeta.text}`}>{pct}%</span>
                                  <span className="text-[6px] text-gray-600">{prog.current}/{prog.target}</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    className={`h-full rounded-full bg-gradient-to-r ${tierMeta.gradient} transition-all duration-700`} />
                                </div>
                              </div>
                            )}
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
        
      {/* PR Exercise Cards — with ranking integrated */}
      {records.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-10 text-center">
          <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">No Records Yet</h3>
          <p className="text-gray-400 mb-1">Time to crush some PRs!</p>
          <Button variant="primary" onClick={() => { setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', rpe: 0, sets: '', duration: '', distance: '', contextTags: [], goalWeight: '', goalReps: '', goalVolume: '', notes: '' }); setEditingRecord(null); setShowModal(true) }} className="mt-4">
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
            const best1RMVal = Math.max(...recs.map(r => estimate1RM(r.weight, r.reps)))
            const totalPRs = recs.length
            const latestPR = recs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            const goals = recs.filter(r => r.goalWeight || r.goalReps || r.goalVolume)
            return (
              <motion.div key={exercise} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/8 to-transparent p-4 shadow-lg shadow-black/20">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  {/* Header with rank */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/15 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{exercise}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {(() => { const rank = prLeaderboard.findIndex(([n]) => n === exercise); if (rank >= 0) return <span className={`text-[10px] ${rank === 0 ? '' : 'opacity-40'}`}>{['🥇','🥈','🥉'][rank] || `#${rank + 1}`}</span> })()}
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-amber-400">{totalPRs}</p>
                        <p className="text-[7px] text-gray-600 uppercase tracking-wider">PRs</p>
                      </div>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2 text-center">
                      <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-0.5">Weight</p>
                      <p className="text-xs font-bold text-amber-300">{bestW}</p>
                      <p className="text-[6px] text-gray-600">lbs</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2 text-center">
                      <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-0.5">Reps</p>
                      <p className="text-xs font-bold text-purple-300">{bestR}</p>
                      <p className="text-[6px] text-gray-600">reps</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2 text-center">
                      <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-0.5">Volume</p>
                      <p className="text-xs font-bold text-emerald-300">{bestV.toLocaleString()}</p>
                      <p className="text-[6px] text-gray-600">lbs</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2 text-center">
                      <p className="text-[7px] text-gray-500 uppercase tracking-wider mb-0.5">1RM</p>
                      <p className="text-xs font-bold text-violet-300">{best1RMVal}</p>
                      <p className="text-[6px] text-gray-600">est.</p>
                    </div>
                  </div>
                  {/* Recent info */}
                  {latestPR && (
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] text-gray-600">
                      <span className="text-[8px] opacity-60">Latest:</span>
                      <span className="text-gray-500">{new Date(latestPR.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-500">{latestPR.weight}lbs × {latestPR.reps}</span>
                      <button onClick={(e) => { e.stopPropagation(); setFormData({ exerciseName: latestPR.exerciseName, weight: String(latestPR.weight), reps: String(latestPR.reps), date: latestPR.date, type: latestPR.type || 'weight', rpe: latestPR.rpe || 0, sets: String(latestPR.sets || ''), duration: String(latestPR.duration || ''), distance: String(latestPR.distance || ''), contextTags: latestPR.contextTags || [], goalWeight: String(latestPR.goalWeight || ''), goalReps: String(latestPR.goalReps || ''), goalVolume: String(latestPR.goalVolume || ''), notes: latestPR.notes || '' }); setEditingRecord(latestPR); setShowModal(true) }}
                        className="ml-auto p-1 rounded-md hover:bg-white/[0.06] text-gray-600 hover:text-amber-400 transition-colors" title="Edit">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={async (e) => { e.stopPropagation(); if (window.confirm(`Delete this PR — ${latestPR.weight}lbs × ${latestPR.reps} on ${new Date(latestPR.date).toLocaleDateString()}?`)) { await deletePersonalRecord(latestPR.id) } }}
                        className="p-1 rounded-md hover:bg-white/[0.06] text-gray-600 hover:text-rose-400 transition-colors" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {/* Goals — merged display */}
                  {goals.length > 0 && (
                    <div className="mt-3 space-y-2 pt-3 border-t border-white/[0.04]">
                      {goals.map(g => {
                        const goalConfig = g.goalWeight ? { label: `${g.goalWeight}lbs`, current: g.weight, target: g.goalWeight, color: 'from-amber-500 to-amber-400', doneColor: 'bg-emerald-500', icon: 'text-amber-400' }
                          : g.goalReps ? { label: `${g.goalReps} reps`, current: g.reps, target: g.goalReps, color: 'from-purple-500 to-purple-400', doneColor: 'bg-emerald-500', icon: 'text-purple-400' }
                          : g.goalVolume ? { label: `${g.goalVolume.toLocaleString()} vol`, current: g.weight * g.reps, target: g.goalVolume, color: 'from-emerald-500 to-emerald-400', doneColor: 'bg-emerald-500', icon: 'text-emerald-400' }
                          : null
                        if (!goalConfig) return null
                        const pct = Math.min(100, Math.round((goalConfig.current / goalConfig.target) * 100))
                        const achieved = pct >= 100
                        return (
                          <div key={g.id}>
                            <div className="flex justify-between text-[9px] mb-1">
                              <span className="text-gray-500 flex items-center gap-1"><Target className={`w-2.5 h-2.5 ${goalConfig.icon}`} />Goal {goalConfig.label}</span>
                              <span className={`font-semibold ${achieved ? 'text-emerald-400' : 'text-gray-500'}`}>
                                {achieved && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5 text-emerald-400" />}{pct}%
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${achieved ? goalConfig.doneColor : `bg-gradient-to-r ${goalConfig.color}`} transition-all duration-700`} />
                            </div>
                          </div>
                        )
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
            onClick={() => { setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', rpe: 0, sets: '', duration: '', distance: '', contextTags: [], goalWeight: '', goalReps: '', goalVolume: '', notes: '' }); setEditingRecord(null); setShowModal(false) }}
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
                      <h3 className="text-base font-bold text-white tracking-tight">{editingRecord ? 'Edit PR' : 'Log Achievement'}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{editingRecord ? `Updating ${editingRecord.exerciseName} — ${editingRecord.weight}lbs × ${editingRecord.reps}` : 'Record what you crushed today'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1 custom-scrollbar">
                    {/* Exercise (kept, essential) */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-amber-500/15 flex items-center justify-center">
                            <Dumbbell className="w-3 h-3 text-amber-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-300/70">Exercise</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent" />
                        </div>
                        <input type="text" value={formData.exerciseName}
                          onChange={e => setFormData({ ...formData, exerciseName: e.target.value })}
                          placeholder="e.g., Bench Press"
                          list="exercise-list"
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-amber-500/25 hover:border-white/[0.15]" />
                        <datalist id="exercise-list">{exercises.map(ex => <option key={ex} value={ex} />)}</datalist>
                      </div>
                    </div>

                    {/* PR Type — full-width visual cards */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center">
                            <Target className="w-3 h-3 text-violet-300" />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-300/70">Record Type</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-500/20 via-violet-500/5 to-transparent" />
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { value: 'weight' as const, label: 'Weight', icon: '🏋️', active: 'bg-amber-500/15 border-amber-500/40', inactive: 'border-white/[0.06]' },
                            { value: 'reps' as const, label: 'Reps', icon: '🔥', active: 'bg-purple-500/15 border-purple-500/40', inactive: 'border-white/[0.06]' },
                            { value: 'volume' as const, label: 'Volume', icon: '📊', active: 'bg-emerald-500/15 border-emerald-500/40', inactive: 'border-white/[0.06]' },
                            { value: 'endurance' as const, label: 'Endurance', icon: '⏱️', active: 'bg-cyan-500/15 border-cyan-500/40', inactive: 'border-white/[0.06]' },
                            { value: 'speed' as const, label: 'Speed', icon: '⚡', active: 'bg-rose-500/15 border-rose-500/40', inactive: 'border-white/[0.06]' },
                          ].map(({ value, label, icon, active, inactive }) => (
                            <motion.button key={value} type="button"
                              whileTap={{ scale: 0.93 }}
                              onClick={() => setFormData({ ...formData, type: value })}
                              className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-all ${formData.type === value ? active : `bg-white/[0.03] ${inactive} hover:border-white/[0.15]`}`}>
                              <span className="text-base leading-none">{icon}</span>
                              <span className={`text-[7px] font-bold uppercase tracking-wider ${formData.type === value ? 'text-white' : 'text-gray-500'}`}>{label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic fields based on type */}
                    {formData.type !== 'endurance' && formData.type !== 'speed' && (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                        <div className="rounded-xl bg-gray-900/60 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Weight <span className="text-gray-600">(lbs)</span></label>
                              <input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                placeholder="0" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Reps</label>
                              <input type="number" value={formData.reps} onChange={e => setFormData({ ...formData, reps: e.target.value })}
                                placeholder="0" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.type === 'endurance' && (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                        <div className="rounded-xl bg-gray-900/60 p-3">
                          <label className="block text-[10px] font-semibold text-gray-500 mb-1">Duration <span className="text-gray-600">(seconds)</span></label>
                          <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                            placeholder="e.g., 120" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/25 hover:border-white/[0.15]" />
                        </div>
                      </div>
                    )}

                    {formData.type === 'speed' && (
                      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                        <div className="rounded-xl bg-gray-900/60 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Distance <span className="text-gray-600">(m)</span></label>
                              <input type="number" value={formData.distance} onChange={e => setFormData({ ...formData, distance: e.target.value })}
                                placeholder="e.g., 100" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-rose-500/25 hover:border-white/[0.15]" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-1">Time <span className="text-gray-600">(s)</span></label>
                              <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="e.g., 9.8" step="0.01" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-rose-500/25 hover:border-white/[0.15]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RPE - effort selector, dynamic by type */}
                    {(() => {
                      const rpeConfigs: Record<string, { icon: string; label: string; thresholds: { max: number; label: string; color: string }[] }> = {
                        weight: {
                          icon: '🏋️', label: 'Lift Intensity',
                          thresholds: [
                            { max: 3, label: 'Warmup', color: 'text-emerald-400' },
                            { max: 5, label: 'Light', color: 'text-sky-400' },
                            { max: 7, label: 'Moderate', color: 'text-amber-400' },
                            { max: 9, label: 'Grinder', color: 'text-orange-400' },
                            { max: 10, label: 'Max', color: 'text-rose-400' },
                          ],
                        },
                        reps: {
                          icon: '🔥', label: 'Rep Intensity',
                          thresholds: [
                            { max: 3, label: 'Easy', color: 'text-emerald-400' },
                            { max: 5, label: 'Controlled', color: 'text-sky-400' },
                            { max: 7, label: 'Challenging', color: 'text-amber-400' },
                            { max: 9, label: 'Near Failure', color: 'text-orange-400' },
                            { max: 10, label: 'Failure', color: 'text-rose-400' },
                          ],
                        },
                        volume: {
                          icon: '📊', label: 'Work Rate',
                          thresholds: [
                            { max: 3, label: 'Easy', color: 'text-emerald-400' },
                            { max: 5, label: 'Building', color: 'text-sky-400' },
                            { max: 7, label: 'Pushing', color: 'text-amber-400' },
                            { max: 9, label: 'Deep', color: 'text-orange-400' },
                            { max: 10, label: 'Max Volume', color: 'text-rose-400' },
                          ],
                        },
                        endurance: {
                          icon: '⏱️', label: 'Pace Level',
                          thresholds: [
                            { max: 3, label: 'Easy Pace', color: 'text-emerald-400' },
                            { max: 5, label: 'Conversational', color: 'text-sky-400' },
                            { max: 7, label: 'Tempo', color: 'text-amber-400' },
                            { max: 9, label: 'Threshold', color: 'text-orange-400' },
                            { max: 10, label: 'All Out', color: 'text-rose-400' },
                          ],
                        },
                        speed: {
                          icon: '⚡', label: 'Speed Intensity',
                          thresholds: [
                            { max: 3, label: 'Jog', color: 'text-emerald-400' },
                            { max: 5, label: 'Stride', color: 'text-sky-400' },
                            { max: 7, label: 'Fast', color: 'text-amber-400' },
                            { max: 9, label: 'Sprint', color: 'text-orange-400' },
                            { max: 10, label: 'Max Speed', color: 'text-rose-400' },
                          ],
                        },
                      }
                      const cfg = rpeConfigs[formData.type] ?? rpeConfigs.weight
                      const activeThreshold = cfg.thresholds.find(t => formData.rpe <= t.max) ?? cfg.thresholds[cfg.thresholds.length - 1]
                      return (
                        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                          <div className="rounded-xl bg-gray-900/60 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[11px]">{cfg.icon}</span>
                              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">{cfg.label}</span>
                              {formData.rpe > 0 && (
                                <span className={`text-[10px] font-bold ml-auto ${activeThreshold.color}`}>
                                  {activeThreshold.label}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                                const t = cfg.thresholds.find(th => n <= th.max) ?? cfg.thresholds[cfg.thresholds.length - 1]
                                return (
                                  <button key={n} type="button"
                                    onClick={() => setFormData({ ...formData, rpe: formData.rpe === n ? 0 : n })}
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                      formData.rpe === n
                                        ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                                        : formData.rpe > n
                                        ? `bg-white/[0.06] ${t.color} border border-white/[0.08]`
                                        : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:border-white/[0.15]'
                                    }`}>
                                    {n}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Sets */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <label className="block text-[10px] font-semibold text-gray-500 mb-1">Sets Performed</label>
                        <input type="number" value={formData.sets} onChange={e => setFormData({ ...formData, sets: e.target.value })}
                          placeholder="1" className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15]" />
                      </div>
                    </div>

                    {/* Context Tags */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px]">🏷️</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">Context</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {['New PR', 'Matched PR', 'Technique Focus', 'Post-Break', 'Peak Week', 'Deload', 'Solo', 'Spotter'].map(tag => {
                            const active = formData.contextTags.includes(tag)
                            return (
                              <button key={tag} type="button" onClick={() => setFormData({
                                ...formData,
                                contextTags: active ? formData.contextTags.filter(t => t !== tag) : [...formData.contextTags, tag],
                              })}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all border ${
                                  active
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                    : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/[0.15]'
                                }`}>
                                {tag}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">Date</span>
                        </div>
                        <input type="date" value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:border-violet-500/50 focus:outline-none transition-all focus:ring-1 focus:ring-violet-500/25 hover:border-white/[0.15] [color-scheme:dark]" />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-[1px]">
                      <div className="rounded-xl bg-gray-900/60 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[11px]">📝</span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-500">Notes</span>
                        </div>
                        <textarea value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="How did it feel? Anything notable..."
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
                      {editingRecord ? 'Update PR' : 'Log Achievement'}
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
