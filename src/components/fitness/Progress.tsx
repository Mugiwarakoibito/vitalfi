import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Plus, Star, TrendingUp, Award, X,
  Dumbbell, Flame, BarChart3, Activity,
  Sparkles, Camera, Target, CheckCircle2, Medal,
  Image, Calendar, Download, Settings, Trash2, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
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
}

interface ProgressPhoto {
  id: string
  date: string
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
const PHOTOS_KEY = 'vitalfi_progress_photos'
const ACHIEVEMENTS_KEY = 'vitalfi_progress_achievements'
const CONFETTI_COLORS = ['#F59E0B', '#A78BFA', '#10B981', '#EF4444', '#3B82F6']

const ACHIEVEMENT_DEFS: { id: string; name: string; icon: keyof typeof ACHIEVEMENT_ICON_MAP; description: string; check: (stats: { prCount: number; totalVolume: number; hasAdvanced: boolean }) => boolean }[] = [
  { id: 'first_pr', name: 'First PR', icon: 'star', description: 'Log your first personal record', check: s => s.prCount >= 1 },
  { id: 'ten_prs', name: '10 PRs', icon: 'award', description: 'Log 10 personal records', check: s => s.prCount >= 10 },
  { id: 'fifty_prs', name: '50 PRs', icon: 'medal', description: 'Log 50 personal records', check: s => s.prCount >= 50 },
  { id: 'hundred_prs', name: '100 PRs', icon: 'trophy', description: 'Log 100 personal records', check: s => s.prCount >= 100 },
  { id: 'volume_master', name: 'Volume Master', icon: 'flame', description: 'Reach 1,000,000 total volume', check: s => s.totalVolume >= 1000000 },
  { id: 'strength_milestone', name: 'Strength Milestone', icon: 'medal', description: 'Reach Advanced tier on any exercise', check: s => s.hasAdvanced },
]

const ACHIEVEMENT_ICON_MAP = {
  star: Star, award: Award, medal: Medal, trophy: Trophy, flame: Flame,
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '14d', label: '14D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'All' },
] as const

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

function exportCSV(records: PR[]) {
  const headers = 'Exercise,Weight,Reps,Volume,Date,Type,GoalWeight,GoalReps,GoalVolume\n'
  const rows = records.map(r =>
    `${r.exerciseName},${r.weight},${r.reps},${r.weight * r.reps},${r.date},${r.type},${r.goalWeight ?? ''},${r.goalReps ?? ''},${r.goalVolume ?? ''}`
  ).join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `vitalfi_prs_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function Progress() {
  const { workouts, bodyMetrics } = useAppStore()
  const [records, setRecords] = useState<PR[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [justAdded, setJustAdded] = useState('')
  const [formData, setFormData] = useState({
    exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0],
    type: 'weight' as 'weight' | 'reps' | 'volume',
    goalWeight: '', goalReps: '', goalVolume: '',
  })
  const [chartMetric, setChartMetric] = useState<'weight' | 'reps' | 'volume'>('weight')
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '14d' | '30d' | 'all'>('all')
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0])
  const [earned, setEarned] = useState<Set<string>>(new Set())
  const [showCharts, setShowCharts] = useState(false)
  const [showStrength, setShowStrength] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showPhotos, setShowPhotos] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecords(JSON.parse(stored))
      const photoStored = localStorage.getItem(PHOTOS_KEY)
      if (photoStored) setPhotos(JSON.parse(photoStored))
      const achStored = localStorage.getItem(ACHIEVEMENTS_KEY)
      if (achStored) setEarned(new Set(JSON.parse(achStored)))
    } catch {}
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)) }, [records])
  useEffect(() => { localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos)) }, [photos])

  const exercises = useMemo(() => [...new Set(records.map(r => r.exerciseName))].sort(), [records])

  useEffect(() => { if (!selectedExercise && exercises.length > 0) setSelectedExercise(exercises[0]) }, [exercises])

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
      }))
  }, [bodyMetrics])

  const volumeTrend = useMemo(() => {
    const sorted = [...workouts].sort((a: Workout, b: Workout) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return sorted.slice(-20).map((w: Workout) => ({
      date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: w.exercises?.reduce((s: number, ex: WorkoutExercise) => s + ex.sets.reduce((st: number, set: ExerciseSet) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0) || 0,
      name: w.name,
    }))
  }, [workouts])

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

  const autoPRs = useMemo(() => {
    const prs: { exercise: string; weight: number; reps: number; volume: number; date: string }[] = []
    workouts.forEach((w: Workout) => {
      w.exercises?.forEach((ex: WorkoutExercise) => {
        ex.sets?.forEach((set: ExerciseSet) => {
          if (set.weight && set.completed !== false) {
            const vol = (set.weight || 0) * (set.reps || 0)
            prs.push({ exercise: ex.name, weight: set.weight, reps: set.reps || 0, volume: vol, date: w.date })
          }
        })
      })
    })
    return prs
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
    if (trendPeriod === 'all') return records
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (trendPeriod === '7d' ? 7 : trendPeriod === '14d' ? 14 : 30))
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return records.filter(r => r.date >= cutoffStr)
  }, [records, trendPeriod])

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
    const newSet = new Set(earned)
    let changed = false
    const stats = { prCount: records.length, totalVolume, hasAdvanced: hasAdvancedTier }
    ACHIEVEMENT_DEFS.forEach(a => {
      if (!newSet.has(a.id) && a.check(stats)) { newSet.add(a.id); changed = true }
    })
    if (changed) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...newSet]))
      setEarned(newSet)
    }
  }, [records.length, totalVolume, hasAdvancedTier])

  const addPhoto = () => {
    const newPhoto: ProgressPhoto = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 15),
      date: photoDate,
    }
    setPhotos(prev => [...prev, newPhoto])
    setShowPhotoModal(false)
    setPhotoDate(new Date().toISOString().split('T')[0])
  }

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
    setRecords(prev => [...prev, newRecord])
    setShowModal(false)
    setFormData({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0], type: 'weight', goalWeight: '', goalReps: '', goalVolume: '' })
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

      {/* Toolbar with icon buttons */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Performance</h2>
          <p className="text-sm text-gray-400 mt-0.5">PRs, strength levels & workout analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showCharts ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowCharts(p => !p)} title="PR Charts">
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
          {strengthLevels.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showStrength ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowStrength(p => !p)} title="Strength Levels">
              <Dumbbell className="w-5 h-5" />
            </button>
          )}
          {records.length > 0 && (
            <button
              className={`p-2 rounded-xl border transition-all ${showAchievements ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowAchievements(p => !p)} title="Achievements">
              <Trophy className="w-5 h-5" />
            </button>
          )}
          <button
            className={`p-2 rounded-xl border transition-all ${showPhotos ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
            onClick={() => setShowPhotos(p => !p)} title="Progress Photos">
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5" />
          </button>
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

      {/* Charts Panel (toggleable) */}
      <AnimatePresence>
        {showCharts && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-[12px] p-4 space-y-6">
            {exercises.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">PR Progress</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                      {PERIOD_OPTIONS.map(p => (
                        <button key={p.value} onClick={() => setTrendPeriod(p.value)}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${trendPeriod === p.value ? 'bg-amber-500/20 text-amber-300' : 'text-gray-500 hover:text-white'}`}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-medium focus:outline-none focus:border-amber-500/40">
                    {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                  <div className="flex gap-1 ml-auto">
                    {(['weight', 'reps', 'volume'] as const).map(m => (
                      <button key={m} onClick={() => setChartMetric(m)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${chartMetric === m ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-white'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey={chartMetric} stroke="#F59E0B" strokeWidth={2.5} dot={{ fill: '#F59E0B', r: 4 }} activeDot={{ r: 6 }} />
                      {chartMetric === 'weight' && (
                        <Line type="monotone" dataKey="estimated1RM" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} opacity={0.5} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {workouts.length >= 7 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Weekly Volume</h4>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyVolumeComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="current" name="This Week" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="prior" name="Last Week" fill="#374151" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px]">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /><span className="text-gray-400">This Week</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-gray-600" /><span className="text-gray-400">Last Week</span></div>
                </div>
              </div>
            )}
            {volumeTrend.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Workout Volume</h4>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {bodyWeightData.length > 1 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Body Weight</h4>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bodyWeightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strength Levels Panel (toggleable) */}
      <AnimatePresence>
        {showStrength && strengthLevels.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-2 mb-4">
              <Medal className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Strength Level Classification</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {strengthLevels.map((sl) => (
                <div key={sl.exercise} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-white">{sl.exercise}</p>
                    <div className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${sl.color}20`, color: sl.color, border: `1px solid ${sl.color}40` }}>
                      {sl.level}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 text-xs text-gray-400">
                    <span>{sl.weight} lbs</span>
                    <span className="text-gray-600">@</span>
                    <span>{sl.bodyWeight} lbs BW</span>
                    <span className="text-gray-600">=</span>
                    <span className="font-semibold" style={{ color: sl.color }}>{sl.ratio}x</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements Panel (toggleable) */}
      <AnimatePresence>
        {showAchievements && records.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-amber-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Achievement Gallery</h4>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                {[...earned].filter(id => ACHIEVEMENT_DEFS.some(a => a.id === id)).length}/{ACHIEVEMENT_DEFS.length}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACHIEVEMENT_DEFS.map((ach) => {
                const isUnlocked = earned.has(ach.id)
                const IconComponent = ACHIEVEMENT_ICON_MAP[ach.icon]
                return (
                  <motion.div key={ach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className={`relative overflow-hidden rounded-xl p-4 text-center border transition-all duration-500 ${
                      isUnlocked
                        ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent shadow-lg shadow-amber-500/5'
                        : 'border-white/[0.04] bg-white/[0.02] opacity-50'
                    }`}>
                    {isUnlocked && (
                      <>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.08),transparent_70%)] pointer-events-none rounded-xl" />
                        <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full -mr-6 -mt-6 blur-md" />
                      </>
                    )}
                    <div className={`relative ${isUnlocked ? '' : 'saturate-0'}`}>
                      <div className={`inline-flex p-2.5 rounded-xl mb-2.5 transition-all duration-500 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-500/25 to-amber-500/10 shadow-lg shadow-amber-500/10'
                          : 'bg-white/[0.03]'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${isUnlocked ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-gray-600'}`} />
                      </div>
                      <p className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{ach.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photos Panel (toggleable) */}
      <AnimatePresence>
        {showPhotos && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-violet-400" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progress Photos</h4>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowPhotoModal(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />Add Photo
              </Button>
            </div>
            {photos.length > 0 ? (
              <div className="space-y-2">
                {[...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((photo) => (
                  <div key={photo.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3 border border-white/5">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center shrink-0">
                      <Image className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Photo from <span className="text-violet-300">{new Date(photo.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>
                    <button onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="ml-auto p-1 text-gray-500 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No progress photos yet — add your first!</p>
            )}
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

      {/* Auto PRs from Workouts */}
      {autoPRs.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-[12px] p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Lifts (from workouts)</h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {autoPRs.slice(-20).reverse().map((pr, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2 text-xs">
                <Dumbbell className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span className="text-gray-400 font-medium min-w-[100px]">{pr.exercise}</span>
                <span className="text-amber-300 font-semibold">{pr.weight}lbs</span>
                <span className="text-gray-600">×</span>
                <span className="text-purple-300 font-semibold">{pr.reps} reps</span>
                <span className="text-gray-600 ml-auto">{new Date(pr.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Personal Record">
        <div className="space-y-4">
          <Input label="Exercise" placeholder="e.g., Bench Press" value={formData.exerciseName}
            onChange={e => setFormData({ ...formData, exerciseName: e.target.value })}
            list="exercise-list" icon={<Dumbbell className="w-4 h-4" />} />
          <datalist id="exercise-list">{exercises.map(ex => <option key={ex} value={ex} />)}</datalist>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Weight (lbs)" type="number" placeholder="0" value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })} />
            <Input label="Reps" type="number" placeholder="0" value={formData.reps}
              onChange={e => setFormData({ ...formData, reps: e.target.value })} />
          </div>
          <Input label="Date" type="date" value={formData.date}
            onChange={e => setFormData({ ...formData, date: e.target.value })} />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {([{ value: 'weight', label: 'Weight PR', icon: Award }, { value: 'reps', label: 'Reps PR', icon: Star }, { value: 'volume', label: 'Volume PR', icon: Flame }] as const).map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setFormData({ ...formData, type: value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                    formData.type === value
                      ? value === 'weight' ? 'border-amber-500/50 bg-amber-500/20' : value === 'reps' ? 'border-purple-500/50 bg-purple-500/20' : 'border-emerald-500/50 bg-emerald-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  } ${formData.type === value ? 'text-white' : 'text-gray-400'}`}>
                  <Icon className={`w-5 h-5 ${formData.type === value ? 'text-inherit' : 'text-gray-500'}`} />
                  <span className="font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-4">
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />Goal Settings <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Target Weight" type="number" placeholder="--" value={formData.goalWeight}
                onChange={e => setFormData({ ...formData, goalWeight: e.target.value })} />
              <Input label="Target Reps" type="number" placeholder="--" value={formData.goalReps}
                onChange={e => setFormData({ ...formData, goalReps: e.target.value })} />
              <Input label="Target Volume" type="number" placeholder="--" value={formData.goalVolume}
                onChange={e => setFormData({ ...formData, goalVolume: e.target.value })} />
            </div>
          </div>
          <Button variant="primary" onClick={saveRecord} className="w-full">
            <Trophy className="w-4 h-4 mr-1.5" />Save Record
          </Button>
        </div>
      </Modal>

      {/* Add Photo Modal */}
      <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)} title="Log Progress Photo">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center border border-violet-500/30">
              <Camera className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-sm text-gray-400 text-center">Enter the date for this progress photo</p>
          </div>
          <Input label="Photo Date" type="date" value={photoDate}
            onChange={e => setPhotoDate(e.target.value)} icon={<Calendar className="w-4 h-4" />} />
          <Button variant="primary" onClick={addPhoto} className="w-full">
            <Image className="w-4 h-4 mr-1.5" />Log Photo
          </Button>
        </div>
      </Modal>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shadow-lg"><Settings className="w-5 h-5 text-amber-400" /></div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Performance Settings</h3>
                    <p className="text-xs text-gray-500">Data management & export</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Export Data</p>
                  <button onClick={() => exportCSV(records)}
                    className="w-full px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Export PRs as CSV
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total PRs</p>
                    <p className="text-lg font-bold text-white mt-1">{records.length}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">Exercises</p>
                    <p className="text-lg font-bold text-white mt-1">{exercises.length}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Data Management</h4>
                  {!confirmClear ? (
                    <button onClick={() => setConfirmClear(true)}
                      className="w-full px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Clear All PR Data
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-red-400/80 text-center">This permanently deletes all PR records and photos.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmClear(false)}
                          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs">Cancel</button>
                        <button onClick={() => { setRecords([]); setPhotos([]); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(PHOTOS_KEY); setConfirmClear(false) }}
                          className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-xs font-semibold">Delete All</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
