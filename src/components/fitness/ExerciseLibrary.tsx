import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { exerciseLibrary, categoryLabels, categoryColors, muscleGroupColors } from '@/lib/exercises'
import { useAppStore } from '@/store/useAppStore'
import type { ExerciseDefinition, ExerciseCategory, MuscleGroup, EquipmentType } from '@/types/fitness'
import type { Workout } from '@/types/domain'
import {
  Search, Filter, Dumbbell, Flame, Wind, StretchHorizontal, Zap, PersonStanding,
  X, Wand2, Sparkles, Grid3X3, List, Star, ChevronDown,
  Eye, Bookmark, BookmarkCheck,
  Weight, Settings2, GitBranch, Minus, Circle,
  TrendingUp, Gauge, Crosshair, Activity, Heart, Shield, Sword, Coffee, Waves, Move, Footprints, Equal,
  Clock, Hash, Crown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AddExerciseModal } from './AddExerciseModal'
import { ExerciseDetail } from './ExerciseDetail'

interface ExerciseLibraryProps {
  onSelectExercise?: (exerciseId: string) => void
  selectedIds?: string[]
}

const categories: { value: ExerciseCategory; icon: React.ReactNode; label: string }[] = [
  { value: 'strength', icon: <Dumbbell size={13} />, label: 'Strength' },
  { value: 'hypertrophy', icon: <TrendingUp size={13} />, label: 'Hypertrophy' },
  { value: 'cardio', icon: <Wind size={13} />, label: 'Cardio' },
  { value: 'hiit', icon: <Flame size={13} />, label: 'HIIT' },
  { value: 'functional', icon: <Settings2 size={13} />, label: 'Functional' },
  { value: 'mobility', icon: <Move size={13} />, label: 'Mobility' },
  { value: 'flexibility', icon: <StretchHorizontal size={13} />, label: 'Flexibility' },
  { value: 'plyo', icon: <Zap size={13} />, label: 'Plyo' },
  { value: 'calisthenics', icon: <PersonStanding size={13} />, label: 'Calisthenics' },
  { value: 'endurance', icon: <Activity size={13} />, label: 'Endurance' },
  { value: 'speed_agility', icon: <Gauge size={13} />, label: 'Speed & Agility' },
  { value: 'balance_stability', icon: <Crosshair size={13} />, label: 'Balance' },
  { value: 'core', icon: <Weight size={13} />, label: 'Core' },
  { value: 'yoga', icon: <Heart size={13} />, label: 'Yoga' },
  { value: 'pilates', icon: <Activity size={13} />, label: 'Pilates' },
  { value: 'crossfit', icon: <Shield size={13} />, label: 'CrossFit' },
  { value: 'martial_arts', icon: <Sword size={13} />, label: 'Martial Arts' },
  { value: 'recovery', icon: <Coffee size={13} />, label: 'Recovery' },
  { value: 'isometric', icon: <Equal size={13} />, label: 'Isometric' },
  { value: 'animal_flow', icon: <Footprints size={13} />, label: 'Animal Flow' },
  { value: 'breathwork', icon: <Waves size={13} />, label: 'Breathwork' },
]

const equipmentIcons: Record<string, React.ReactNode> = {
  barbell: <Weight size={12} />,
  dumbbell: <Dumbbell size={12} />,
  kettlebell: <Weight size={12} />,
  machine: <Settings2 size={12} />,
  cable: <GitBranch size={12} />,
  bodyweight: <PersonStanding size={12} />,
  resistance_band: <Minus size={12} />,
  smith_machine: <Settings2 size={12} />,
  medicine_ball: <Circle size={12} />,
  none: <PersonStanding size={12} />,
}

const difficultyColors = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  elite: 'bg-violet-500/15 text-violet-400 border-violet-500/20'
}

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, elite: 4 }

