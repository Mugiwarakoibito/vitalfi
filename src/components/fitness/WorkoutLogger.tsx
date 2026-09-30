import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, Dumbbell, Flame, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check,
  AlertTriangle, Copy, Search, Filter, RotateCcw, Calendar, X, Trophy, Sparkles,
  TrendingUp, TrendingDown, Minus, Layers,
  FileText, Activity, Zap, Wind, Settings2, Move, StretchHorizontal,
  PersonStanding, Gauge, Crosshair, Weight, Heart, Shield, Sword, Coffee,
  Equal, Footprints, Waves, Timer, Play,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId, formatDuration } from '@/lib/utils'
import { storage } from '@/lib/storage'
import { exerciseLibrary, getExerciseById, getAllMuscleGroups, categoryLabels, muscleGroupColors } from '@/lib/exercises'
import { ResponsiveContainer, ComposedChart, Area, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

import type { WorkoutExercise, ExerciseSet, WorkoutFilter, ExerciseCategory, MuscleGroup } from '@/types/fitness'
import type { Workout, WorkoutTemplate } from '@/types/domain'

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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4" onClick={onClose}>
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

function TemplatePicker({
  savedTemplates,
  onSelect,
  onDelete,
  onClose,
  onEditTemplate,
  onNewTemplate,
}: {
  savedTemplates: WorkoutTemplate[]
  onSelect: (template: WorkoutTemplate) => void
  onDelete: (template: WorkoutTemplate) => void
  onClose: () => void
  onEditTemplate?: (template: WorkoutTemplate) => void
  onNewTemplate?: () => void
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    savedTemplates.forEach((t) => { if (t.category) set.add(t.category) })
    return Array.from(set).sort()
  }, [savedTemplates])

  function filterList(list: WorkoutTemplate[]) {
    let result = list
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.exercises.some((e) => e.name.toLowerCase().includes(q)))
    }
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter)
    return result
  }

  const filteredSaved = useMemo(() => filterList(savedTemplates), [savedTemplates, search, categoryFilter])

  function renderCard(template: WorkoutTemplate, isSaved: boolean) {
    const preview = template.exercises.slice(0, 4)
    const remaining = template.exercises.length - preview.length
    const cfg = typeConfig[template.category]
    const CatIcon = cfg?.icon || Dumbbell

    if (confirmDelete === template.id) {
      return (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.04]">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs text-red-300 flex-1">Delete "{template.name}"?</span>
          <button onClick={() => { onDelete(template); setConfirmDelete(null) }} className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/30 transition-all">Delete</button>
          <button onClick={() => setConfirmDelete(null)} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs hover:bg-white/10 transition-all">Cancel</button>
        </div>
      )
    }

    return (
      <button onClick={() => setPreviewTemplate(template)} className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 p-4 text-left transition-all group">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg?.bg || 'bg-white/10'}`}>
          <CatIcon className={`w-4 h-4 ${cfg?.color || 'text-muted'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white text-sm">{template.name}</p>
            <span className="text-[10px] text-gray-500">· {template.exercises.length} ex</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {preview.map((ex) => (
              <span key={ex.exerciseId} className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-400 truncate max-w-[100px]">{ex.name}</span>
            ))}
            {remaining > 0 && <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-gray-500">+{remaining} more</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 self-start">
          {isSaved && (
            <>
              <span onClick={(e) => { e.stopPropagation(); onEditTemplate?.(template) }} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all" title="Edit template">
                <Pencil className="w-3.5 h-3.5" />
              </span>
              <span onClick={(e) => { e.stopPropagation(); setConfirmDelete(template.id) }} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" title="Delete template">
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </>
          )}
          {!isSaved && <Plus className="w-4 h-4 text-indigo-400 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />}
        </div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Workout Templates</h3>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={onNewTemplate} className="shrink-0 p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all" title="Create new template">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="glass-input w-full pl-8 text-xs" placeholder="Search templates..." />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="glass-input text-xs w-auto [color-scheme:dark]">
              <option value="">All</option>
              {categories.map((cat) => <option key={cat} value={cat}>{categoryLabels[cat as ExerciseCategory] || cat}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-3 space-y-4">
          {savedTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No templates yet</p>
              <p className="text-gray-500 text-xs mt-1">Click the + button to create your first template</p>
            </div>
          ) : filteredSaved.length > 0 ? (
            <div className="space-y-2">{filteredSaved.map((t) => <div key={t.id}>{renderCard(t, true)}</div>)}</div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No matching templates</p>
              <p className="text-gray-600 text-xs mt-1">Try a different search or filter</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600">{savedTemplates.length} saved · {filteredSaved.length} shown</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {previewTemplate && (() => {
          const cfg = typeConfig[previewTemplate.category]
          const CatIcon = cfg?.icon || Dumbbell
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4"
              onClick={() => setPreviewTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/95 backdrop-blur-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-5 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg?.bg || 'bg-white/10'}`}>
                        <CatIcon className={`w-5 h-5 ${cfg?.color || 'text-muted'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{previewTemplate.name}</h3>
                        <p className="text-xs text-gray-500">{previewTemplate.exercises.length} exercises</p>
                      </div>
                    </div>
                    <button onClick={() => setPreviewTemplate(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[50vh] p-4 space-y-2">
                  {previewTemplate.exercises.map((ex, i) => (
                    <div key={ex.exerciseId || i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">{ex.name}</p>
                        <span className="text-[10px] text-gray-500">{ex.targetSets} sets</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-white/5 p-2">
                          <p className="text-xs text-gray-400">Sets</p>
                          <p className="text-sm font-bold text-white">{ex.targetSets}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-2">
                          <p className="text-xs text-gray-400">Reps</p>
                          <p className="text-sm font-bold text-white">{ex.targetReps || '--'}</p>
                        </div>
                        <div className="rounded-lg bg-white/5 p-2">
                          <p className="text-xs text-gray-400">RPE</p>
                          <p className="text-sm font-bold text-white">{ex.targetRpe || '--'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/5 flex gap-3">
                  <button onClick={() => setPreviewTemplate(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">Back</button>
                  <button onClick={() => { onSelect(previewTemplate); setPreviewTemplate(null) }} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Apply Template
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
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

const FADE_SLIDE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export function WorkoutLogger() {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useAppStore()
  const [savedTemplates, setSavedTemplates] = useState<WorkoutTemplate[]>([])

  useEffect(() => {
    storage.getAll('workoutTemplates').then((t) => {
      if (t) setSavedTemplates(t as WorkoutTemplate[])
    })
  }, [])

  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setWorkoutName('')
      setWorkoutType('strength')
      setDuration('')
      setDate(new Date().toISOString().split('T')[0])
      setExercises([])
      setExpandedExercises(new Set())
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
  const [restTimerEnd, setRestTimerEnd] = useState<number | null>(null)
  const [restTimerExName, setRestTimerExName] = useState('')
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null)
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveTemplateExercises, setSaveTemplateExercises] = useState<Set<string>>(new Set())
  const [saveName, setSaveName] = useState('')
  const [saveMode, setSaveMode] = useState<'new' | 'existing' | 'edit'>('new')
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [stashedExercises, setStashedExercises] = useState<WorkoutExercise[]>([])
  const [saveModalFromPicker, setSaveModalFromPicker] = useState(false)
  const [pendingExerciseConfig, setPendingExerciseConfig] = useState<{ id: string; name: string; targetSets: string; targetReps: string; targetRpe: string; editExerciseId?: string } | null>(null)

  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + dir)
    setSelectedDate(formatDate(d))
  }
  const jumpToToday = () => setSelectedDate(formatDate(new Date()))

  const [filters, setFilters] = useState<WorkoutFilter>({})
  const [showFilters, _setShowFilters] = useState(false)
  const [showWeeklyAnalytics, setShowWeeklyAnalytics] = useState(false)
  const [weeklyNavOffset, setWeeklyNavOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [weeklyTab, setWeeklyTab] = useState<'trends' | 'performance' | 'insights'>('trends')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const fromDayRef = useRef<HTMLInputElement>(null)
  const fromMonthRef = useRef<HTMLInputElement>(null)
  const fromYearRef = useRef<HTMLInputElement>(null)
  const toDayRef = useRef<HTMLInputElement>(null)
  const toMonthRef = useRef<HTMLInputElement>(null)
  const toYearRef = useRef<HTMLInputElement>(null)
  const [fromDay, setFromDay] = useState('')
  const [fromMonth, setFromMonth] = useState('')
  const [fromYear, setFromYear] = useState('')
  const [toDay, setToDay] = useState('')
  const [toMonth, setToMonth] = useState('')
  const [toYear, setToYear] = useState('')
  const clearDates = useCallback(() => {
    setFromDay(''); setFromMonth(''); setFromYear('')
    setToDay(''); setToMonth(''); setToYear('')
  }, [])

  useEffect(() => {
    const fromOk = fromDay.length === 2 && fromMonth.length === 2 && fromYear.length === 4
    const toOk = toDay.length === 2 && toMonth.length === 2 && toYear.length === 4
    setFilters((f) => ({
      ...f,
      dateFrom: fromOk ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
      dateTo: toOk ? `${toYear}-${toMonth}-${toDay}` : undefined,
    }))
  }, [fromDay, fromMonth, fromYear, toDay, toMonth, toYear])

  useEffect(() => {
    if (restTimerEnd == null) return
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000))
      if (remaining <= 0) { setRestTimerEnd(null); setRestTimerExName('') }
    }, 200)
    return () => clearInterval(id)
  }, [restTimerEnd])

  const handleSegChange = useCallback((value: string, setter: (v: string) => void, maxLen: number, validate: (current: string, digit: string, index: number) => boolean, nextRef?: React.RefObject<HTMLInputElement | null>) => {
    const raw = value.replace(/\D/g, '').slice(0, maxLen)
    let result = ''
    for (let i = 0; i < raw.length; i++) {
      if (validate(result, raw[i], i)) result += raw[i]
      else break
    }
    setter(result)
    if (result.length === maxLen && nextRef?.current) nextRef.current.focus()
  }, [])

  const handleSegKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, currentValue: string, prevRef?: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Backspace' && currentValue.length === 0 && prevRef?.current) {
      prevRef.current.focus()
    }
  }, [])

  const validateDay = useCallback((_: string, d: string, i: number) => {
    if (i === 0) return d >= '0' && d <= '3'
    if (i === 1) {
      const t = _[0]
      if (t === '3') return d >= '0' && d <= '1'
      if (t === '0') return d >= '1' && d <= '9'
      return d >= '0' && d <= '9'
    }
    return false
  }, [])

  const validateMonth = useCallback((_: string, d: string, i: number) => {
    if (i === 0) return d >= '0' && d <= '1'
    if (i === 1) {
      const t = _[0]
      if (t === '1') return d >= '0' && d <= '2'
      if (t === '0') return d >= '1' && d <= '9'
      return d >= '0' && d <= '9'
    }
    return false
  }, [])

  const validateYear = useCallback((_: string, d: string, __: number) => d >= '0' && d <= '9', [])

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

  const thisWeek = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    return workouts.filter(w => new Date(w.date) >= weekStart).length
  }, [workouts])

  const bestStreak = useMemo(() => {
    if (workouts.length === 0) return 0
    const dates = [...new Set(workouts.map(w => w.date))].sort()
    let best = 1
    let current = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
      if (diff === 1) { current++; best = Math.max(best, current) }
      else current = 1
    }
    return best
  }, [workouts])

  const heatScore = useMemo(() => {
    const allWorkouts = showForm && exercises.length > 0 && !editingWorkoutId
      ? [...workouts, { date, exercises } as unknown as Workout]
      : workouts

    if (allWorkouts.length === 0) return { score: 0, label: 'Rest', flames: 0 }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const currentWeekWorkouts = allWorkouts.filter(w => new Date(w.date) >= weekStart)
    const currentWeekCount = currentWeekWorkouts.length
    const currentWeekVol = currentWeekWorkouts.reduce((s, w) => s + calcVolume(w.exercises), 0)

    if (currentWeekCount === 0) {
      return { score: 0, label: 'Rest', flames: 0 }
    }

    const historicalWorkouts = allWorkouts.filter(w => new Date(w.date) < weekStart)

    if (historicalWorkouts.length === 0) {
      const base = Math.min(60, currentWeekCount * 15 + Math.round(currentWeekVol / 2000) * 5)
      const score = Math.min(100, Math.max(1, base))
      const label = score >= 80 ? 'On Fire' : score >= 60 ? 'Hot' : score >= 40 ? 'Warm' : score >= 20 ? 'Mild' : 'Cool'
      const flames = score >= 80 ? 3 : score >= 60 ? 2 : score >= 40 ? 1 : 0
      return { score, label, flames }
    }

    const historicalWeeks = new Set(historicalWorkouts.map(w => {
      const d = new Date(w.date)
      d.setDate(d.getDate() - d.getDay())
      return d.toISOString().split('T')[0]
    })).size

    const avgWeeklyCount = historicalWorkouts.length / historicalWeeks
    const avgWeeklyVol = historicalWorkouts.reduce((s, w) => s + calcVolume(w.exercises), 0) / historicalWeeks

    const freqScore = Math.min(50, Math.round((currentWeekCount / Math.max(avgWeeklyCount, 0.5)) * 25))
    const volScore = Math.min(50, Math.round((currentWeekVol / Math.max(avgWeeklyVol, 1)) * 25))
    const score = Math.min(100, Math.max(1, freqScore + volScore))

    const label = score >= 80 ? 'On Fire' : score >= 60 ? 'Hot' : score >= 40 ? 'Warm' : score >= 20 ? 'Mild' : 'Cool'
    const flames = score >= 80 ? 3 : score >= 60 ? 2 : score >= 40 ? 1 : 0

    return { score, label, flames }
  }, [workouts, exercises, date, showForm, editingWorkoutId])



  const resetForm = useCallback(() => {
    setEditingWorkoutId(null)
    setWorkoutName('')
    setWorkoutType('strength')
    setDuration('')
    setDate(new Date().toISOString().split('T')[0])
    setExercises([])
    setExpandedExercises(new Set())
    setSaveTemplateExercises(new Set())
    setEditingTemplate(null)
  }, [])

  const applyTemplate = useCallback((template: WorkoutTemplate) => {
    setWorkoutType(template.category)
    const mapped: WorkoutExercise[] = template.exercises.map((te) => ({
      id: generateId(),
      exerciseId: te.exerciseId,
      name: te.name,
      sets: te.sets && te.sets.length > 0
        ? te.sets.map((s) => ({ ...s })) as ExerciseSet[]
        : Array.from({ length: te.targetSets }, () => ({
            reps: te.targetReps,
            weight: undefined,
            completed: false,
          })) as ExerciseSet[],
      notes: te.notes || '',
    }))
    setExercises(mapped)
    setExpandedExercises(new Set(mapped.map((e) => e.id)))

    setEditingTemplate(null)
  }, [])

  const addExercise = useCallback(
    (exerciseId: string) => {
      const ex = getExerciseById(exerciseId)
      if (!ex) return
      if (exercises.length === 0) {
        setWorkoutType(ex.category as ExerciseCategory)
      }
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
    [exercises.length]
  )

  const addExerciseWithConfig = useCallback(
    (exerciseId: string, targetSets: string, targetReps: string, targetRpe: string) => {
      const ex = getExerciseById(exerciseId)
      if (!ex) return
      if (exercises.length === 0) {
        setWorkoutType(ex.category as ExerciseCategory)
      }
      const sets: ExerciseSet[] = Array.from({ length: parseInt(targetSets) || 1 }, () => ({
        reps: targetReps ? parseInt(targetReps) || undefined : undefined,
        weight: undefined,
        rpe: targetRpe ? parseFloat(targetRpe) || undefined : undefined,
        completed: false,
      }))
      const newExercise: WorkoutExercise = {
        id: generateId(),
        exerciseId: ex.id,
        name: ex.name,
        sets,
        notes: '',
      }
      setExercises((prev) => [...prev, newExercise])
      setExpandedExercises((prev) => new Set(prev).add(newExercise.id))
      setShowExercisePicker(false)
      setPendingExerciseConfig(null)
    },
    [exercises.length]
  )

  const removeExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id))
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

  const handleSave = useCallback(async () => {
    if (!workoutName.trim() || exercises.length === 0) return
    const finalDuration = parseInt(duration) || 0
    if (editingWorkoutId) {
      const workout: Workout = {
        id: editingWorkoutId,
        name: workoutName.trim(),
        category: workoutType,
        date,
        duration: finalDuration,
        exercises,
        createdAt: '',
        updatedAt: new Date().toISOString(),
      }
      await updateWorkout(workout)
    } else {
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
    }
    resetForm()
    setShowForm(false)
  }, [workoutName, exercises, workoutType, date, duration, editingWorkoutId, addWorkout, updateWorkout, resetForm])

  const handleEdit = useCallback((wo: Workout) => {
    setEditingWorkoutId(wo.id)
    setWorkoutName(wo.name)
    setWorkoutType(wo.category)
    setDuration(wo.duration?.toString() || '')
    setDate(wo.date)
    setExercises(wo.exercises.map(ex => ({ ...ex, id: generateId(), sets: ex.sets.map(s => ({ ...s })) })))
    setExpandedExercises(new Set(wo.exercises.map(e => e.id)))
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deletingWorkout) return
    await deleteWorkout(deletingWorkout.id)
    setDeletingWorkout(null)
  }, [deletingWorkout, deleteWorkout])

  const toTemplateExercises = (exs: WorkoutExercise[]) =>
    exs.map((e) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      targetSets: e.sets.length,
      targetReps: e.sets[0]?.reps,
      sets: e.sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        completed: s.completed,
        duration: s.duration,
        distance: s.distance,
      })),
      notes: e.notes,
    }))

  const saveAsTemplate = async (name: string) => {
    if (exercises.length === 0 || !name.trim()) return
    if (saveMode === 'edit' && editingTemplate) {
      const updated: WorkoutTemplate = {
        ...editingTemplate,
        name: name.trim(),
        exercises: toTemplateExercises(exercises),
        updatedAt: new Date().toISOString(),
      }
      await storage.put('workoutTemplates', updated)
    } else if (saveMode === 'new') {
      const template: WorkoutTemplate = {
        id: generateId(),
        name: name.trim(),
        category: workoutType as ExerciseCategory,
        exercises: toTemplateExercises(exercises),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await storage.put('workoutTemplates', template)
    }
    const all = await storage.getAll('workoutTemplates')
    if (all) setSavedTemplates(all as WorkoutTemplate[])
    setShowSaveModal(false)
    setSaveTemplateExercises(new Set())
    setEditingTemplate(null)
    if (stashedExercises.length > 0) {
      setExercises(stashedExercises)
      setStashedExercises([])
    }
  }

  const deleteSavedTemplate = useCallback(async (template: WorkoutTemplate) => {
    await storage.delete('workoutTemplates', template.id)
    setSavedTemplates((prev) => prev.filter((t) => t.id !== template.id))
  }, [])

  return (
    <div className="space-y-6">

      {/* Toolbar: Date Nav + Panel Toggles */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {selectedDate !== formatDate(new Date()) && (
            <button onClick={jumpToToday} className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplatePicker(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showTemplatePicker ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Templates">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={() => setShowWeeklyAnalytics(p => !p)}
            className={`p-2 rounded-xl border transition-all ${showWeeklyAnalytics ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Weekly Analytics">
            <Activity className="w-5 h-5" />
          </button>
          <Button variant="primary" onClick={() => {
            setWorkoutName(''); setWorkoutType('strength'); setDuration('')
            setDate(new Date().toISOString().split('T')[0]); setExercises([])
            setExpandedExercises(new Set()); setShowForm(true)
          }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Log Workout
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-orange-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-orange-400/80 text-sm mb-2">
              <span>Heat Score</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">{heatScore.score}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <Flame key={i} className={`w-4 h-4 transition-all ${i <= heatScore.flames ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.6)]' : 'text-white/10'}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{heatScore.label}</p>
          </div>
        </div>
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-sky-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-cyan-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <span>This Week</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">{thisWeek}</p>
              <div className="flex gap-0.5 items-end pb-1">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <div key={d} className={`w-1.5 rounded-full transition-all ${d <= thisWeek ? 'bg-sky-400 shadow-sm shadow-sky-400/50' : 'bg-white/10'}`} style={{ height: `${Math.min(16, 8 + d * 2)}px` }} />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">workouts this week</p>
          </div>
        </div>
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/10 rounded-full -ml-8 -mb-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-2">
              <span>Best Streak</span>
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{bestStreak}<span className="text-sm text-amber-500/60 ml-1 font-normal">days</span></p>
            <p className="text-xs text-gray-500 mt-1">your record to beat</p>
          </div>
        </div>
      </div>

      {/* Weekly Analytics Panel */}
      <AnimatePresence>{showWeeklyAnalytics && workouts.length > 0 && (() => {
        const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() - weeklyNavOffset * 7); weekStart.setHours(0,0,0,0)
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23,59,59,999)
        const lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
        const lastWeekStart = new Date(lastWeekEnd); lastWeekStart.setDate(lastWeekStart.getDate() - 6); lastWeekStart.setHours(0,0,0,0)
        const toDateOnly = (s: string) => { const d = new Date(s); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
        const thisWeekWorkouts = workouts.filter(w => { const d = toDateOnly(w.date); return d >= weekStart && d <= weekEnd })
        const lastWeekWorkouts = workouts.filter(w => { const d = toDateOnly(w.date); return d >= lastWeekStart && d <= lastWeekEnd })
        const thisWeekVol = thisWeekWorkouts.reduce((s,w) => s + calcVolume(w.exercises), 0)
        const lastWeekVol = lastWeekWorkouts.reduce((s,w) => s + calcVolume(w.exercises), 0)
        const thisWeekDur = thisWeekWorkouts.length > 0 ? Math.round(thisWeekWorkouts.reduce((s,w) => s + (w.duration||0), 0) / thisWeekWorkouts.length) : 0
        const lastWeekDur = lastWeekWorkouts.length > 0 ? Math.round(lastWeekWorkouts.reduce((s,w) => s + (w.duration||0), 0) / lastWeekWorkouts.length) : 0

        const bestWorkout = thisWeekWorkouts.length > 0 ? thisWeekWorkouts.reduce((best, w) => calcVolume(w.exercises) > calcVolume(best.exercises) ? w : best) : null
        const bestVol = bestWorkout ? calcVolume(bestWorkout.exercises) : 0

        const muscleMap = new Map<string, { primary: number; secondary: number }>()
        thisWeekWorkouts.forEach(w => w.exercises.forEach(ex => {
          const def = getExerciseById(ex.exerciseId)
          if (def) {
            def.primaryMuscles.forEach(m => { const e = muscleMap.get(m) || { primary: 0, secondary: 0 }; e.primary += calcVolume([ex]); muscleMap.set(m, e) })
            def.secondaryMuscles.forEach(m => { const e = muscleMap.get(m) || { primary: 0, secondary: 0 }; e.secondary += Math.round(calcVolume([ex]) * 0.3); muscleMap.set(m, e) })
          }
        }))
        const sortedMuscles = [...muscleMap.entries()].map(([name, v]) => ({ name, ...v, total: v.primary + v.secondary })).sort((a,b) => b.total - a.total)
        const maxMuscleVol = sortedMuscles.length > 0 ? sortedMuscles[0].total : 1

        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        const dayLabels = ['S','M','T','W','T','F','S']
        const dailyData = dayNames.map((name, i) => {
          const dw = thisWeekWorkouts.filter(w => new Date(w.date).getDay() === i)
          return { name, label: dayLabels[i], count: dw.length, volume: dw.reduce((s,w) => s + calcVolume(w.exercises), 0), types: [...new Set(dw.map(w => w.type || w.category || 'strength'))] }
        })

        const typeMap = new Map<string, number>()
        thisWeekWorkouts.forEach(w => { const t = w.type || w.category || 'strength'; typeMap.set(t, (typeMap.get(t)||0) + 1) })
        const sortedTypes = [...typeMap.entries()].sort((a,b) => b[1] - a[1])

        // Trained muscles radar data — comprehensive
        const muscleStats = new Map<string, { volume: number; sets: number; reps: number; sessions: number; dates: string[] }>()
        thisWeekWorkouts.forEach(w => {
          const dateStr = `${new Date(w.date).toLocaleString('en', { month: 'short' })} ${new Date(w.date).getDate()}`
          w.exercises.forEach(ex => {
            const def = getExerciseById(ex.exerciseId)
            if (def) {
              def.primaryMuscles.forEach(m => {
                if (!muscleStats.has(m)) muscleStats.set(m, { volume: 0, sets: 0, reps: 0, sessions: 0, dates: [] })
                const s = muscleStats.get(m)!
                s.volume += calcVolume([ex])
                s.sets += ex.sets.length
                s.reps += ex.sets.reduce((a, st) => a + (st.reps || 0), 0)
                if (!s.dates.includes(dateStr)) { s.dates.push(dateStr); s.sessions += 1 }
              })
            }
          })
        })
        const trainedMuscles = [...muscleStats.entries()].map(([name, s]) => ({ name, ...s }))
          .sort((a, b) => b.volume - a.volume)

        // Streak
        let currentStreak = 0
        let longestStreak = 0
        let tempStreak = 0
        const toLocalDate = (s: string) => { const d = new Date(s); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }
        const today = toLocalDate(new Date().toISOString())
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i)
          const has = workouts.some(w => toLocalDate(w.date).getTime() === d.getTime())
          if (has) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak) }
          else { tempStreak = 0 }
        }
        // Current streak from today backwards
        for (let i = 0; i < 365; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i)
          const has = workouts.some(w => toLocalDate(w.date).getTime() === d.getTime())
          if (has) currentStreak++
          else if (i > 0) break
        }

        // Weekly goal
        const weeklyGoal = 4
        const goalPct = Math.min(100, Math.round((thisWeekWorkouts.length / weeklyGoal) * 100))

        // Intensity score (0-100)
        const volScore = thisWeekVol > 0 ? Math.min(40, (thisWeekVol / Math.max(thisWeekVol, lastWeekVol || 1)) * 40) : 0
        const durScore = thisWeekDur > 0 ? Math.min(30, (thisWeekDur / Math.max(thisWeekDur, lastWeekDur || 1)) * 30) : 0
        const freqScore = Math.min(30, (thisWeekWorkouts.length / 7) * 30)
        const intensityScore = Math.round(volScore + durScore + freqScore)

        // Consistency score (how evenly spaced workouts are)
        const activeDays = thisWeekWorkouts.map(w => new Date(w.date).getDay()).sort((a,b) => a - b)
        const consistencyScore = activeDays.length > 1
          ? Math.round(Math.max(0, 100 - (activeDays[activeDays.length - 1] - activeDays[0]) * 5 + activeDays.length * 10))
          : activeDays.length === 1 ? 50 : 0

        // Overtraining warning
        const volumeJump = lastWeekVol > 0 ? ((thisWeekVol - lastWeekVol) / lastWeekVol) * 100 : 0
        const overtrainingWarning = volumeJump > 50

        // Muscle imbalance
        const topMuscle = sortedMuscles[0]
        const secondMuscle = sortedMuscles[1]
        const imbalanceWarning = topMuscle && secondMuscle && topMuscle.total > secondMuscle.total * 2.5

        // Personal records this week
        const longestSession = thisWeekWorkouts.length > 0 ? thisWeekWorkouts.reduce((best, w) => (w.duration || 0) > (best.duration || 0) ? w : best) : null
        const mostExercises = thisWeekWorkouts.length > 0 ? thisWeekWorkouts.reduce((best, w) => w.exercises.length > best.exercises.length ? w : best) : null

        // AI summary
        const activeCount = dailyData.filter(d => d.count > 0).length
        const peakDay = dailyData.reduce((a, b) => a.volume > b.volume ? a : b)
        const aiSummary = thisWeekWorkouts.length === 0
          ? 'No workouts logged this week. Time to get moving!'
          : intensityScore >= 75
            ? `Strong week with ${thisWeekWorkouts.length} sessions and ${thisWeekVol.toLocaleString()}kg total volume. ${activeCount >= 5 ? 'Great consistency across the week.' : 'Consider spreading workouts more evenly.'}`
            : intensityScore >= 40
              ? `Solid effort with ${thisWeekWorkouts.length} sessions. Peak day was ${peakDay.name} with ${peakDay.volume.toLocaleString()}kg. ${thisWeekWorkouts.length < weeklyGoal ? `Try to hit ${weeklyGoal} sessions next week.` : ''}`
              : `Light week with ${thisWeekWorkouts.length} session${thisWeekWorkouts.length !== 1 ? 's' : ''}. Building consistency is key — aim for ${weeklyGoal} sessions next week.`

        return (
        <motion.div key="weekly-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-80 bg-violet-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

            {/* ═══ WEEK NAV + SECTION TABS ═══ */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button onClick={() => setWeeklyNavOffset(o => o + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                  {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(weekStart.getTime() + 6 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button disabled={weeklyNavOffset === 0} onClick={() => setWeeklyNavOffset(o => Math.min(o - 1, 0))} className={`p-1.5 rounded-xl border transition-all ${weeklyNavOffset === 0 ? 'bg-white/[0.02] border-white/[0.04] text-gray-600 cursor-not-allowed' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20'}`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {weeklyNavOffset !== 0 && (
                  <button onClick={() => setWeeklyNavOffset(0)} className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="Jump to now">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
                {([
                  { key: 'trends' as const, icon: TrendingUp, label: 'Trends' },
                  { key: 'performance' as const, icon: Activity, label: 'Perf.' },
                  { key: 'insights' as const, icon: Sparkles, label: 'Insights' },
                ]).map(tab => {
                  const TabIcon = tab.icon
                  return (
                    <button key={tab.key} onClick={() => setWeeklyTab(tab.key)}
                      className={`relative px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        weeklyTab === tab.key
                          ? tab.key === 'trends' ? 'text-violet-300 bg-gradient-to-b from-violet-500/20 to-violet-500/5 border border-violet-500/25 shadow-lg shadow-violet-500/8'
                          : tab.key === 'performance' ? 'text-cyan-300 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 shadow-lg shadow-cyan-500/8'
                          : 'text-amber-300 bg-gradient-to-b from-amber-500/20 to-amber-500/5 border border-amber-500/25 shadow-lg shadow-amber-500/8'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <TabIcon className="w-3 h-3" />
                        {tab.label}
                      </span>
                      {weeklyTab === tab.key && <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ═══ HERO: Progress Ring + Streak + Intensity + Consistency ═══ */}
            {weeklyTab === 'performance' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Progress Ring */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-black/60 to-violet-500/[0.03] relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
                <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-lg relative z-10">
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#e879f9" />
                    </linearGradient>
                    <filter id="ringGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  </defs>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(168,85,247,0.08)" strokeWidth="7" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="url(#ringGrad)" strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${(goalPct / 100) * 251.2} 251.2`}
                    transform="rotate(-90 50 50)" filter="url(#ringGlow)" />
                  <text x="50" y="42" textAnchor="middle" className="fill-white text-[20px] font-black">{goalPct}<tspan className="text-[11px]">%</tspan></text>
                  <text x="50" y="56" textAnchor="middle" className="fill-gray-500 text-[7px] font-medium uppercase tracking-widest">Goal</text>
                  <text x="50" y="67" textAnchor="middle" className="fill-violet-400 text-[9px] font-bold">{thisWeekWorkouts.length}/{weeklyGoal}</text>
                </svg>
                <span className="text-[9px] text-violet-400/70 mt-1 uppercase tracking-wider font-semibold relative z-10">Weekly Goal</span>
              </div>

              {/* Streak */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.08] via-black/60 to-orange-500/[0.03] relative overflow-hidden">
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center mb-2 relative z-10 shadow-lg shadow-amber-500/10">
                  <Zap className="w-7 h-7 text-amber-400" fill="currentColor" />
                </div>
                <p className="text-2xl font-black text-white relative z-10">{currentStreak}<span className="text-xs text-gray-500 font-normal ml-0.5">d</span></p>
                <p className="text-[9px] text-amber-400/70 uppercase tracking-wider font-semibold relative z-10">Streak</p>
                <p className="text-[9px] text-gray-600 mt-1 relative z-10">Best: {longestStreak}d</p>
              </div>

              {/* Intensity Score */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-black/60 to-teal-500/[0.03] relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative w-16 h-16 mb-2 z-10">
                  <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
                    <defs>
                      <linearGradient id="intGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={intensityScore >= 70 ? '#22c55e' : intensityScore >= 40 ? '#f59e0b' : '#ef4444'} />
                        <stop offset="100%" stopColor={intensityScore >= 70 ? '#4ade80' : intensityScore >= 40 ? '#fbbf24' : '#f87171'} />
                      </linearGradient>
                    </defs>
                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                    <circle cx="30" cy="30" r="25" fill="none" stroke="url(#intGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${(intensityScore / 100) * 157} 157`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{intensityScore}</span>
                </div>
                <p className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-semibold z-10">Intensity</p>
                <p className={`text-[9px] mt-1 font-bold z-10 ${intensityScore >= 70 ? 'text-emerald-400' : intensityScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {intensityScore >= 70 ? 'High' : intensityScore >= 40 ? 'Moderate' : 'Low'}
                </p>
              </div>

              {/* Consistency Score */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-black/60 to-blue-500/[0.03] relative overflow-hidden">
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative w-16 h-16 mb-2 z-10">
                  <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
                    <defs>
                      <linearGradient id="conGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#67e8f9" />
                      </linearGradient>
                    </defs>
                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                    <circle cx="30" cy="30" r="25" fill="none" stroke="url(#conGrad)" strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${(Math.min(100, consistencyScore) / 100) * 157} 157`} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{Math.min(100, consistencyScore)}</span>
                </div>
                <p className="text-[9px] text-cyan-400/70 uppercase tracking-wider font-semibold z-10">Consistency</p>
                <p className="text-[9px] text-gray-600 mt-1 z-10">{activeDays.length}d active</p>
              </div>
            </div>
            )}

            {/* ═══ TRENDS: MEGA CHART ═══ */}
            {weeklyTab === 'trends' && (<>
            <div className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] via-black/60 to-purple-500/[0.04] overflow-hidden">
              {/* Glow orbs */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-violet-500/[0.06] rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/[0.05] rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

              {/* Header: Stats Row */}
              <div className="relative z-10 px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center shadow-lg shadow-violet-500/10">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider">Weekly Overview</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg px-2 py-1 border border-white/[0.06]">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-[9px] text-gray-400 font-medium">This Week</span>
                  </div>
                </div>
                {/* Compact stat row */}
                <div className="flex items-center gap-4 text-center">
                  {[
                    { label: 'Workouts', value: thisWeekWorkouts.length, max: 7, color: 'violet', icon: Dumbbell },
                    { label: 'Volume', value: thisWeekVol, suffix: 'kg', color: 'cyan', icon: Weight },
                    { label: 'Avg', value: thisWeekWorkouts.length > 0 ? Math.round(thisWeekVol / thisWeekWorkouts.length) : 0, suffix: 'kg', color: 'amber', icon: TrendingUp },
                    { label: 'Duration', value: thisWeekDur, suffix: 'min', color: 'emerald', icon: Timer },
                    { label: 'Days', value: dailyData.filter(d => d.count > 0).length, max: 7, color: 'rose', icon: Calendar },
                  ].map(({ label, value, suffix, color, icon: Icon }) => {
                    return (
                      <div key={label} className="flex-1 relative group">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Icon className={`w-3 h-3 text-${color}-400/60`} />
                          <span className="text-[8px] text-gray-500 uppercase tracking-wider font-medium">{label}</span>
                        </div>
                        <p className={`text-lg font-black text-${color}-400`}>
                          {typeof value === 'number' && value >= 1000 ? `${(value/1000).toFixed(1)}` : value}
                          <span className="text-[9px] text-gray-500 font-normal ml-0.5">{suffix || (label === 'Workouts' ? '/7' : label === 'Days' ? '/7' : '')}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chart */}
              <div className="relative z-10 h-64 px-2 pb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyData.map((d, i) => ({
                    name: d.label,
                    fullName: d.name,
                    volume: d.volume,
                    workouts: d.count,
                    types: d.types,
                    dayIndex: i,
                  }))} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="dayBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="dayBarGradActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e879f9" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="volLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#e879f9" />
                      </linearGradient>
                      <filter id="barGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                      <filter id="chartDotGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis yAxisId="vol" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={35} tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} />
                    <YAxis yAxisId="cnt" orientation="right" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 5]} width={15} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0]?.payload
                        return (
                          <div className="rounded-2xl border border-violet-500/25 bg-[#0a0a0a]/95 backdrop-blur-xl p-4 shadow-2xl shadow-violet-500/10 min-w-[180px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                              <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                                <Calendar className="w-3 h-3 text-violet-400" />
                              </div>
                              <span className="text-[11px] font-bold text-violet-300">{data?.fullName || label}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">Volume</span>
                                <span className="text-[11px] font-bold text-white">{(data?.volume || 0).toLocaleString()} kg</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">Sessions</span>
                                <span className="text-[11px] font-bold text-violet-400">{data?.workouts || 0}</span>
                              </div>
                              {data?.types?.length > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-400">Types</span>
                                  <div className="flex gap-1">
                                    {data.types.map((t: string) => (
                                      <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 capitalize font-medium">{t}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }}
                      cursor={{ stroke: 'rgba(168,85,247,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    {/* Volume bars */}
                    <Bar yAxisId="vol" dataKey="volume" radius={[8, 8, 0, 0]} barSize={32}>
                      {dailyData.map((d, i) => {
                        const isMax = d.volume === Math.max(...dailyData.map(dd => dd.volume))
                        const hasWorkouts = d.count > 0
                        return (
                          <Cell key={i} fill={isMax ? 'url(#dayBarGradActive)' : hasWorkouts ? 'url(#dayBarGrad)' : 'rgba(255,255,255,0.03)'}
                            stroke={isMax ? 'rgba(232,121,249,0.4)' : 'none'} strokeWidth={isMax ? 1 : 0}
                            filter={isMax ? 'url(#barGlow)' : undefined} />
                        )
                      })}
                    </Bar>
                    {/* Workout count line */}
                    <Area yAxisId="cnt" type="monotone" dataKey="workouts" stroke="url(#volLineGrad)" strokeWidth={2} fill="none"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props
                        const hasWorkouts = payload.workouts > 0
                        if (!hasWorkouts) return <></>
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={8} fill="rgba(168,85,247,0.1)" filter="url(#chartDotGlow)" />
                            <circle cx={cx} cy={cy} r={4} fill="#e879f9" stroke="#0a0a0a" strokeWidth={2} />
                            <text x={cx} y={cy - 12} textAnchor="middle" className="fill-violet-300 text-[9px] font-bold">{payload.workouts}</text>
                          </g>
                        )
                      }}
                      activeDot={{ r: 6, fill: '#e879f9', stroke: '#0a0a0a', strokeWidth: 2, filter: 'url(#chartDotGlow)' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom: Muscle Load — Premium Radial Dashboard */}
              <div className="relative z-10 px-4 pb-4 pt-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                  <span className="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-semibold">Muscle Load</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent" />
                  <span className="text-[8px] text-gray-600">{trainedMuscles.length} muscles</span>
                </div>
                {trainedMuscles.length > 0 ? (
                  <div className="relative">
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-cyan-500/[0.07] rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-violet-500/[0.05] rounded-full blur-xl pointer-events-none" />
                    {(() => {
                      const totalVol = trainedMuscles.reduce((s, m) => s + m.volume, 0)
                      const totalSets = trainedMuscles.reduce((s, m) => s + m.sets, 0)
                      const totalReps = trainedMuscles.reduce((s, m) => s + m.reps, 0)
                      const totalSessions = new Set(thisWeekWorkouts.map(w => w.date)).size

                      const W = 320, H = 260, cx = W / 2, cy = H / 2
                      const innerR = 38, outerR = 100
                      const n = trainedMuscles.length
                      const gap = 0.035
                      const arcSpan = (Math.PI * 2 - gap * n) / n
                      const startOffset = -Math.PI / 2 - Math.PI / n

                      const muscleColors = [
                        { from: '#22d3ee', to: '#0e7490', glow: 'rgba(34,211,238,' },
                        { from: '#a78bfa', to: '#6d28d9', glow: 'rgba(167,139,250,' },
                        { from: '#f472b6', to: '#be185d', glow: 'rgba(244,114,182,' },
                        { from: '#34d399', to: '#047857', glow: 'rgba(52,211,153,' },
                        { from: '#fbbf24', to: '#b45309', glow: 'rgba(251,191,36,' },
                        { from: '#60a5fa', to: '#1d4ed8', glow: 'rgba(96,165,250,' },
                        { from: '#f87171', to: '#b91c1c', glow: 'rgba(248,113,113,' },
                        { from: '#c084fc', to: '#7e22ce', glow: 'rgba(192,132,252,' },
                      ]

                      // Per-muscle daily volume for mini sparkline
                      const muscleDaily = new Map<string, number[]>()
                      trainedMuscles.forEach(m => {
                        const arr = new Array(7).fill(0)
                        thisWeekWorkouts.forEach(w => {
                          const di = new Date(w.date).getDay()
                          w.exercises.forEach(ex => {
                            const def = getExerciseById(ex.exerciseId)
                            if (def && def.primaryMuscles.includes(m.name as MuscleGroup)) {
                              arr[di] += calcVolume([ex])
                            }
                          })
                        })
                        muscleDaily.set(m.name, arr)
                      })

                      const arcs = trainedMuscles.map((m, i) => {
                        const pct = totalVol > 0 ? m.volume / totalVol : 0
                        const angleSpan = Math.max(arcSpan * (0.25 + pct * 0.75), 0.05)
                        const startA = startOffset + i * (arcSpan + gap)
                        const endA = startA + angleSpan
                        const r = innerR + 6 + pct * (outerR - innerR - 6)
                        const largeArc = angleSpan > Math.PI ? 1 : 0
                        const x1 = cx + innerR * Math.cos(startA), y1 = cy + innerR * Math.sin(startA)
                        const x2 = cx + r * Math.cos(startA), y2 = cy + r * Math.sin(startA)
                        const x3 = cx + r * Math.cos(endA), y3 = cy + r * Math.sin(endA)
                        const x4 = cx + innerR * Math.cos(endA), y4 = cy + innerR * Math.sin(endA)
                        const midA = (startA + endA) / 2
                        const labelR = r + 12
                        const lx = cx + labelR * Math.cos(midA)
                        const ly = cy + labelR * Math.sin(midA)
                        const anchor = Math.cos(midA) > 0.2 ? 'start' as const : Math.cos(midA) < -0.2 ? 'end' as const : 'middle' as const
                        return { m, i, path: `M${x1},${y1} L${x2},${y2} A${r},${r} 0 ${largeArc} 1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 ${largeArc} 0 ${x1},${y1} Z`, lx, ly, anchor, pct, r, startA, endA, midA }
                      })

                      return (
                        <div className="relative">
                          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block">
                            <defs>
                              <filter id="mlGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              <filter id="mlCenterGlow"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              <filter id="mlPointGlow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                              <radialGradient id="mlCenterBg" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.08} />
                                <stop offset="80%" stopColor="#0a0a0a" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#0a0a0a" stopOpacity={1} />
                              </radialGradient>
                              {muscleColors.map((c, i) => (
                                <linearGradient key={i} id={`mlG${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={c.from} stopOpacity={0.95} />
                                  <stop offset="60%" stopColor={c.from} stopOpacity={0.6} />
                                  <stop offset="100%" stopColor={c.to} stopOpacity={0.4} />
                                </linearGradient>
                              ))}
                              {muscleColors.map((c, i) => (
                                <radialGradient key={`r${i}`} id={`mlRG${i}`} cx="50%" cy="50%" r="50%">
                                  <stop offset="0%" stopColor={c.from} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={c.to} stopOpacity={0.05} />
                                </radialGradient>
                              ))}
                            </defs>

                            {/* Ambient rings */}
                            {[0.3, 0.55, 0.8, 1].map((s, i) => (
                              <circle key={i} cx={cx} cy={cy} r={innerR + s * (outerR - innerR)}
                                fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                            ))}

                            {/* Tick marks around outer ring */}
                            {Array.from({ length: 60 }, (_, i) => {
                              const a = (i / 60) * Math.PI * 2 - Math.PI / 2
                              const r1 = outerR + 2, r2 = outerR + (i % 5 === 0 ? 6 : 3)
                              return (
                                <line key={i}
                                  x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)}
                                  x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)}
                                  stroke={i % 5 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}
                                  strokeWidth="1" />
                              )
                            })}

                            {/* Muscle arcs with glow */}
                            {arcs.map((a, i) => (
                              <motion.g key={a.m.name}
                                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                style={{ transformOrigin: `${cx}px ${cy}px` }}>
                                <path d={a.path} fill={`url(#mlRG${i})`} filter="url(#mlGlow)" opacity={0.4} />
                                <path d={a.path} fill={`url(#mlG${i})`} stroke={muscleColors[i].from} strokeWidth={1} strokeOpacity={0.4} />
                                <path d={a.path} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
                                <circle
                                  cx={cx + a.r * Math.cos(a.midA)} cy={cy + a.r * Math.sin(a.midA)}
                                  r={3.5} fill={muscleColors[i].from} filter="url(#mlPointGlow)"
                                  stroke="#0a0a0a" strokeWidth={1.5} />
                              </motion.g>
                            ))}

                            {/* Labels */}
                            {arcs.map((a, i) => (
                              <motion.g key={`lbl-${a.m.name}`}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.08 }}>
                                <text x={a.lx} y={a.ly - 3} textAnchor={a.anchor} dominantBaseline="middle"
                                  className="fill-white/90 text-[8px] capitalize font-bold"
                                  style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                                  {a.m.name.replace(/_/g, ' ')}
                                </text>
                                <text x={a.lx} y={a.ly + 6} textAnchor={a.anchor} dominantBaseline="middle"
                                  className="fill-gray-400 text-[7px] font-semibold">
                                  {a.m.volume >= 1000 ? `${(a.m.volume / 1000).toFixed(1)}k` : a.m.volume}kg
                                  <tspan fill={muscleColors[i].from} opacity={0.8}> · {(a.pct * 100).toFixed(0)}%</tspan>
                                </text>
                                <text x={a.lx} y={a.ly + 13} textAnchor={a.anchor} dominantBaseline="middle"
                                  className="fill-gray-600 text-[6px]">
                                  {a.m.dates.length <= 2 ? a.m.dates.join(' · ') : `${a.m.dates[0]} +${a.m.dates.length - 1} more`}
                                </text>
                              </motion.g>
                            ))}

                            {/* Center hub */}
                            <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                              style={{ transformOrigin: `${cx}px ${cy}px` }}>
                              <circle cx={cx} cy={cy} r={innerR - 2} fill="url(#mlCenterBg)" filter="url(#mlCenterGlow)" />
                              <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="1" />
                              <circle cx={cx} cy={cy} r={innerR - 6} fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" strokeDasharray="2,3" />
                              <text x={cx} y={cy - 16} textAnchor="middle" className="fill-gray-500 text-[6.5px] uppercase tracking-[0.2em] font-semibold">Total Volume</text>
                              <text x={cx} y={cy + 2} textAnchor="middle" className="fill-cyan-400 text-[18px] font-bold" style={{ textShadow: '0 0 12px rgba(34,211,238,0.4)' }}>
                                {totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}k` : totalVol}
                              </text>
                              <text x={cx} y={cy + 13} textAnchor="middle" className="fill-gray-500 text-[7px] font-medium">kg lifted</text>
                              <line x1={cx - 14} y1={cy + 18} x2={cx + 14} y2={cy + 18} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                              <text x={cx} y={cy + 27} textAnchor="middle" className="fill-gray-600 text-[6px]">
                                {totalSets} sets · {totalReps} reps · {totalSessions} days
                              </text>
                            </motion.g>
                          </svg>

                          {/* Muscle detail cards with sparklines */}
                          <div className="space-y-1.5 mt-3">
                            {trainedMuscles.map((m, i) => {
                              const daily = muscleDaily.get(m.name) || new Array(7).fill(0)
                              const maxDaily = Math.max(...daily, 1)
                              const pct = totalVol > 0 ? (m.volume / totalVol) * 100 : 0
                              return (
                                <motion.div key={m.name}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                  className="group relative rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-transparent border border-white/[0.06] p-2.5 hover:border-white/[0.12] transition-all overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-xl"
                                    style={{ background: `linear-gradient(to bottom, ${muscleColors[i % muscleColors.length].from}, ${muscleColors[i % muscleColors.length].to})` }} />
                                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                    style={{ background: `radial-gradient(ellipse at left center, ${muscleColors[i % muscleColors.length].glow}0.06), transparent)` }} />

                                  <div className="relative flex items-center gap-2.5 pl-2">
                                    <div className="w-2 h-2 rounded-full shrink-0"
                                      style={{ background: muscleColors[i % muscleColors.length].from, boxShadow: `0 0 6px ${muscleColors[i % muscleColors.length].glow}0.5)` }} />

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-[9px] text-white font-bold capitalize truncate">{m.name.replace(/_/g, ' ')}</span>
                                        <span className="text-[8px] text-gray-500 font-medium">{m.volume >= 1000 ? `${(m.volume / 1000).toFixed(1)}k` : m.volume}kg</span>
                                        <span className="text-[7px] text-gray-600">·</span>
                                        <span className="text-[7px] text-gray-500">{m.sets} sets</span>
                                      </div>
                                      <div className="mt-1 h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                          transition={{ duration: 0.8, delay: 0.6 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                          className="h-full rounded-full"
                                          style={{ background: `linear-gradient(to right, ${muscleColors[i % muscleColors.length].from}, ${muscleColors[i % muscleColors.length].to})` }} />
                                      </div>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                                        <span className="text-[7px] text-gray-500 truncate">{m.dates.join(' · ')}</span>
                                      </div>
                                    </div>

                                    <div className="shrink-0 w-14 h-8">
                                      <svg width="56" height="32" viewBox="0 0 56 32">
                                        <defs>
                                          <linearGradient id={`spark${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor={muscleColors[i % muscleColors.length].from} stopOpacity={0.4} />
                                            <stop offset="100%" stopColor={muscleColors[i % muscleColors.length].to} stopOpacity={0.02} />
                                          </linearGradient>
                                        </defs>
                                        {daily.map((v: number, di: number) => {
                                          const bh = v > 0 ? Math.max((v / maxDaily) * 22, 2) : 0
                                          const bx = di * 8 + 2
                                          return (
                                            <g key={di}>
                                              {bh > 0 && (
                                                <>
                                                  <rect x={bx} y={28 - bh} width={5} height={bh} rx={1.5}
                                                    fill={muscleColors[i % muscleColors.length].from} opacity={0.7} />
                                                  <rect x={bx} y={28 - bh} width={5} height={1} rx={0.5}
                                                    fill="white" opacity={0.3} />
                                                </>
                                              )}
                                              <rect x={bx} y={27} width={5} height={1} rx={0.5} fill="rgba(255,255,255,0.06)" />
                                            </g>
                                          )
                                        })}
                                      </svg>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-[9px] text-gray-700 italic text-center py-4">No muscle data this week</p>
                )}
              </div>
            </div>

            {/* ═══ SELECTED DAY DETAIL ═══ */}
            <AnimatePresence>
              {selectedDay !== null && (() => {
                const dayWorkouts = thisWeekWorkouts.filter(w => new Date(w.date).getDay() === selectedDay)
                const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][selectedDay]
                const dayVol = dayWorkouts.reduce((s,w) => s + calcVolume(w.exercises), 0)
                const dayDur = dayWorkouts.reduce((s,w) => s + (w.duration||0), 0)
                return (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden">
                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] via-black/60 to-purple-500/[0.03] p-5 relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 w-28 h-28 bg-violet-500/[0.06] rounded-full blur-3xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center shadow-lg shadow-violet-500/10">
                            <Calendar className="w-4 h-4 text-violet-400" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-violet-300">{dayName}</p>
                            <p className="text-[9px] text-gray-500">{dayWorkouts.length} workout{dayWorkouts.length !== 1 ? 's' : ''} · {dayVol.toLocaleString()}kg · {dayDur}min</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedDay(null)} className="text-[9px] text-gray-500 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.06]">close</button>
                      </div>
                      {dayWorkouts.length === 0 ? (
                        <div className="text-center py-6 relative z-10">
                          <Coffee className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                          <p className="text-[11px] text-gray-600">Rest day — no workouts logged</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 relative z-10">
                          {dayWorkouts.map((w, i) => (
                            <motion.div key={w.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/[0.06] to-transparent border border-violet-500/10 hover:border-violet-500/20 transition-all">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
                                <Dumbbell className="w-5 h-5 text-violet-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-white font-bold truncate">{w.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-violet-400/80 font-medium">{calcVolume(w.exercises).toLocaleString()}kg</span>
                                  <span className="text-[9px] text-gray-600">·</span>
                                  <span className="text-[9px] text-gray-500">{w.exercises.length} ex</span>
                                  <span className="text-[9px] text-gray-600">·</span>
                                  <span className="text-[9px] text-gray-500">{w.duration || 0}min</span>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-wrap justify-end max-w-[100px]">
                                {w.exercises.slice(0, 4).map((ex) => {
                                  const def = getExerciseById(ex.exerciseId)
                                  return def ? (
                                    <span key={ex.exerciseId} className="text-[7px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-300/80 border border-violet-500/15 capitalize truncate max-w-[65px]">
                                      {def.primaryMuscles?.[0] || '?'}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })()}
            </AnimatePresence>

            </>)}

            {/* ═══ MUSCLE RADAR + IMBALANCE ═══ */}
            {weeklyTab === 'performance' && (<>
            {sortedMuscles.length > 0 && (() => {
              const radarSize = 140
              const cx = radarSize / 2, cy = radarSize / 2
              const maxR = 55
              const angles = sortedMuscles.slice(0, 6).map((_, i) => (Math.PI * 2 * i / Math.min(sortedMuscles.length, 6)) - Math.PI / 2)
              const radarPoints = sortedMuscles.slice(0, 6).map((m, i) => {
                const r = (m.total / maxMuscleVol) * maxR
                return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) }
              })

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/[0.05] via-black/60 to-blue-500/[0.03] p-4 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-cyan-500/8 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-[10px] font-semibold text-cyan-400/80 uppercase tracking-wider block mb-3 relative z-10">Muscle Radar</span>
                    <div className="flex items-center justify-center relative z-10">
                      <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
                        <defs>
                          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.1} />
                          </linearGradient>
                          <filter id="radarGlow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        {[0.33, 0.66, 1].map((s, i) => (
                          <polygon key={i} points={angles.map(a => `${cx + maxR * s * Math.cos(a)},${cy + maxR * s * Math.sin(a)}`).join(' ')}
                            fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="1" />
                        ))}
                        {angles.map((a, i) => (
                          <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="rgba(34,211,238,0.06)" strokeWidth="1" />
                        ))}
                        <polygon points={radarPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="url(#radarFill)" stroke="rgba(34,211,238,0.6)" strokeWidth="2" filter="url(#radarGlow)" />
                        {radarPoints.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={4} fill="#22d3ee" stroke="#0a0a0a" strokeWidth={2} filter="url(#radarGlow)" />
                            <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-cyan-300/80 text-[7px] capitalize font-semibold">
                              {sortedMuscles[i].name}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* Imbalance Alert + Muscle Bars */}
                  <div className="space-y-3">
                    {imbalanceWarning && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-black/60 to-orange-500/[0.03] p-4 flex items-start gap-3 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-[11px] font-bold text-amber-300">Muscle Imbalance</p>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            {topMuscle.name} ({topMuscle.total.toLocaleString()}kg) is {((topMuscle.total / secondMuscle.total)).toFixed(1)}x higher than {secondMuscle.name} ({secondMuscle.total.toLocaleString()}kg).
                          </p>
                        </div>
                      </motion.div>
                    )}
                    <div>
                      <span className="text-[10px] font-semibold text-cyan-400/80 uppercase tracking-wider block mb-2">Distribution</span>
                      <div className="space-y-2.5">
                        {sortedMuscles.slice(0, 5).map((m, i) => (
                          <motion.div key={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                            className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 w-14 capitalize truncate">{m.name}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(m.total / maxMuscleVol) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.05, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" />
                            </div>
                            <span className="text-[10px] text-cyan-400/70 w-12 text-right font-bold">{m.total.toLocaleString()}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ═══ DONUT CHART + PERSONAL RECORDS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Workout Type Donut */}
              {sortedTypes.length > 0 && (() => {
                const donutSize = 120
                const donutCx = donutSize / 2, donutCy = donutSize / 2
                const outerR = 45, innerR = 30
                const total = sortedTypes.reduce((s, [, c]) => s + c, 0)
                let cumAngle = -Math.PI / 2
                const segments = sortedTypes.map(([type, count]) => {
                  const angle = (count / total) * Math.PI * 2
                  const startAngle = cumAngle
                  const endAngle = cumAngle + angle
                  cumAngle = endAngle
                  const largeArc = angle > Math.PI ? 1 : 0
                  const midAngle = startAngle + angle / 2
                  return {
                    type, count,
                    d: `M ${donutCx + outerR * Math.cos(startAngle)} ${donutCy + outerR * Math.sin(startAngle)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${donutCx + outerR * Math.cos(endAngle)} ${donutCy + outerR * Math.sin(endAngle)} L ${donutCx + innerR * Math.cos(endAngle)} ${donutCy + innerR * Math.sin(endAngle)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${donutCx + innerR * Math.cos(startAngle)} ${donutCy + innerR * Math.sin(startAngle)} Z`,
                    labelX: donutCx + 38 * Math.cos(midAngle),
                    labelY: donutCy + 38 * Math.sin(midAngle),
                  }
                })
                const typeColors: Record<string, string> = { strength: '#a855f7', cardio: '#ef4444', flexibility: '#22d3ee', hiit: '#f59e0b', crossfit: '#22c55e', default: '#6b7280' }

                return (
                  <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.05] via-black/60 to-purple-500/[0.03] p-4 relative overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />
                    <span className="text-[10px] font-semibold text-violet-400/80 uppercase tracking-wider block mb-3 relative z-10">Workout Types</span>
                    <div className="flex items-center justify-center gap-6 relative z-10">
                      <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
                        <defs>
                          <filter id="donutGlow"><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                        </defs>
                        {segments.map((seg) => (
                          <g key={seg.type}>
                            <path d={seg.d} fill={typeColors[seg.type] || typeColors.default} opacity={0.8} stroke="#0a0a0a" strokeWidth="2" filter="url(#donutGlow)" />
                            <text x={seg.labelX} y={seg.labelY} textAnchor="middle" dominantBaseline="middle" className="fill-white text-[8px] font-bold">
                              {Math.round((seg.count / total) * 100)}%
                            </text>
                          </g>
                        ))}
                        <circle cx={donutCx} cy={donutCy} r={innerR - 2} fill="#0a0a0a" />
                        <text x={donutCx} y={donutCy - 3} textAnchor="middle" className="fill-white text-[16px] font-black">{total}</text>
                        <text x={donutCx} y={donutCy + 10} textAnchor="middle" className="fill-gray-500 text-[7px] font-medium uppercase tracking-wider">Total</text>
                      </svg>
                      <div className="space-y-2">
                        {segments.map(seg => (
                          <div key={seg.type} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: typeColors[seg.type] || typeColors.default }} />
                            <span className="text-[10px] text-gray-400 capitalize">{seg.type.replace('_', ' ')}</span>
                            <span className="text-[10px] text-gray-600">×{seg.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Personal Records */}
              <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.05] via-black/60 to-orange-500/[0.03] p-4 relative overflow-hidden">
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-amber-500/8 rounded-full blur-2xl pointer-events-none" />
                <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider block mb-3 relative z-10">Personal Records</span>
                <div className="space-y-2.5 relative z-10">
                  {/* Best Volume */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/[0.08] to-transparent border border-amber-500/15">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-amber-400/60 uppercase tracking-wider">Best Volume</p>
                      <p className="text-[11px] text-white font-bold truncate">{bestWorkout ? bestWorkout.name : '—'}</p>
                    </div>
                    <span className="text-sm font-black text-amber-400">{bestVol.toLocaleString()}<span className="text-[9px] font-normal text-gray-500 ml-0.5">kg</span></span>
                  </div>

                  {/* Longest Session */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/[0.08] to-transparent border border-cyan-500/15">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
                      <Timer className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Longest Session</p>
                      <p className="text-[11px] text-white font-bold truncate">{longestSession ? longestSession.name : '—'}</p>
                    </div>
                    <span className="text-sm font-black text-cyan-400">{longestSession ? longestSession.duration || 0 : 0}<span className="text-[9px] font-normal text-gray-500 ml-0.5">min</span></span>
                  </div>

                  {/* Most Exercises */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-violet-500/[0.08] to-transparent border border-violet-500/15">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
                      <Dumbbell className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-violet-400/60 uppercase tracking-wider">Most Exercises</p>
                      <p className="text-[11px] text-white font-bold truncate">{mostExercises ? mostExercises.name : '—'}</p>
                    </div>
                    <span className="text-sm font-black text-violet-400">{mostExercises ? mostExercises.exercises.length : 0}<span className="text-[9px] font-normal text-gray-500 ml-0.5">ex</span></span>
                  </div>
                </div>
              </div>
            </div>
            </>)}

            {/* ═══ SMART INSIGHTS ═══ */}
            {weeklyTab === 'insights' && (
            <div className="space-y-3">
              <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Insights</span>

              {/* Overtraining Warning */}
              <AnimatePresence>
                {overtrainingWarning && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] via-black/60 to-red-500/[0.03] p-4 flex items-start gap-3 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/10 border border-rose-500/25 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[11px] font-bold text-rose-300">Overtraining Alert</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        Volume jumped {volumeJump.toFixed(0)}% from last week ({lastWeekVol.toLocaleString()}kg → {thisWeekVol.toLocaleString()}kg). Consider deloading.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Summary */}
              <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] via-black/60 to-purple-500/[0.03] p-4 relative overflow-hidden">
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-violet-500/8 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-2.5 relative z-10">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/25 flex items-center justify-center shadow-lg shadow-violet-500/10">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                  </div>
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">AI Weekly Summary</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed relative z-10">{aiSummary}</p>
              </div>

              {/* Weekly Goal Progress */}
              <div className="rounded-2xl border border-emerald-500/15 bg-gradient-to-br from-emerald-500/[0.05] via-black/60 to-green-500/[0.03] p-4 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider">Weekly Goal</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{thisWeekWorkouts.length}/{weeklyGoal}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/[0.04] overflow-hidden relative z-10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
                </div>
                <p className="text-[9px] text-gray-500 mt-2 relative z-10">{goalPct >= 100 ? 'Goal reached!' : `${weeklyGoal - thisWeekWorkouts.length} more session${weeklyGoal - thisWeekWorkouts.length !== 1 ? 's' : ''} to hit goal`}</p>
              </div>

              {/* Rest Days Grid */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rest Days</span>
                  <span className="text-[10px] text-gray-500">
                    <span className="text-emerald-400 font-bold">{7 - new Set(thisWeekWorkouts.map(w => new Date(w.date).toDateString())).size}</span> rest
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: 7 }, (_, i) => {
                    const dayWorkouts = thisWeekWorkouts.filter(w => new Date(w.date).getDay() === i)
                    const active = dayWorkouts.length > 0
                    return (
                      <div key={i} className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${active ? 'bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-300 border border-violet-500/30 shadow-sm shadow-violet-500/10' : 'bg-white/[0.02] text-gray-600 border border-white/[0.04]'}`}>
                        {dayLabels[i]}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            )}
          </div>
        </motion.div>
        )
      })()}</AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.06] via-purple-500/[0.03] to-transparent p-5 space-y-4 shadow-lg shadow-indigo-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-lg" />
              <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Type</label>
                  <button
                    onClick={() => setShowTypeDropdown(true)}
                    className="glass-input w-full text-sm flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>{filters.category ? (categoryLabels[filters.category as ExerciseCategory] || filters.category.charAt(0).toUpperCase() + filters.category.slice(1)) : 'All types'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">From</label>
                  <div className="flex items-center gap-1">
                    <input ref={fromDayRef} type="text" inputMode="numeric" maxLength={2} placeholder="DD"
                      value={fromDay}
                      onChange={(e) => handleSegChange(e.target.value, setFromDay, 2, validateDay, fromMonthRef)}
                      onKeyDown={(e) => handleSegKeyDown(e, fromDay, undefined)}
                      className="glass-input w-12 text-center text-sm" />
                    <span className="text-gray-500 text-xs select-none">/</span>
                    <input ref={fromMonthRef} type="text" inputMode="numeric" maxLength={2} placeholder="MM"
                      value={fromMonth}
                      onChange={(e) => handleSegChange(e.target.value, setFromMonth, 2, validateMonth, fromYearRef)}
                      onKeyDown={(e) => handleSegKeyDown(e, fromMonth, fromDayRef)}
                      className="glass-input w-12 text-center text-sm" />
                    <span className="text-gray-500 text-xs select-none">/</span>
                    <input ref={fromYearRef} type="text" inputMode="numeric" maxLength={4} placeholder="YYYY"
                      value={fromYear}
                      onChange={(e) => handleSegChange(e.target.value, setFromYear, 4, validateYear, undefined)}
                      onKeyDown={(e) => handleSegKeyDown(e, fromYear, fromMonthRef)}
                      className="glass-input w-20 text-center text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">To</label>
                  <div className="flex items-center gap-1">
                    <input ref={toDayRef} type="text" inputMode="numeric" maxLength={2} placeholder="DD"
                      value={toDay}
                      onChange={(e) => handleSegChange(e.target.value, setToDay, 2, validateDay, toMonthRef)}
                      onKeyDown={(e) => handleSegKeyDown(e, toDay, undefined)}
                      className="glass-input w-12 text-center text-sm" />
                    <span className="text-gray-500 text-xs select-none">/</span>
                    <input ref={toMonthRef} type="text" inputMode="numeric" maxLength={2} placeholder="MM"
                      value={toMonth}
                      onChange={(e) => handleSegChange(e.target.value, setToMonth, 2, validateMonth, toYearRef)}
                      onKeyDown={(e) => handleSegKeyDown(e, toMonth, toDayRef)}
                      className="glass-input w-12 text-center text-sm" />
                    <span className="text-gray-500 text-xs select-none">/</span>
                    <input ref={toYearRef} type="text" inputMode="numeric" maxLength={4} placeholder="YYYY"
                      value={toYear}
                      onChange={(e) => handleSegChange(e.target.value, setToYear, 4, validateYear, undefined)}
                      onKeyDown={(e) => handleSegKeyDown(e, toYear, toMonthRef)}
                      className="glass-input w-20 text-center text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Search</label>
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
                <div className="relative flex justify-end">
                  <button
                    onClick={() => { setFilters({}); clearDates() }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 hover:shadow-lg hover:shadow-rose-500/5 transition-all text-xs font-medium flex items-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTypeDropdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowTypeDropdown(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-gray-950/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Workout Type</h3>
                  <button onClick={() => setShowTypeDropdown(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {[null, ...Object.keys(typeConfig)].map((key) => {
                    const label = key ? (categoryLabels[key as ExerciseCategory] || key.charAt(0).toUpperCase() + key.slice(1)) : 'All types'
                    const isActive = key === filters.category || (!key && !filters.category)
                    const cfg = key ? typeConfig[key] : null
                    const CfgIcon = cfg?.icon || Filter
                    return (
                      <button
                        key={key || 'all'}
                        onClick={() => { setFilters((f) => ({ ...f, category: (key as ExerciseCategory) || undefined })); setShowTypeDropdown(false) }}
                        className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg?.bg || 'bg-white/5'}`}>
                          <CfgIcon className={`w-4 h-4 ${isActive && cfg ? cfg.color : 'opacity-70'}`} />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                        {isActive && <Check className="w-4 h-4 ml-auto text-indigo-400 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {sortedWorkouts.length === 0 ? (
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
                {workouts.length === 0 ? (
                  <Button variant="primary" onClick={() => { resetForm(); setShowForm(true) }}>
                    Add Your First Workout
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => { setFilters({}); clearDates() }}>
                    Clear Filters
                  </Button>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div key="list" {...FADE_SLIDE}>
              <div className="space-y-4">
                {sortedWorkouts.map((wo, index) => {
                  const config = typeConfig[wo.category] || typeConfig.strength
                  const Icon = config.icon
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
                                  {categoryLabels[wo.category as ExerciseCategory] || wo.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">
                                {new Date(wo.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(wo as any)}
                              className="p-2 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Edit workout"
                            >
                              <Pencil className="w-4 h-4" />
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
                          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                            <p className="text-2xl font-bold text-sky-400">{formatDuration(wo.duration || 0)}</p>
                            <p className="text-xs text-sky-400/80">Duration</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {wo.exercises.filter((ex, i, arr) => arr.findIndex(e => e.exerciseId === ex.exerciseId) === i).slice(0, 5).map((ex) => (
                            <span key={ex.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-300">
                              {ex.name}
                            </span>
                          ))}
                          {(() => {
                            const uniqueCount = new Set(wo.exercises.map(e => e.exerciseId)).size
                            return uniqueCount > 5 ? (
                              <span className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-gray-400">
                                +{uniqueCount - 5} more
                              </span>
                            ) : null
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )
        }
      </AnimatePresence>

      <ConfirmDialog
        open={!!deletingWorkout}
        title="Delete Workout?"
        message={`This will permanently delete "${deletingWorkout?.name}". This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingWorkout(null)}
      />

      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={() => { setShowSaveModal(false); setSaveTemplateExercises(new Set()); const wasEditing = saveMode === 'edit'; setEditingTemplate(null); if (saveModalFromPicker) { setSaveModalFromPicker(false); setShowTemplatePicker(true) } else if (wasEditing) { setShowTemplatePicker(true) } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{saveMode === 'edit' ? 'Edit Template' : 'Add Workout Template'}</h3>
                  <button onClick={() => { setShowSaveModal(false); setSaveTemplateExercises(new Set()); const wasEditing = saveMode === 'edit'; setEditingTemplate(null); if (saveModalFromPicker) { setSaveModalFromPicker(false); setShowTemplatePicker(true) } else if (wasEditing) { setShowTemplatePicker(true) } }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {saveMode === 'edit' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="glass-input w-full"
                        autoFocus
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Exercises</label>
                        <button onClick={() => setShowExercisePicker(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          Add Exercise
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {exercises.map((ex) => {
                          const cfg = typeConfig[workoutType as ExerciseCategory]
                          const CfgIcon = cfg?.icon || Dumbbell
                          return (
                            <div key={ex.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg?.bg || 'bg-white/10'}`}>
                                <CfgIcon className={`w-3.5 h-3.5 ${cfg?.color || 'text-gray-400'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{ex.name}</p>
                                <p className="text-[10px] text-gray-500">{ex.sets.length} sets · {ex.sets[0]?.reps || '--'} reps{ex.sets[0]?.rpe ? ` · RPE ${ex.sets[0].rpe}` : ''}</p>
                              </div>
                              <button
                                onClick={() => setPendingExerciseConfig({ id: ex.exerciseId, name: ex.name, targetSets: String(ex.sets.length), targetReps: String(ex.sets[0]?.reps || ''), targetRpe: String(ex.sets[0]?.rpe || ''), editExerciseId: ex.id })}
                                className="p-1 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => removeExercise(ex.id)} className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                        {exercises.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">No exercises in this template</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="glass-input w-full"
                        placeholder="e.g. Push Day, Upper Body Strength"
                        autoFocus
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm text-gray-400">Exercises</label>
                        <button onClick={() => setShowExercisePicker(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          Add Exercise
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {exercises.map((ex) => {
                          const cfg = typeConfig[workoutType as ExerciseCategory]
                          const CfgIcon = cfg?.icon || Dumbbell
                          return (
                            <div key={ex.id} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg?.bg || 'bg-white/10'}`}>
                                <CfgIcon className={`w-3.5 h-3.5 ${cfg?.color || 'text-gray-400'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{ex.name}</p>
                                <p className="text-[10px] text-gray-500">{ex.sets.length} sets · {ex.sets[0]?.reps || '--'} reps{ex.sets[0]?.rpe ? ` · RPE ${ex.sets[0].rpe}` : ''}</p>
                              </div>
                              <button
                                onClick={() => setPendingExerciseConfig({ id: ex.exerciseId, name: ex.name, targetSets: String(ex.sets.length), targetReps: String(ex.sets[0]?.reps || ''), targetRpe: String(ex.sets[0]?.rpe || ''), editExerciseId: ex.id })}
                                className="p-1 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => removeExercise(ex.id)} className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                        {exercises.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">No exercises added yet</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} in this template
                    </p>
                  </>
                )}
              </div>
              <div className="p-5 border-t border-white/5 flex gap-3">
                <button onClick={() => { setShowSaveModal(false); setSaveTemplateExercises(new Set()); if (stashedExercises.length > 0) { setExercises(stashedExercises); setStashedExercises([]) }; const wasEditing = saveMode === 'edit'; setEditingTemplate(null); if (saveModalFromPicker) { setSaveModalFromPicker(false); setShowTemplatePicker(true) } else if (wasEditing) { setShowTemplatePicker(true) } }} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => saveAsTemplate(saveName)}
                  disabled={!saveName.trim() || exercises.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveMode === 'edit' ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => { setShowForm(false); setSaveTemplateExercises(new Set()); setEditingTemplate(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{editingTemplate ? 'Edit Template' : 'Add Workout'}</h3>
                  <div className="flex items-center gap-2">
                    {!editingTemplate && (
                      <button onClick={() => setShowTemplatePicker(true)} className="p-1.5 rounded-lg transition-all hover:bg-white/10 text-gray-400" title="Use a template">
                        <Layers className="w-4 h-4" />
                      </button>
                    )}
                    {saveTemplateExercises.size > 0 && (
                      <button
                        onClick={() => {
                          setSaveName(workoutName.trim());
                          setSaveMode('new');
                          setShowSaveModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Save Template
                      </button>
                    )}
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
                          return (
                            <motion.div
                              key={ex.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                              className="rounded-xl border border-white/10 bg-white/[0.03]"
                            >
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button
                                    onClick={() => toggleExpand(ex.id)}
                                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                  >
                                    <span className="font-medium text-white text-sm truncate">{ex.name}</span>
                                  </button>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setSaveTemplateExercises((prev) => {
                                      const next = new Set(prev)
                                      if (next.has(ex.id)) next.delete(ex.id)
                                      else next.add(ex.id)
                                      return next
                                    })}
                                    className={`p-1.5 rounded-lg transition-all ${saveTemplateExercises.has(ex.id) ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                                    title="Save as template"
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
                                                value={set.rpe ?? ''}
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

                                      {/* Rest Timer */}
                                      <div className="flex items-center gap-2 mt-2">
                                        {restTimerEnd != null && restTimerExName === ex.name ? (
                                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                            <Timer className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-sm font-bold text-emerald-400">
                                              {Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000))}s
                                            </span>
                                            <button
                                              onClick={() => { setRestTimerEnd(null); setRestTimerExName('') }}
                                              className="text-[10px] text-gray-500 hover:text-white ml-1"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <>
                                            {[60, 90, 120].map(sec => (
                                              <button
                                                key={sec}
                                                onClick={() => { setRestTimerEnd(Date.now() + sec * 1000); setRestTimerExName(ex.name) }}
                                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all text-[10px]"
                                              >
                                                <Play className="w-2.5 h-2.5" />
                                                {sec}s
                                              </button>
                                            ))}
                                          </>
                                        )}
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
            onSelect={(id) => {
              if (showSaveModal) {
                const ex = getExerciseById(id)
                if (!ex) return
                setPendingExerciseConfig({ id, name: ex.name, targetSets: '3', targetReps: '', targetRpe: '' })
              } else {
                addExercise(id)
              }
            }}
            onClose={() => setShowExercisePicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingExerciseConfig && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[80] p-4" onClick={() => setPendingExerciseConfig(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5">
                <h3 className="text-sm font-semibold text-white">{pendingExerciseConfig.editExerciseId ? 'Edit Exercise' : 'Configure Exercise'}</h3>
                <p className="text-xs text-gray-400 mt-1">{pendingExerciseConfig.name}</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Number of Sets</label>
                  <input
                    type="number"
                    value={pendingExerciseConfig.targetSets}
                    onChange={(e) => setPendingExerciseConfig((prev) => prev ? { ...prev, targetSets: e.target.value } : null)}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Target Reps</label>
                  <input
                    type="number"
                    min={0}
                    value={pendingExerciseConfig.targetReps}
                    onChange={(e) => setPendingExerciseConfig((prev) => prev ? { ...prev, targetReps: e.target.value } : null)}
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Target RPE</label>
                  <select
                    value={pendingExerciseConfig.targetRpe}
                    onChange={(e) => setPendingExerciseConfig((prev) => prev ? { ...prev, targetRpe: e.target.value } : null)}
                    className="glass-input w-full"
                  >
                    <option value="">None</option>
                    <option value="6">6</option>
                    <option value="6.5">6.5</option>
                    <option value="7">7</option>
                    <option value="7.5">7.5</option>
                    <option value="8">8</option>
                    <option value="8.5">8.5</option>
                    <option value="9">9</option>
                    <option value="9.5">9.5</option>
                    <option value="10">10</option>
                  </select>
                </div>
              </div>
              <div className="p-5 border-t border-white/5 flex gap-3">
                <button onClick={() => setPendingExerciseConfig(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!pendingExerciseConfig) return
                    if (pendingExerciseConfig.editExerciseId) {
                      const idx = exercises.findIndex((ex) => ex.id === pendingExerciseConfig.editExerciseId)
                      if (idx === -1) { setPendingExerciseConfig(null); return }
                      const updatedExercises = [...exercises]
                      const existing = updatedExercises[idx]
                      const newSets: ExerciseSet[] = Array.from({ length: parseInt(pendingExerciseConfig.targetSets) || 1 }, (_, i) => ({
                        ...(existing.sets[i] || { weight: undefined, completed: false }),
                        reps: pendingExerciseConfig.targetReps ? parseInt(pendingExerciseConfig.targetReps) || undefined : existing.sets[i]?.reps,
                        rpe: pendingExerciseConfig.targetRpe ? parseFloat(pendingExerciseConfig.targetRpe) || undefined : existing.sets[i]?.rpe,
                      }))
                      updatedExercises[idx] = { ...existing, sets: newSets }
                      setExercises(updatedExercises)
                      setPendingExerciseConfig(null)
                    } else {
                      addExerciseWithConfig(pendingExerciseConfig.id, pendingExerciseConfig.targetSets, pendingExerciseConfig.targetReps, pendingExerciseConfig.targetRpe)
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all text-sm font-medium"
                >
                  {pendingExerciseConfig.editExerciseId ? 'Update' : 'Add'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplatePicker && (
          <TemplatePicker
            savedTemplates={savedTemplates}
            onSelect={(t) => { applyTemplate(t); setShowTemplatePicker(false) }}
            onDelete={deleteSavedTemplate}
            onEditTemplate={(t) => { applyTemplate(t); setShowTemplatePicker(false); setEditingTemplate(t); setSaveName(t.name); setSaveMode('edit'); setShowSaveModal(true) }}
            onClose={() => setShowTemplatePicker(false)}
            onNewTemplate={() => { setShowTemplatePicker(false); setSaveName(''); setSaveMode('new'); setEditingTemplate(null); setStashedExercises(exercises); setExercises([]); setSaveModalFromPicker(true); setShowSaveModal(true) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTypePicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={() => setShowTypePicker(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg max-h-[70vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Select Workout Type</h4>
                  <button onClick={() => setShowTypePicker(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[55vh] p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.entries(typeConfig) as [string, typeof typeConfig['strength']][]).map(([key, cfg]) => {
                    const CfgIcon = cfg.icon
                    const isActive = workoutType === key
                    return (
                      <button
                        key={key}
                        onClick={() => { setWorkoutType(key); setShowTypePicker(false) }}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                          isActive
                            ? `${cfg.bg} ${cfg.color} border-current`
                            : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? cfg.bg : 'bg-white/5'}`}>
                          <CfgIcon className={`w-3.5 h-3.5 ${isActive ? cfg.color : 'opacity-70'}`} />
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
