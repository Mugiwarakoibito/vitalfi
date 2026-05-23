import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Clock, Dumbbell, Flame, ChevronDown, ChevronUp, Check,
  AlertTriangle, Timer, RotateCcw, Copy, Search, Filter, X, Play, Pause,
  TrendingUp, TrendingDown, Minus, Layers, GripVertical,
  FileText, Activity, Zap, Wind, Settings2, Move, StretchHorizontal,
  PersonStanding, Gauge, Crosshair, Weight, Heart, Shield, Sword, Coffee,
  Equal, Footprints, Waves,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId, formatDuration } from '@/lib/utils'
import { storage } from '@/lib/storage'
import { exerciseLibrary, getExerciseById, getAllMuscleGroups, categoryLabels, muscleGroupColors } from '@/lib/exercises'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { WorkoutExercise, ExerciseSet, WorkoutTemplate, WorkoutFilter, ExerciseCategory, MuscleGroup } from '@/types/fitness'
import type { Workout } from '@/lib/storage'

const typeConfig: Record<string, { icon: any; color: string; bg: string; gradient: string }> = {
  strength: { icon: Dumbbell, color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30', gradient: 'from-rose-500/10 to-transparent' },
  hypertrophy: { icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', gradient: 'from-red-500/10 to-transparent' },
  cardio: { icon: Wind, color: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/30', gradient: 'from-sky-500/10 to-transparent' },
  hiit: { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', gradient: 'from-orange-500/10 to-transparent' },
  functional: { icon: Settings2, color: 'text-teal-400', bg: 'bg-teal-500/20 border-teal-500/30', gradient: 'from-teal-500/10 to-transparent' },
  mobility: { icon: Move, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30', gradient: 'from-emerald-500/10 to-transparent' },
  flexibility: { icon: StretchHorizontal, color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', gradient: 'from-green-500/10 to-transparent' },
  plyo: { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/30', gradient: 'from-violet-500/10 to-transparent' },
  calisthenics: { icon: PersonStanding, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', gradient: 'from-amber-500/10 to-transparent' },
  endurance: { icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', gradient: 'from-blue-500/10 to-transparent' },
  speed_agility: { icon: Gauge, color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', gradient: 'from-yellow-500/10 to-transparent' },
  balance_stability: { icon: Crosshair, color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30', gradient: 'from-cyan-500/10 to-transparent' },
  core: { icon: Weight, color: 'text-orange-400', bg: 'bg-orange-600/20 border-orange-600/30', gradient: 'from-orange-600/10 to-transparent' },
  yoga: { icon: Heart, color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30', gradient: 'from-purple-500/10 to-transparent' },
  pilates: { icon: Activity, color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-500/30', gradient: 'from-pink-500/10 to-transparent' },
  crossfit: { icon: Shield, color: 'text-stone-400', bg: 'bg-stone-500/20 border-stone-500/30', gradient: 'from-stone-500/10 to-transparent' },
  martial_arts: { icon: Sword, color: 'text-red-400', bg: 'bg-red-600/20 border-red-600/30', gradient: 'from-red-600/10 to-transparent' },
  recovery: { icon: Coffee, color: 'text-blue-400', bg: 'bg-blue-400/20 border-blue-400/30', gradient: 'from-blue-400/10 to-transparent' },
  isometric: { icon: Equal, color: 'text-zinc-400', bg: 'bg-zinc-500/20 border-zinc-500/30', gradient: 'from-zinc-500/10 to-transparent' },
  animal_flow: { icon: Footprints, color: 'text-lime-400', bg: 'bg-lime-500/20 border-lime-500/30', gradient: 'from-lime-500/10 to-transparent' },
  breathwork: { icon: Waves, color: 'text-indigo-400', bg: 'bg-indigo-500/20 border-indigo-500/30', gradient: 'from-indigo-500/10 to-transparent' },
}

function calcVolume(exs: WorkoutExercise[]) {
  return exs.reduce((total, ex) => total + ex.sets.reduce((st, set) => st + ((set.weight || 0) * (set.reps || 0)), 0), 0)
}

function getLastVolumeForExercise(exerciseId: string, allWorkouts: Workout[]): number | null {
  const sorted = [...allWorkouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  for (const wo of sorted) {
    const ex = wo.exercises.find((e) => e.exerciseId === exerciseId)
    if (ex) {
      return calcVolume([ex])
    }
  }
  return null
}

function VolumeIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null) return null
  const diff = current - previous
  if (Math.abs(diff) < 1) {
    return <Minus className="w-3.5 h-3.5 text-gray-400" />
  }
  if (diff > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-400 text-xs">
        <TrendingUp className="w-3.5 h-3.5" />
        +{diff.toLocaleString()}kg
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-rose-400 text-xs">
      <TrendingDown className="w-3.5 h-3.5" />
      {diff.toLocaleString()}kg
    </span>
  )
}

function RestTimer({ onComplete }: { onComplete: () => void }) {
  const [remaining, setRemaining] = useState(REST_TIMER_DURATION)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const start = () => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setRunning(false)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }

  const reset = () => {
    stop()
    setRemaining(REST_TIMER_DURATION)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
      <Timer className="w-4 h-4 text-indigo-400" />
      <span className="font-mono text-indigo-200 font-bold tabular-nums min-w-[4ch]">
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      {!running ? (
        <button onClick={start} className="p-1 rounded-md hover:bg-indigo-500/20 text-indigo-400 transition-all">
          <Play className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={stop} className="p-1 rounded-md hover:bg-indigo-500/20 text-indigo-400 transition-all">
          <Pause className="w-4 h-4" />
        </button>
      )}
      <button onClick={reset} className="p-1 rounded-md hover:bg-indigo-500/20 text-indigo-400/60 transition-all">
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ExercisePicker({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ExerciseCategory | ''>('')
  const [muscle, setMuscle] = useState('')
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)
  const [showMuscleGrid, setShowMuscleGrid] = useState(false)
  const muscleOptions = useMemo(() => getAllMuscleGroups(), [])

  const results = useMemo(() => {
    let list = exerciseLibrary
    const q = search.toLowerCase().trim()
    if (q) {
      list = list.filter(
        (ex) => ex.name.toLowerCase().includes(q) || ex.primaryMuscles.some((m) => m.includes(q))
      )
    }
    if (category) {
      list = list.filter((ex) => ex.category === category)
    }
    if (muscle) {
      list = list.filter((ex) => ex.primaryMuscles.includes(muscle as MuscleGroup) || ex.secondaryMuscles.includes(muscle as MuscleGroup))
    }
    return list
  }, [search, category, muscle])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Select Exercise</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <div className="flex-1">
              <button
                onClick={() => setShowCategoryGrid(true)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:border-white/20 transition-all"
              >
                {category ? (
                  <>
                    <span className="text-[10px] font-medium">{categoryLabels[category as ExerciseCategory]}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCategory('') }}
                      className="ml-auto p-0.5 rounded hover:bg-white/10 text-gray-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-500">All categories</span>
                    <ChevronDown className="w-3 h-3 ml-auto text-gray-500" />
                  </>
                )}
              </button>
            </div>
            <div className="flex-1">
              <button
                onClick={() => setShowMuscleGrid(true)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs hover:border-white/20 transition-all"
              >
                {muscle ? (
                  <>
                    <span className={`text-[10px] font-medium ${muscleGroupColors[muscle]?.split(' ')[1] || 'text-gray-300'}`}>
                      {muscle.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMuscle('') }}
                      className="ml-auto p-0.5 rounded hover:bg-white/10 text-gray-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-gray-500">All muscles</span>
                    <ChevronDown className="w-3 h-3 ml-auto text-gray-500" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[50vh] p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">No exercises found</div>
          ) : (
            results.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                className="flex w-full items-center justify-between rounded-xl border border-transparent hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.06] px-4 py-3 text-left transition-all group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white text-sm truncate">{ex.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-300/80">
                      {categoryLabels[ex.category]}
                    </span>
                    {ex.primaryMuscles.slice(0, 2).map((m) => (
                      <span key={m} className={`px-2 py-0.5 rounded text-[10px] font-medium ${muscleGroupColors[m] || 'bg-white/5 text-gray-400'}`}>
                        {m.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-rose-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))
          )}
        </div>
      </motion.div>

      {showCategoryGrid && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={() => setShowCategoryGrid(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Filter by Category</h4>
                <button onClick={() => setShowCategoryGrid(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setCategory(''); setShowCategoryGrid(false) }}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                    category === ''
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <span className="text-xs font-medium">All</span>
                </button>
                {(Object.entries(typeConfig) as [string, typeof typeConfig['strength']][]).map(([key, cfg]) => {
                  const CfgIcon = cfg.icon
                  const isActive = category === key
                  return (
                    <button
                      key={key}
                      onClick={() => { setCategory(key as ExerciseCategory); setShowCategoryGrid(false) }}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                        isActive
                          ? `${cfg.bg} ${cfg.color} border-current`
                          : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? cfg.bg : 'bg-white/5'}`}>
                        <CfgIcon className={`w-3.5 h-3.5 ${isActive ? cfg.color : 'opacity-70'}`} />
                      </div>
                      <span className="text-xs font-medium">{categoryLabels[key as ExerciseCategory]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showMuscleGrid && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={() => setShowMuscleGrid(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Filter by Muscle</h4>
                <button onClick={() => setShowMuscleGrid(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  onClick={() => { setMuscle(''); setShowMuscleGrid(false) }}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                    muscle === ''
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5 opacity-70" />
                  </div>
                  <span className="text-xs font-medium">All</span>
                </button>
                {muscleOptions.map((m) => {
                  const isActive = muscle === m.value
                  const colors = muscleGroupColors[m.value] || 'bg-white/5 text-gray-400'
                  return (
                    <button
                      key={m.value}
                      onClick={() => { setMuscle(m.value); setShowMuscleGrid(false) }}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                        isActive
                          ? `${colors} border-current`
                          : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors}`}>
                        <span className="text-[10px] font-bold">{m.label.charAt(0)}</span>
                      </div>
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function TemplatePicker({ templates, onSelect, onClose }: { templates: WorkoutTemplate[]; onSelect: (template: WorkoutTemplate) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Workout Templates</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1">Quick-start a workout from your past sessions</p>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-3 space-y-2">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No templates yet</p>
              <p className="text-gray-500 text-xs mt-1">Log a workout and it will appear here as a template</p>
            </div>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="flex w-full items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 p-4 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm">{template.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {template.exercises.length} exercises — {template.category ? categoryLabels[template.category as ExerciseCategory] || template.category : 'General'}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white text-center mb-2">{title}</h3>
        <p className="text-gray-400 text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all font-medium">{confirmLabel || 'Delete'}</button>
        </div>
      </motion.div>
    </div>
  )
}

const REST_TIMER_DURATION = 90
const FADE_SLIDE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function WorkoutLogger() {
  const { workouts, addWorkout, deleteWorkout } = useAppStore()
  const derivedTemplates = useMemo(() => {
    const seen = new Map<string, Workout>()
    for (const w of [...workouts].reverse()) {
      if (!w.name || seen.has(w.name)) continue
      seen.set(w.name, w)
    }
    return Array.from(seen.entries()).map(([name, w]) => ({
      id: `template_${w.id}`,
      name,
      category: w.category,
      exercises: w.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        targetSets: e.sets.length,
        targetReps: e.sets[0]?.reps,
      })),
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    })) as WorkoutTemplate[]
  }, [workouts])
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setWorkoutName('')
      setWorkoutType('strength')
      setDuration('')
      setDate(new Date().toISOString().split('T')[0])
      setExercises([])
      setExpandedExercises(new Set())
      setSupersetGroups({})
      setRestTimerExercise(null)
      setShowForm(true)
      const next = new URLSearchParams(searchParams)
      next.delete('add')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])
  const [showForm, setShowForm] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState<Workout['category']>('strength')
  const [duration, setDuration] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null)
  const [supersetGroups, setSupersetGroups] = useState<Record<string, string[]>>({})
  const [restTimerExercise, setRestTimerExercise] = useState<string | null>(null)
  const [templateSaved, setTemplateSaved] = useState(false)

  const [filters, setFilters] = useState<WorkoutFilter>({})
  const [showFilters, setShowFilters] = useState(false)

  const sortedWorkouts = useMemo(() => {
    let list = [...workouts]
    if (filters.category) list = list.filter((w) => w.category === filters.category)
    if (filters.dateFrom) list = list.filter((w) => w.date >= filters.dateFrom!)
    if (filters.dateTo) list = list.filter((w) => w.date <= filters.dateTo!)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.exercises.some((e) => e.name.toLowerCase().includes(q))
      )
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [workouts, filters])

  const totalWorkouts = workouts.length
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
  const totalVolume = workouts.reduce((sum, w) => sum + calcVolume(w.exercises), 0)

  const resetForm = useCallback(() => {
    setWorkoutName('')
    setWorkoutType('strength')
    setDuration('')
    setDate(new Date().toISOString().split('T')[0])
    setExercises([])
    setExpandedExercises(new Set())
    setSupersetGroups({})
    setRestTimerExercise(null)
  }, [])

  const applyTemplate = useCallback((template: WorkoutTemplate) => {
    setWorkoutName(template.name)
    setWorkoutType(template.category)
    const mapped: WorkoutExercise[] = template.exercises.map((te) => ({
      id: generateId(),
      exerciseId: te.exerciseId,
      name: te.name,
      sets: Array.from({ length: te.targetSets }, () => ({
        reps: te.targetReps,
        weight: undefined,
        completed: false,
      })) as ExerciseSet[],
      notes: '',
    }))
    setExercises(mapped)
    setExpandedExercises(new Set(mapped.map((e) => e.id)))
    setShowTemplatePicker(false)
  }, [])

  const addExercise = useCallback(
    (exerciseId: string) => {
      const ex = getExerciseById(exerciseId)
      if (!ex) return
      const newExercise: WorkoutExercise = {
        id: generateId(),
        exerciseId: ex.id,
        name: ex.name,
        sets: [{ reps: undefined, weight: undefined, completed: false }] as ExerciseSet[],
        notes: '',
      }
      setExercises((prev) => [...prev, newExercise])
      setExpandedExercises((prev) => new Set(prev).add(newExercise.id))
      setShowExercisePicker(false)
    },
    []
  )

  const removeExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id))
    setSupersetGroups((prev) => {
      const next = { ...prev }
      for (const [key, ids] of Object.entries(next)) {
        next[key] = ids.filter((i) => i !== id)
        if (next[key].length < 2) delete next[key]
      }
      return next
    })
  }, [])

  const duplicateExercise = useCallback((ex: WorkoutExercise) => {
    const clone: WorkoutExercise = {
      ...ex,
      id: generateId(),
      sets: ex.sets.map((s) => ({ ...s })),
    }
    setExercises((prev) => [...prev, clone])
    setExpandedExercises((prev) => new Set(prev).add(clone.id))
  }, [])

  const addSet = useCallback((exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: undefined, weight: undefined, completed: false }] }
          : ex
      )
    )
  }, [])

  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) } : ex
      )
    )
  }, [])

  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, field: string, value: number | boolean | undefined) => {
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((set, i) =>
                  i === setIndex ? { ...set, [field]: value } : set
                ),
              }
            : ex
        )
      )
    },
    []
  )

  const updateExerciseNotes = useCallback((exerciseId: string, notes: string) => {
    setExercises((prev) =>
      prev.map((ex) => (ex.id === exerciseId ? { ...ex, notes } : ex))
    )
  }, [])

  const toggleExpand = useCallback((id: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSuperset = useCallback((exerciseId: string) => {
    setSupersetGroups((prev) => {
      const next = { ...prev }
      const existingGroup = Object.entries(next).find(([, ids]) => ids.includes(exerciseId))
      if (existingGroup) {
        const [key, ids] = existingGroup
        const filtered = ids.filter((id) => id !== exerciseId)
        if (filtered.length < 2) delete next[key]
        else next[key] = filtered
      } else {
        const firstUngrouped = exercises.find(
          (e) =>
            e.id !== exerciseId &&
            !Object.values(next).some((ids) => ids.includes(e.id))
        )
        if (firstUngrouped) {
          const key = generateId()
          next[key] = [firstUngrouped.id, exerciseId]
        }
      }
      return next
    })
  }, [exercises])

  const getSupersetPair = useCallback(
    (exerciseId: string): string[] | null => {
      for (const ids of Object.values(supersetGroups)) {
        if (ids.includes(exerciseId)) return ids
      }
      return null
    },
    [supersetGroups]
  )

  const handleSave = useCallback(async () => {
    if (!workoutName.trim() || exercises.length === 0) return
    const finalDuration = parseInt(duration) || 0
    const workout: Workout = {
      id: generateId(),
      name: workoutName.trim(),
      category: workoutType,
      date,
      duration: finalDuration,
      exercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await addWorkout(workout)
    resetForm()
    setShowForm(false)
  }, [workoutName, exercises, workoutType, date, duration, addWorkout, resetForm])

  const handleDuplicate = useCallback(async (wo: Workout) => {
    const duplicate: Workout = {
      ...wo,
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      exercises: wo.exercises.map((ex) => ({
        ...ex,
        id: generateId(),
        sets: ex.sets.map((s) => ({ ...s })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await addWorkout(duplicate)
  }, [addWorkout])

  const handleDelete = useCallback(async () => {
    if (!deletingWorkout) return
    await deleteWorkout(deletingWorkout.id)
    setDeletingWorkout(null)
  }, [deletingWorkout, deleteWorkout])

  const saveAsTemplate = useCallback(async () => {
    if (!workoutName.trim() || exercises.length === 0) return
    const template: WorkoutTemplate = {
      id: generateId(),
      name: workoutName.trim(),
      category: workoutType as ExerciseCategory,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        targetSets: e.sets.length,
        targetReps: e.sets[0]?.reps,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('workoutTemplates', template)
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }, [workoutName, workoutType, exercises])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-[#0d0d1a] p-6"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2">
              <Dumbbell className="w-4 h-4" />
              <span>Total Workouts</span>
            </div>
            <p className="text-3xl font-black text-white">{totalWorkouts}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">All time logged</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-[#0d0d1a] p-6"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Time Spent</span>
            </div>
            <p className="text-3xl font-black text-white">{formatDuration(totalDuration)}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Training total</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-[#0d0d1a] p-6"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <Flame className="w-4 h-4" />
              <span>Total Volume</span>
            </div>
            <p className="text-3xl font-black text-white">{totalVolume.toLocaleString()}kg</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Lifetime lifted</p>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Workout History</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all ${
              Object.values(filters).some(Boolean)
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={() => setShowTemplatePicker(true)} className="text-xs">
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Templates
          </Button>
          <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Workout
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, category: (e.target.value || undefined) as ExerciseCategory | undefined }))}
                    className="glass-input w-full text-sm"
                  >
                    <option value="">All types</option>
                    {Object.entries(typeConfig).map(([key]) => (
                      <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                    className="glass-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                    className="glass-input w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Search</label>
                  <input
                    type="text"
                    placeholder="Search workouts..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
                    className="glass-input w-full text-sm"
                  />
                </div>
              </div>
              {Object.values(filters).some(Boolean) && (
                <button
                  onClick={() => setFilters({})}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-all"
                >
                  Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sortedWorkouts.length === 0 ? (
        <AnimatePresence>
          <motion.div key="empty" {...FADE_SLIDE}>
            <Card className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-rose-400/50" />
              </div>
              <p className="text-gray-400 mb-1">
                {workouts.length === 0 ? 'No workouts logged yet' : 'No workouts match your filters'}
              </p>
              <p className="text-gray-500 text-sm mb-4">
                {workouts.length === 0 ? 'Start tracking your fitness journey' : 'Try adjusting your filter criteria'}
              </p>
              <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
                Add Your First Workout
              </Button>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {sortedWorkouts.map((wo, index) => {
              const config = typeConfig[wo.category] || typeConfig.strength
              const Icon = config.icon
              const volume = calcVolume(wo.exercises)
              return (
                <motion.div
                  key={wo.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/[0.12] transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                  <div className="relative z-10 p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white tracking-tight">{wo.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.color}`}>
                              {wo.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(wo.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            {wo.duration > 0 && `• ${formatDuration(wo.duration)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicate(wo as any)}
                          className="p-2 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Duplicate workout"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingWorkout(wo as any)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-2xl font-bold text-white">{wo.exercises.length}</p>
                        <p className="text-xs text-gray-500">Exercises</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                        <p className="text-2xl font-bold text-white">
                          {wo.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}
                        </p>
                        <p className="text-xs text-gray-500">Sets</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{volume.toLocaleString()}kg</p>
                        <p className="text-xs text-emerald-400/80">Volume</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wo.exercises.slice(0, 5).map((ex) => (
                        <span
                          key={ex.id}
                          className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-300"
                        >
                          {ex.name}
                        </span>
                      ))}
                      {wo.exercises.length > 5 && (
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                          +{wo.exercises.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingWorkout}
        title="Delete Workout?"
        message={`This will permanently delete "${deletingWorkout?.name}". This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingWorkout(null)}
      />

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Add Workout</h3>
                  <div className="flex items-center gap-2">
                    {exercises.length > 0 && (
                      <button
                        onClick={saveAsTemplate}
                        disabled={!workoutName.trim()}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                          templateSaved
                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {templateSaved ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {templateSaved ? 'Saved!' : 'Save Template'}
                      </button>
                    )}
                    <button onClick={() => setShowTemplatePicker(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                      <Layers className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setShowForm(false); resetForm() }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>


                <div>
                  <label className="block text-sm text-gray-400 mb-2">Workout Name</label>
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="glass-input w-full"
                    placeholder="Push Day, Leg Day, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <button
                    onClick={() => setShowTypePicker(true)}
                    className="flex items-center gap-3 w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                  >
                    {(() => {
                      const cfg = typeConfig[workoutType]
                      const CfgIcon = cfg?.icon || Dumbbell
                      return (
                        <>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg?.bg || 'bg-white/10'}`}>
                            <CfgIcon className={`w-4 h-4 ${cfg?.color || 'text-muted'}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-white">{categoryLabels[workoutType as ExerciseCategory] || workoutType}</p>
                            <p className="text-[10px] text-muted mt-0.5">Click to change type</p>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
                        </>
                      )
                    })()}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="glass-input w-full"
                      placeholder="60"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-400">Exercises</label>
                    <Button variant="ghost" size="sm" onClick={() => setShowExercisePicker(true)}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Exercise
                    </Button>
                  </div>

                  {exercises.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 py-10 text-center">
                      <Dumbbell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No exercises added yet</p>
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowExercisePicker(true)}>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Browse Exercises
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowTemplatePicker(true)}>
                          <Layers className="w-3.5 h-3.5 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {exercises.map((ex) => {
                          const supersetPair = getSupersetPair(ex.id)
                          const isInSuperset = supersetPair !== null
                          const supersetIndex = supersetPair?.indexOf(ex.id) ?? 0
                          return (
                            <motion.div
                              key={ex.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                              className={`rounded-xl border ${
                                isInSuperset
                                  ? 'border-indigo-500/30 bg-indigo-500/[0.04]'
                                  : 'border-white/10 bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isInSuperset && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 shrink-0">
                                      <GripVertical className="w-3 h-3" />
                                      SS{supersetIndex + 1}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => toggleExpand(ex.id)}
                                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                  >
                                    <span className="font-medium text-white text-sm truncate">{ex.name}</span>
                                    {isInSuperset && (
                                      <span className="text-[10px] text-indigo-400/70 shrink-0">(superset)</span>
                                    )}
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {restTimerExercise === ex.id && (
                                    <RestTimer onComplete={() => setRestTimerExercise(null)} />
                                  )}
                                  <button
                                    onClick={() => setRestTimerExercise(restTimerExercise === ex.id ? null : ex.id)}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      restTimerExercise === ex.id
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10'
                                    }`}
                                    title="Rest timer"
                                  >
                                    <Timer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleSuperset(ex.id)}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      isInSuperset
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10'
                                    }`}
                                    title={isInSuperset ? 'Remove from superset' : 'Add to superset'}
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => duplicateExercise(ex)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                                    title="Duplicate exercise"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleExpand(ex.id)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-white/60 transition-all"
                                  >
                                    {expandedExercises.has(ex.id) ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => removeExercise(ex.id)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <AnimatePresence>
                                {expandedExercises.has(ex.id) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                     className="overflow-hidden"
                                   >
                                      <div className="px-4 py-3 space-y-2">
                                        {ex.sets.map((set, setIdx) => {
                                            return (
                                            <div key={setIdx} className="grid grid-cols-[1fr_auto_1fr_auto_auto] gap-1 items-center px-1">
                                              <input
                                                type="number"
                                                placeholder="kg"
                                                value={set.weight ?? ''}
                                                onChange={(e) => updateSet(ex.id, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500/50 focus:outline-none placeholder-gray-600 transition-all"
                                              />
                                              <span className="text-gray-500 text-xs text-center">×</span>
                                              <input
                                                type="number"
                                                placeholder="reps"
                                                value={set.reps ?? ''}
                                                onChange={(e) => updateSet(ex.id, setIdx, 'reps', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500/50 focus:outline-none placeholder-gray-600 transition-all"
                                              />
                                              <select
                                                value={(set as unknown as { rpe?: number }).rpe ?? ''}
                                                onChange={(e) => updateSet(ex.id, setIdx, 'rpe', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                className="glass-input w-16 px-2 py-2 text-xs"
                                              >
                                                <option value="">RPE</option>
                                                <option value="6" className="bg-emerald-900 text-emerald-300">6</option>
                                                <option value="6.5" className="bg-teal-900 text-teal-300">6.5</option>
                                                <option value="7" className="bg-green-900 text-green-300">7</option>
                                                <option value="7.5" className="bg-lime-900 text-lime-300">7.5</option>
                                                <option value="8" className="bg-amber-900 text-amber-300">8</option>
                                                <option value="8.5" className="bg-orange-900 text-orange-300">8.5</option>
                                                <option value="9" className="bg-red-900 text-red-300">9</option>
                                                <option value="9.5" className="bg-rose-900 text-rose-300">9.5</option>
                                                <option value="10" className="bg-purple-900 text-purple-300">10</option>
                                              </select>
                                              <div className="flex items-center gap-1">
                                              <button
                                                onClick={() => updateSet(ex.id, setIdx, 'completed', !set.completed)}
                                                className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                                  set.completed
                                                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                                                    : 'border-white/10 text-gray-500 hover:border-white/20'
                                                }`}
                                              >
                                                {set.completed ? <Check className="w-3.5 h-3.5" /> : null}
                                              </button>
                                              <button
                                                onClick={() => removeSet(ex.id, setIdx)}
                                                className="p-1 rounded text-gray-500 hover:text-red-400 transition-all shrink-0"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                              </div>
                                           </div>
                                        )
                                      })}

                                      <VolumeIndicator
                                        current={calcVolume([ex])}
                                        previous={getLastVolumeForExercise(ex.exerciseId, workouts as any)}
                                      />

                                      <div className="flex gap-2 pt-2">
                                        <button
                                          onClick={() => addSet(ex.id)}
                                          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          Add Set
                                        </button>
                                      </div>

                                      <div className="mt-2">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                                          <FileText className="w-3 h-3" />
                                          <span className="text-[10px] uppercase tracking-wider">Notes</span>
                                        </div>
                                        <textarea
                                          value={ex.notes || ''}
                                          onChange={(e) => updateExerciseNotes(ex.id, e.target.value)}
                                          placeholder="Exercise notes, form cues, etc."
                                          rows={2}
                                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-rose-500/50 focus:outline-none transition-all resize-none"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <Button variant="default" onClick={() => { setShowForm(false); resetForm() }} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!workoutName.trim() || exercises.length === 0}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Save Workout
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExercisePicker && (
          <ExercisePicker
            onSelect={addExercise}
            onClose={() => setShowExercisePicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplatePicker && (
          <TemplatePicker
            templates={derivedTemplates}
            onSelect={applyTemplate}
            onClose={() => setShowTemplatePicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTypePicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowTypePicker(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Select Workout Type</h3>
                  <button onClick={() => setShowTypePicker(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[65vh] p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(typeConfig) as [string, typeof typeConfig['strength']][]).map(([key, cfg]) => {
                    const CfgIcon = cfg.icon
                    const isActive = workoutType === key
                    return (
                      <button
                        key={key}
                        onClick={() => { setWorkoutType(key); setShowTypePicker(false) }}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04] hover:border-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? cfg.bg : 'bg-white/5'}`}>
                          <CfgIcon className={`w-4 h-4 ${isActive ? cfg.color : 'opacity-70'}`} />
                        </div>
                        <span className="text-xs font-medium">
                          {categoryLabels[key as ExerciseCategory] || key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