const muscleBorderColors: Record<string, string> = {
  chest: 'border-l-rose-500/60',
  back: 'border-l-emerald-500/60',
  shoulders: 'border-l-amber-500/60',
  biceps: 'border-l-sky-500/60',
  triceps: 'border-l-violet-500/60',
  abs: 'border-l-orange-500/60',
  quads: 'border-l-indigo-500/60',
  hamstrings: 'border-l-teal-500/60',
  glutes: 'border-l-pink-500/60',
  calves: 'border-l-cyan-500/60',
  forearms: 'border-l-lime-500/60',
  traps: 'border-l-yellow-500/60',
  lats: 'border-l-fuchsia-500/60',
  full_body: 'border-l-primary/60',
  core: 'border-l-accent/60',
  obliques: 'border-l-yellow-500/60',
  hip_flexors: 'border-l-blue-500/60',
  rear_delts: 'border-l-amber-500/60',
}

const QUICK_MUSCLE_TABS: { label: string; muscles: MuscleGroup[] }[] = [
  { label: 'Chest', muscles: ['chest'] },
  { label: 'Back', muscles: ['back', 'lats', 'traps'] },
  { label: 'Shoulders', muscles: ['shoulders', 'rear_delts'] },
  { label: 'Arms', muscles: ['biceps', 'triceps', 'forearms'] },
  { label: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  { label: 'Core', muscles: ['abs', 'core', 'obliques'] },
  { label: 'Full Body', muscles: ['full_body'] },
  { label: 'Cardio', muscles: [] },
]

type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'difficulty' | 'muscles' | 'equipment'

function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('vitalfi_exercise_favorites')
      return stored ? new Set(JSON.parse(stored)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      localStorage.setItem('vitalfi_exercise_favorites', JSON.stringify(Array.from(next)))
      return next
    })
  }, [])

  return { favorites, toggleFavorite }
}

