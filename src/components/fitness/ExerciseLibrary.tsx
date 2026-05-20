import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { exerciseLibrary, categoryLabels, categoryColors, muscleGroupColors } from '@/lib/exercises'
import type { ExerciseDefinition, ExerciseCategory, MuscleGroup } from '@/types/fitness'
import { Search, Filter, Dumbbell, Flame, Wind, StretchHorizontal, Zap, PersonStanding, X, Wand2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { AddExerciseModal } from './AddExerciseModal'
import { ExerciseDetail } from './ExerciseDetail'

interface ExerciseLibraryProps {
  onSelectExercise?: (exerciseId: string) => void
  selectedIds?: string[]
}

const categories: { value: ExerciseCategory; icon: React.ReactNode; label: string }[] = [
  { value: 'strength', icon: <Dumbbell size={14} />, label: 'Strength' },
  { value: 'cardio', icon: <Wind size={14} />, label: 'Cardio' },
  { value: 'hiit', icon: <Flame size={14} />, label: 'HIIT' },
  { value: 'flexibility', icon: <StretchHorizontal size={14} />, label: 'Flexibility' },
  { value: 'plyo', icon: <Zap size={14} />, label: 'Plyo' },
  { value: 'calisthenics', icon: <PersonStanding size={14} />, label: 'Calisthenics' },
]

const difficultyColors = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/20'
}

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }

export function ExerciseLibrary({ onSelectExercise, selectedIds = [] }: ExerciseLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | null>(null)
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroup | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'difficulty'>('name')
  const [showAddModal, setShowAddModal] = useState(false)
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([])
  const [detailExercise, setDetailExercise] = useState<ExerciseDefinition | null>(null)

  const allExercises = useMemo(() => [...exerciseLibrary, ...customExercises], [customExercises])

  const allMuscles = useMemo(() => {
    const set = new Set<MuscleGroup>()
    allExercises.forEach((ex) => {
      ex.primaryMuscles.forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [allExercises])

  const filtered = useMemo(() => {
    let result = allExercises.filter((ex) => {
      const q = query.toLowerCase().trim()
      const matchesQuery =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primaryMuscles.some((m) => m.includes(q)) ||
        ex.equipment.some((e) => e.includes(q))
      const matchesCategory = !activeCategory || ex.category === activeCategory
      const matchesMuscle = !activeMuscle || ex.primaryMuscles.includes(activeMuscle)
      return matchesQuery && matchesCategory && matchesMuscle
    })
    if (sortBy === 'difficulty') {
      result = [...result].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }
    return result
  }, [query, activeCategory, activeMuscle, sortBy, allExercises])

  const isSelected = (id: string) => selectedIds.includes(id)
  const isCustom = (id: string) => id.startsWith('custom_')

  const handleAddCustom = (exercise: ExerciseDefinition) => {
    setCustomExercises(prev => [exercise, ...prev])
  }

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Exercise Library</CardTitle>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-xs text-muted">
            {allExercises.length} exercises
          </span>
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
      </CardHeader>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search exercises, muscles, equipment..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="glass-input w-full pl-10"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? 'primary' : 'default'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
          </Button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      activeCategory === cat.value
                        ? 'border-primary/40 bg-primary/15 text-primary-light'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
                    }`}
                  >
                    {cat.icon}
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Primary Muscle</p>
              <div className="flex flex-wrap gap-2">
                {allMuscles.map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => setActiveMuscle(activeMuscle === muscle ? null : muscle)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                      activeMuscle === muscle
                        ? 'border-primary/40 bg-primary/15 text-primary-light'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
                    }`}
                  >
                    {muscle.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted">Sort By</p>
              <div className="flex gap-2">
                {(['name', 'difficulty'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200 ${
                      sortBy === s
                        ? 'border-primary/40 bg-primary/15 text-primary-light'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(activeCategory || activeMuscle) && (
              <Button variant="ghost" size="sm" onClick={() => { setActiveCategory(null); setActiveMuscle(null) }}>
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <Card
                hover
                className={`cursor-pointer overflow-hidden transition-all ${isSelected(ex.id) ? 'ring-1 ring-primary/40' : ''}`}
                onClick={() => {
                  if (onSelectExercise) {
                    onSelectExercise(ex.id)
                  } else {
                    setDetailExercise(ex)
                  }
                }}
              >


                <CardContent className={`space-y-3 ${ex.imageUrl ? 'pt-2' : ''}`}>
                  {!ex.imageUrl && (
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">{ex.name}</h4>
                      {isCustom(ex.id) && (
                        <div className="rounded-lg border border-primary/30 bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary-light">
                          <Wand2 size={10} className="mr-1 inline" />
                          AI
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryColors[ex.category]}`}>
                      {categoryLabels[ex.category]}
                    </span>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${difficultyColors[ex.difficulty]}`}>
                      {ex.difficulty}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ex.primaryMuscles.slice(0, 2).map((m) => (
                      <span
                        key={m}
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}
                      >
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {ex.secondaryMuscles.length > 0 && (
                      <span className="inline-block rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
                        +{ex.secondaryMuscles.length}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted line-clamp-2">{ex.instructions[0]}</p>

                  {isSelected(ex.id) && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03]">
              <Search size={24} className="text-muted" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">No exercises found</h3>
            <p className="mb-4 text-sm text-muted">Try adjusting your search or filters</p>
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Wand2 size={14} className="mr-2" />
              Create with AI
            </Button>
          </div>
        )}
      </div>

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