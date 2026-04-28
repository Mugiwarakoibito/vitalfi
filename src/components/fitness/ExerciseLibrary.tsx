import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { exerciseLibrary, categoryLabels, categoryColors, muscleGroupColors } from '@/lib/exercises'
import type { ExerciseCategory, MuscleGroup } from '@/types/fitness'
import { Search, Filter, Dumbbell, Flame, Wind, StretchHorizontal, Zap, PersonStanding, X } from 'lucide-react'

interface ExerciseLibraryProps {
  onSelectExercise?: (exerciseId: string) => void
  selectedIds?: string[]
}

const categories: { value: ExerciseCategory; icon: React.ReactNode; label: string }[] = [
  { value: 'strength', icon: <Dumbbell size={14} />, label: 'Strength' },
  { value: 'cardio', icon: <Wind size={14} />, label: 'Cardio' },
  { value: 'hiit', icon: <Flame size={14} />, label: 'HIIT' },
  { value: 'flexibility', icon: <StretchHorizontal size={14} />, label: 'Flexibility' },
  { value: 'plyometrics', icon: <Zap size={14} />, label: 'Plyo' },
  { value: 'calisthenics', icon: <PersonStanding size={14} />, label: 'Calisthenics' },
]

const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }

export function ExerciseLibrary({ onSelectExercise, selectedIds = [] }: ExerciseLibraryProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | null>(null)
  const [activeMuscle, setActiveMuscle] = useState<MuscleGroup | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'difficulty'>('name')

  const allMuscles = useMemo(() => {
    const set = new Set<MuscleGroup>()
    exerciseLibrary.forEach((ex) => {
      ex.primaryMuscles.forEach((m) => set.add(m))
    })
    return Array.from(set).sort()
  }, [])

  const filtered = useMemo(() => {
    let result = exerciseLibrary.filter((ex) => {
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
  }, [query, activeCategory, activeMuscle, sortBy])

  const isSelected = (id: string) => selectedIds.includes(id)

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Exercise Library</CardTitle>
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
          <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
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
          </div>
        )}

        <div className="text-xs text-muted">
          {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} found
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((ex) => (
            <Card
              key={ex.id}
              hover
              className={`cursor-pointer transition-all ${isSelected(ex.id) ? 'ring-1 ring-primary/40' : ''}`}
              onClick={() => onSelectExercise?.(ex.id)}
            >
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-white">{ex.name}</h4>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryColors[ex.category]}`}>
                        {categoryLabels[ex.category]}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        ex.difficulty === 'beginner' ? 'bg-emerald-500/15 text-emerald-400' :
                        ex.difficulty === 'intermediate' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-rose-500/15 text-rose-400'
                      }`}>
                        {ex.difficulty}
                      </span>
                    </div>
                  </div>
                  {isSelected(ex.id) && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary-light" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {ex.primaryMuscles.slice(0, 3).map((m) => (
                    <span
                      key={m}
                      className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}
                    >
                      {m.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted line-clamp-2">{ex.instructions[0]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