function getDaysAgo(dateStr: string): number {
  if (!dateStr) return Infinity
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getDaysAgoPill(days: number): { label: string; color: string } {
  if (days === Infinity) return { label: 'Never', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
  if (days === 0) return { label: 'Today', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
  if (days <= 3) return { label: `${days}d ago`, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' }
  if (days <= 7) return { label: `${days}d ago`, color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' }
  if (days <= 14) return { label: `${days}d ago`, color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' }
  return { label: `${days}d ago`, color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' }
}

export function ExerciseLibrary({ onSelectExercise, selectedIds = [] }: ExerciseLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | null>(null)
  const [activeMuscles, setActiveMuscles] = useState<MuscleGroup[]>([])
  const [activeEquipment, setActiveEquipment] = useState<EquipmentType | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [showAddModal, setShowAddModal] = useState(false)
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([])
  const [detailExercise, setDetailExercise] = useState<ExerciseDefinition | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false)
  const [quickMuscleTab, setQuickMuscleTab] = useState<string | null>(null)

  const { favorites, toggleFavorite } = useFavorites()
  const { workouts } = useAppStore()

  const allExercises = useMemo(() => [...exerciseLibrary, ...customExercises], [customExercises])

  const exerciseUsage = useMemo(() => {
    const usage: Record<string, { count: number; bestWeight: number; bestReps: number; lastUsed: string; firstWeight: number; firstUsed: string }> = {}
    workouts.forEach((w: Workout) => {
      w.exercises.forEach((ex) => {
        if (!usage[ex.exerciseId]) {
          usage[ex.exerciseId] = { count: 0, bestWeight: 0, bestReps: 0, lastUsed: '', firstWeight: Infinity, firstUsed: '' }
        }
        usage[ex.exerciseId].count++
        if (!usage[ex.exerciseId].firstUsed || w.date < usage[ex.exerciseId].firstUsed) usage[ex.exerciseId].firstUsed = w.date
        if (w.date > usage[ex.exerciseId].lastUsed) usage[ex.exerciseId].lastUsed = w.date
        ex.sets.forEach((s) => {
          if (s.weight && s.weight > usage[ex.exerciseId].bestWeight) usage[ex.exerciseId].bestWeight = s.weight
          if (s.reps && s.reps > usage[ex.exerciseId].bestReps) usage[ex.exerciseId].bestReps = s.reps
          if (s.weight && s.weight < usage[ex.exerciseId].firstWeight) usage[ex.exerciseId].firstWeight = s.weight
        })
      })
    })
    Object.keys(usage).forEach(id => {
      if (usage[id].firstWeight === Infinity) usage[id].firstWeight = 0
    })
    return usage
  }, [workouts])

  const mostImproved = useMemo(() => {
    let bestId = ''
    let bestDelta = 0
    Object.entries(exerciseUsage).forEach(([id, u]) => {
      if (u.firstWeight > 0 && u.bestWeight > 0 && u.bestWeight > u.firstWeight) {
        const delta = u.bestWeight - u.firstWeight
        if (delta > bestDelta) { bestDelta = delta; bestId = id }
      }
    })
    if (!bestId) return null
    const ex = allExercises.find(e => e.id === bestId)
    if (!ex) return null
    return { exercise: ex, delta: bestDelta, firstWeight: exerciseUsage[bestId].firstWeight, bestWeight: exerciseUsage[bestId].bestWeight }
  }, [exerciseUsage, allExercises])

  const usageStats = useMemo(() => {
    const totalUses = Object.values(exerciseUsage).reduce((sum, u) => sum + u.count, 0)
    let mostUsedId = ''
    let mostUsedCount = 0
    Object.entries(exerciseUsage).forEach(([id, u]) => {
      if (u.count > mostUsedCount) { mostUsedId = id; mostUsedCount = u.count }
    })
    const mostUsedEx = mostUsedId ? allExercises.find(e => e.id === mostUsedId) : null
    const exercisesWithBests = Object.values(exerciseUsage).filter(u => u.bestWeight > 0 || u.bestReps > 0).length
    return { totalUses, mostUsedEx, mostUsedCount, exercisesWithBests }
  }, [exerciseUsage, allExercises])

  const allMuscles = useMemo(() => {
    const set = new Set<MuscleGroup>()
    allExercises.forEach((ex) => ex.primaryMuscles.forEach((m) => set.add(m)))
    return Array.from(set).sort()
  }, [allExercises])

  const allEquipment = useMemo(() => {
    const set = new Set<EquipmentType>()
    allExercises.forEach((ex) => ex.equipment.forEach((e) => set.add(e)))
    return Array.from(set).sort()
  }, [allExercises])

  const stats = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    const muscleCounts: Record<string, number> = {}
    allExercises.forEach(ex => {
      categoryCounts[ex.category] = (categoryCounts[ex.category] || 0) + 1
      ex.primaryMuscles.forEach(m => {
        muscleCounts[m] = (muscleCounts[m] || 0) + 1
      })
    })
    const maxCategory = Math.max(...Object.values(categoryCounts), 1)
    const maxMuscle = Math.max(...Object.values(muscleCounts), 1)
    return {
      total: allExercises.length,
      categories: categoryCounts,
      maxCategory,
      muscles: muscleCounts,
      maxMuscle,
      customCount: customExercises.length,
    }
  }, [allExercises, customExercises])

  const filtered = useMemo(() => {
    let result = allExercises.filter((ex) => {
      const q = query.toLowerCase().trim()
      const matchesQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscles.some((m) => m.includes(q)) ||
        ex.secondaryMuscles.some((m) => m.includes(q)) ||
        ex.equipment.some((e) => e.includes(q))
      const matchesCategory = !activeCategory || ex.category === activeCategory
      const matchesMuscle = activeMuscles.length === 0 || activeMuscles.some(m => ex.primaryMuscles.includes(m))
      const matchesEquipment = !activeEquipment || ex.equipment.includes(activeEquipment)
      const matchesFavorites = !showFavoritesOnly || favorites.has(ex.id)

      let matchesQuickTab = true
      if (quickMuscleTab) {
        const tab = QUICK_MUSCLE_TABS.find(t => t.label === quickMuscleTab)
        if (tab) {
          if (tab.label === 'Cardio') {
            matchesQuickTab = ex.category === 'cardio'
          } else {
            matchesQuickTab = tab.muscles.some(m => ex.primaryMuscles.includes(m))
          }
        }
      }

      return matchesQuery && matchesCategory && matchesMuscle && matchesEquipment && matchesFavorites && matchesQuickTab
    })

    switch (sortBy) {
      case 'difficulty':
        result = [...result].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
        break
      case 'muscles':
        result = [...result].sort((a, b) => b.primaryMuscles.length - a.primaryMuscles.length)
        break
      case 'equipment':
        result = [...result].sort((a, b) => a.equipment.length - b.equipment.length)
        break
      default:
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [query, activeCategory, activeMuscles, activeEquipment, sortBy, showFavoritesOnly, favorites, allExercises, quickMuscleTab])

  const isSelected = (id: string) => selectedIds.includes(id)
  const isCustom = (id: string) => id.startsWith('custom_')
  const isFavorited = (id: string) => favorites.has(id)

  const handleAddCustom = (exercise: ExerciseDefinition) => {
    setCustomExercises(prev => [exercise, ...prev])
  }

  const clearAllFilters = () => {
    setActiveCategory(null)
    setActiveMuscles([])
    setActiveEquipment(null)
    setShowFavoritesOnly(false)
    setQuery('')
    setQuickMuscleTab(null)
  }

  const activeFilterCount = [activeCategory, activeEquipment, showFavoritesOnly ? 1 : null, ...activeMuscles, quickMuscleTab].filter(Boolean).length

  const formatMuscle = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const formatEquipment = (e: string) => e.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const handleExerciseClick = (ex: ExerciseDefinition) => {
    if (onSelectExercise) {
      onSelectExercise(ex.id)
    } else {
      setDetailExercise(ex)
    }
  }

  return (
    <div className="space-y-6">
      {/* Most Improved Badge */}
      {mostImproved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-4 shadow-lg shadow-amber-500/5"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-amber-400/80 font-semibold uppercase tracking-wider">Most Improved</p>
              <p className="text-lg font-bold text-white">{mostImproved.exercise.name}</p>
              <p className="text-sm text-amber-300">
                +{mostImproved.delta}lbs ({mostImproved.firstWeight} → {mostImproved.bestWeight})
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Exercise Library</h2>
            <p className="text-sm text-muted mt-0.5">
              {stats.total} exercises across {categories.length} categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-muted">
              {stats.total} total
            </span>
            {stats.customCount > 0 && (
              <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary-light">
                {stats.customCount} custom
              </span>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-2"
        >
          <Sparkles size={14} />
          Add with AI
        </Button>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.12] via-violet-500/[0.04] to-transparent p-4 shadow-lg shadow-violet-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/10 rounded-full -mr-8 -mt-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
              <Hash className="w-3.5 h-3.5 text-violet-400" />
              Times Used
            </div>
            <p className="text-2xl font-bold text-white drop-shadow-lg">{usageStats.totalUses}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.12] via-emerald-500/[0.04] to-transparent p-4 shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Most Used
            </div>
            <p className="text-sm font-bold text-white drop-shadow-lg line-clamp-1">{usageStats.mostUsedEx?.name || '—'}</p>
            <p className="text-[10px] text-gray-500">{usageStats.mostUsedCount}x logged</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.12] via-amber-500/[0.04] to-transparent p-4 shadow-lg shadow-amber-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              With PRs
            </div>
            <p className="text-2xl font-bold text-white drop-shadow-lg">{usageStats.exercisesWithBests}</p>
            <p className="text-[10px] text-gray-500">exercises</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.12] via-blue-500/[0.04] to-transparent p-4 shadow-lg shadow-blue-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8 blur-lg" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Last Used
            </div>
            <p className="text-sm font-bold text-white drop-shadow-lg">
              {usageStats.totalUses > 0
                ? new Date(Math.max(...Object.values(exerciseUsage).map(u => new Date(u.lastUsed).getTime()))).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Muscle Group Quick Filter Tabs */}
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          <button
            onClick={() => setQuickMuscleTab(null)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 transition-all text-xs font-semibold whitespace-nowrap ${
              !quickMuscleTab
                ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20'
            }`}
          >
            All
          </button>
          {QUICK_MUSCLE_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setQuickMuscleTab(quickMuscleTab === tab.label ? null : tab.label)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 transition-all text-xs font-semibold whitespace-nowrap ${
                quickMuscleTab === tab.label
                  ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Stats Bar */}
      <div className="relative rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 p-1.5 shadow-lg shadow-black/20">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.03] via-transparent to-emerald-500/[0.03] rounded-xl pointer-events-none" />
        <div className="relative flex gap-1.5 overflow-x-auto pb-0.5">
          {categories.map((cat) => {
            const catCount = stats.categories[cat.value] || 0
            const barWidth = (catCount / stats.maxCategory) * 100
            return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 transition-all duration-200 shrink-0 min-w-[64px] ${
                activeCategory === cat.value
                  ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20'
              }`}
            >
              <span className="text-base drop-shadow-sm">{cat.icon}</span>
              <span className="text-[10px] font-semibold leading-tight text-center">{cat.label}</span>
              <span className="text-[9px] font-medium">{catCount}</span>
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-violet-400/60 transition-all duration-300" style={{ width: `${barWidth}%` }} />
              </div>
            </button>
            )
          })}
        </div>
      </div>

      {/* Muscle Group Bar */}
      <div className="relative rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 p-1.5 shadow-lg shadow-black/20">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-transparent to-violet-500/[0.03] rounded-xl pointer-events-none" />
        <div className="relative flex gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveMuscles([])}
            className={`rounded-lg border px-2.5 py-2 transition-all duration-200 shrink-0 text-[10px] font-semibold whitespace-nowrap ${
              activeMuscles.length === 0
                ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20'
            }`}
          >
            All
          </button>
          {allMuscles.map((muscle) => {
            const muscleCount = stats.muscles[muscle] || 0
            const barWidth = (muscleCount / stats.maxMuscle) * 100
            return (
            <button
              key={muscle}
              onClick={() => setActiveMuscles(prev =>
                prev.includes(muscle)
                  ? prev.filter(m => m !== muscle)
                  : [...prev, muscle]
              )}
              className={`rounded-lg border px-2.5 py-2 transition-all duration-200 shrink-0 text-[10px] font-medium whitespace-nowrap ${
                activeMuscles.includes(muscle)
                  ? 'border-violet-500/50 bg-gradient-to-b from-violet-500/25 to-violet-500/10 text-violet-200 shadow-[0_0_30px_rgba(139,92,246,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{formatMuscle(muscle)}</span>
                <span className="text-[8px] opacity-60">{muscleCount}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden mt-1">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/60 transition-all duration-300" style={{ width: `${barWidth}%` }} />
              </div>
            </button>
            )
          })}
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            placeholder="Search exercises, muscles, equipment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="glass-input w-full pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'default'}
          size="md"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button
          variant={showFavoritesOnly ? 'primary' : 'default'}
          size="md"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          {showFavoritesOnly ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </Button>

        <div className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              {/* Equipment Filter */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Equipment</p>
                <div className="relative">
                  <button
                    onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-muted hover:text-white transition-colors"
                  >
                    {activeEquipment ? (
                      <>
                        {equipmentIcons[activeEquipment]}
                        {formatEquipment(activeEquipment)}
                      </>
                    ) : (
                      'All equipment'
                    )}
                    <ChevronDown size={12} className="ml-auto" />
                  </button>
                  <AnimatePresence>
                    {showEquipmentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 z-20 mt-1 w-56 rounded-xl border border-white/[0.1] bg-slate-900/95 backdrop-blur-xl p-2 shadow-2xl"
                      >
                        <button
                          onClick={() => { setActiveEquipment(null); setShowEquipmentDropdown(false) }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                            !activeEquipment ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                          }`}
                        >
                          All equipment
                        </button>
                        {allEquipment.map((eq) => (
                          <button
                            key={eq}
                            onClick={() => { setActiveEquipment(activeEquipment === eq ? null : eq); setShowEquipmentDropdown(false) }}
                            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                              activeEquipment === eq ? 'bg-white/10 text-white' : 'text-muted hover:text-white'
                            }`}
                          >
                            {equipmentIcons[eq]}
                            {formatEquipment(eq)}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted">Sort By</p>
                <div className="flex gap-2">
                  {([
                    { value: 'name' as SortOption, label: 'Name' },
                    { value: 'difficulty' as SortOption, label: 'Difficulty' },
                    { value: 'muscles' as SortOption, label: 'Muscle Groups' },
                    { value: 'equipment' as SortOption, label: 'Equipment' },
                  ]).map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSortBy(s.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        sortBy === s.value
                          ? 'border-primary/40 bg-primary/15 text-primary-light'
                          : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X size={12} className="mr-1" />
                  Clear all filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Active:</span>
          {quickMuscleTab && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-300">
              {quickMuscleTab}
              <button onClick={() => setQuickMuscleTab(null)} className="hover:text-white"><X size={10} /></button>
            </span>
          )}
          {activeCategory && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary-light">
              {categoryLabels[activeCategory]}
              <button onClick={() => setActiveCategory(null)} className="hover:text-white"><X size={10} /></button>
            </span>
          )}
          {activeEquipment && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
              {formatEquipment(activeEquipment)}
              <button onClick={() => setActiveEquipment(null)} className="hover:text-white"><X size={10} /></button>
            </span>
          )}
          {showFavoritesOnly && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
              <Star size={10} />
              Favorites
              <button onClick={() => setShowFavoritesOnly(false)} className="hover:text-white"><X size={10} /></button>
            </span>
          )}
          {activeMuscles.map(m => (
            <span key={m} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}>
              {formatMuscle(m)}
              <button onClick={() => setActiveMuscles(prev => prev.filter(x => x !== m))} className="hover:text-white"><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
        </span>
        {customExercises.length > 0 && (
          <button
            onClick={() => setCustomExercises([])}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear custom ({customExercises.length})
          </button>
        )}
      </div>

      {/* Exercise Cards */}
      {viewMode === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((ex, index) => {
              const usage = exerciseUsage[ex.id]
              const daysAgo = usage?.lastUsed ? getDaysAgo(usage.lastUsed) : null
              const daysAgoPill = daysAgo !== null ? getDaysAgoPill(daysAgo) : null
              return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
                layout
              >
                <Card
                  hover
                  className={`group cursor-pointer overflow-hidden border-l-4 transition-all duration-300 ${
                    muscleBorderColors[ex.primaryMuscles[0]] || 'border-l-white/20'
                  } ${isSelected(ex.id) ? 'ring-1 ring-primary/40' : ''}`}
                  onClick={() => handleExerciseClick(ex)}
                >
                  <CardContent className="space-y-3">
                    {/* Top Row: Name + Favorite */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-white group-hover:text-primary-light transition-colors line-clamp-1">
                        {ex.name}
                      </h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}
                        className={`shrink-0 p-1 rounded-lg transition-all ${
                          isFavorited(ex.id)
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-muted opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                      >
                        {isFavorited(ex.id) ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                      </button>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryColors[ex.category]}`}>
                        {categoryLabels[ex.category]}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${difficultyColors[ex.difficulty]}`}>
                        {ex.difficulty}
                      </span>
                      {isCustom(ex.id) && (
                        <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary-light">
                          <Wand2 size={8} className="mr-1" />
                          AI
                        </span>
                      )}
                      {/* Last Used Pill */}
                      {daysAgoPill && usage && usage.count > 0 && (
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${daysAgoPill.color}`}>
                          <Clock size={8} className="mr-0.5" />
                          {daysAgoPill.label}
                        </span>
                      )}
                    </div>

                    {/* Muscles */}
                    <div className="flex flex-wrap gap-1">
                      {ex.primaryMuscles.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}
                        >
                          {formatMuscle(m)}
                        </span>
                      ))}
                      {ex.secondaryMuscles.length > 0 && (
                        <span className="inline-block rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
                          +{ex.secondaryMuscles.length}
                        </span>
                      )}
                    </div>

                    {/* Equipment */}
                    <div className="flex flex-wrap gap-1">
                      {ex.equipment.slice(0, 3).map((eq) => (
                        <span
                          key={eq}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted"
                        >
                          {equipmentIcons[eq]}
                          {formatEquipment(eq)}
                        </span>
                      ))}
                    </div>

                    {/* Usage stats */}
                    {usage && usage.count > 0 && (
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{usage.count}x</span>
                        {usage.bestWeight > 0 && (
                          <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{usage.bestWeight}lbs</span>
                        )}
                        {usage.bestReps > 0 && (
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{usage.bestReps} reps</span>
                        )}
                      </div>
                    )}

                    {/* First instruction preview */}
                    <p className="text-xs text-muted line-clamp-2">{ex.instructions[0]}</p>

                    {/* Selection indicator */}
                    {isSelected(ex.id) && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((ex, index) => {
              const usage = exerciseUsage[ex.id]
              const daysAgo = usage?.lastUsed ? getDaysAgo(usage.lastUsed) : null
              const daysAgoPill = daysAgo !== null ? getDaysAgoPill(daysAgo) : null
              return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15, delay: Math.min(index * 0.01, 0.2) }}
                layout
              >
                <Card
                  hover
                  className={`group cursor-pointer overflow-hidden border-l-4 transition-all duration-200 ${
                    muscleBorderColors[ex.primaryMuscles[0]] || 'border-l-white/20'
                  } ${isSelected(ex.id) ? 'ring-1 ring-primary/40' : ''}`}
                  onClick={() => handleExerciseClick(ex)}
                >
                  <CardContent className="flex items-center gap-4 py-3">
                    {/* Muscle color indicator */}
                    <div className={`shrink-0 w-1 h-10 rounded-full ${
                      muscleGroupColors[ex.primaryMuscles[0]]?.replace('text-', 'bg-').split(' ')[0] || 'bg-white/20'
                    }`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white text-sm group-hover:text-primary-light transition-colors truncate">
                          {ex.name}
                        </h4>
                        {isCustom(ex.id) && (
                          <span className="inline-flex items-center rounded border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary-light">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${categoryColors[ex.category]}`}>
                          {categoryLabels[ex.category]}
                        </span>
                        <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-semibold capitalize ${difficultyColors[ex.difficulty]}`}>
                          {ex.difficulty}
                        </span>
                        {ex.primaryMuscles.slice(0, 2).map(m => (
                          <span key={m} className={`rounded px-1.5 py-0.5 text-[9px] ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}>
                            {formatMuscle(m)}
                          </span>
                        ))}
                        {daysAgoPill && usage && usage.count > 0 && (
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${daysAgoPill.color}`}>
                            <Clock size={7} className="mr-0.5" />
                            {daysAgoPill.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {/* Usage info */}
                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-gray-500">
                      {usage && usage.count > 0 && (
                        <span className="hidden sm:inline">{usage.count}x</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.id) }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isFavorited(ex.id) ? 'text-amber-400' : 'text-muted opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                      >
                        {isFavorited(ex.id) ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
                      </button>
                      <Eye size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-16 text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Search size={28} className="text-muted" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-white">No exercises found</h3>
          <p className="mb-6 text-sm text-muted max-w-sm">
            {showFavoritesOnly
              ? "You haven't favorited any exercises yet. Browse the library and star the ones you love!"
              : "Try adjusting your search terms or clearing some filters to discover more exercises."}
          </p>
          <div className="flex gap-3">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="md" onClick={clearAllFilters}>
                <X size={14} className="mr-2" />
                Clear filters
              </Button>
            )}
            <Button variant="primary" size="md" onClick={() => setShowAddModal(true)}>
              <Wand2 size={14} className="mr-2" />
              Create with AI
            </Button>
          </div>
        </motion.div>
      )}

      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustom}
      />

      {detailExercise && (
        <ExerciseDetail
          exerciseId={detailExercise.id}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  )
}
