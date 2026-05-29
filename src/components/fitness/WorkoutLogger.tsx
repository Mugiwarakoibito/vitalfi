import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, Pencil, Dumbbell, Flame, ChevronDown, ChevronUp, Check,
  AlertTriangle, Copy, Search, Filter, X,
  TrendingUp, TrendingDown, Minus, Layers,
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
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { WorkoutExercise, ExerciseSet, WorkoutFilter, ExerciseCategory, MuscleGroup } from '@/types/fitness'
import type { Workout, WorkoutTemplate } from '@/lib/storage'

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
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="glass-input text-xs w-auto">
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

  const [filters, setFilters] = useState<WorkoutFilter>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

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
    if (workouts.length === 0) return { score: 0, label: 'Rest', flames: 0 }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const currentWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart)
    const currentWeekCount = currentWeekWorkouts.length
    const currentWeekVol = currentWeekWorkouts.reduce((s, w) => s + calcVolume(w.exercises), 0)

    if (currentWeekCount === 0) {
      return { score: 0, label: 'Rest', flames: 0 }
    }

    const historicalWorkouts = workouts.filter(w => new Date(w.date) < weekStart)

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
  }, [workouts])

  const weeklyVolumeData = useMemo(() => {
    const map = new Map<string, number>()
    workouts.forEach(w => {
      const weekStart = new Date(w.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const key = weekStart.toISOString().split('T')[0]
      map.set(key, (map.get(key) || 0) + calcVolume(w.exercises))
    })
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12)
    return sorted.map(([date, vol]) => ({
      week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: Math.round(vol),
    }))
  }, [workouts])

  const monthlyFreqData = useMemo(() => {
    const map = new Map<string, number>()
    workouts.forEach(w => {
      const key = w.date.slice(0, 7)
      map.set(key, (map.get(key) || 0) + 1)
    })
    const now = new Date()
    const months: { month: string; count: number; label: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      months.push({ month: key, count: map.get(key) || 0, label: d.toLocaleDateString('en-US', { month: 'short' }) })
    }
    return months
  }, [workouts])

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
      <div className="grid grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent p-6 shadow-lg shadow-orange-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-orange-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-rose-500/10 rounded-full -ml-10 -mb-10 blur-lg" />
          <div className="relative">
            <div className="text-orange-400/80 text-xs font-medium uppercase tracking-wider mb-2">Heat Score</div>
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
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/20 via-sky-500/5 to-transparent p-6 shadow-lg shadow-sky-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-cyan-500/10 rounded-full -ml-10 -mb-10 blur-lg" />
          <div className="relative">
            <div className="text-sky-400/80 text-xs font-medium uppercase tracking-wider mb-2">This Week</div>
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
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent p-6 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/15 rounded-full -mr-14 -mt-14 blur-xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-500/10 rounded-full -ml-10 -mb-10 blur-lg" />
          <div className="relative">
            <div className="text-amber-400/80 text-xs font-medium uppercase tracking-wider mb-2">Best Streak</div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{bestStreak}<span className="text-sm text-amber-500/60 ml-1 font-normal">days</span></p>
            <p className="text-xs text-gray-500 mt-1">your record to beat</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {weeklyVolumeData.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.08] to-transparent p-5 shadow-lg shadow-rose-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full -mr-12 -mt-12 blur-lg" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center"><Activity className="w-4 h-4 text-rose-400" /></div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Weekly Volume</h4>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyVolumeData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(weeklyVolumeData.length / 4))} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
                      formatter={(value: number) => [`${value.toLocaleString()}kg`, 'Volume']}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={24}>
                      {weeklyVolumeData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.volume > 0 ? '#f43f5e' : '#374151'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/[0.08] to-transparent p-5 shadow-lg shadow-sky-500/5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full -mr-12 -mt-12 blur-lg" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-sky-400" /></div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Monthly Frequency</h4>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFreqData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} interval={0} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(12px)' }}
                      formatter={(value: number) => [`${value} workouts`, '']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={24}>
                      {monthlyFreqData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.count > 0 ? '#06b6d4' : '#374151'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className={`text-sm font-semibold uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${showHistory ? 'bg-indigo-500/15 border-indigo-500/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            History
          </button>
          <button onClick={() => setShowTemplatePicker(true)} className="text-sm font-semibold text-white uppercase tracking-[0.15em] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Templates
          </button>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-all ${Object.values(filters).some(Boolean) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'}`}>
          <Filter className="w-4 h-4" />
        </button>
      </div>

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
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, category: (e.target.value || undefined) as ExerciseCategory | undefined }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500/40 focus:outline-none focus:shadow-lg focus:shadow-indigo-500/5 transition-all"
                  >
                    <option value="">All types</option>
                    {Object.entries(typeConfig).map(([key]) => (
                      <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500/40 focus:outline-none focus:shadow-lg focus:shadow-indigo-500/5 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-indigo-500/40 focus:outline-none focus:shadow-lg focus:shadow-indigo-500/5 transition-all [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1.5 uppercase tracking-wider font-medium">Search</label>
                  <input
                    type="text"
                    placeholder="Search workouts..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-indigo-500/40 focus:outline-none focus:shadow-lg focus:shadow-indigo-500/5 transition-all"
                  />
                </div>
              </div>
              {Object.values(filters).some(Boolean) && (
                <div className="relative flex justify-end">
                  <button
                    onClick={() => setFilters({})}
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
        {showHistory && (
          sortedWorkouts.length === 0 ? (
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
        )}
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
