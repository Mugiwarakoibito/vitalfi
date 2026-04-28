import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage'
import { generateId, formatDuration } from '@/lib/utils'
import { exerciseLibrary, getExerciseById } from '@/lib/exercises'
import type { Workout, WorkoutExercise, ExerciseSet } from '@/types/fitness'
import { Plus, Trash2, Clock, Dumbbell, Flame, Wind, StretchHorizontal, ChevronDown, ChevronUp, Check } from 'lucide-react'

interface WorkoutLoggerProps {
  workouts: Workout[]
  onWorkoutsChange: () => void
}

export function WorkoutLogger({ workouts, onWorkoutsChange }: WorkoutLoggerProps) {
  const [showForm, setShowForm] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState<Workout['type']>('strength')
  const [duration, setDuration] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sortedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workouts]
  )

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return exerciseLibrary.slice(0, 30)
    return exerciseLibrary.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) || ex.primaryMuscles.some((m) => m.includes(q))
    )
  }, [searchQuery])

  const typeConfig = {
    strength: { icon: <Dumbbell size={14} />, color: 'text-rose-400', bg: 'bg-rose-500/15' },
    cardio: { icon: <Wind size={14} />, color: 'text-sky-400', bg: 'bg-sky-500/15' },
    hiit: { icon: <Flame size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/15' },
    flexibility: { icon: <StretchHorizontal size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  }

  const resetForm = () => {
    setWorkoutName('')
    setWorkoutType('strength')
    setDuration('')
    setDate(new Date().toISOString().split('T')[0])
    setExercises([])
    setExpandedExercises(new Set())
  }

  const addExercise = (exerciseId: string) => {
    const ex = getExerciseById(exerciseId)
    if (!ex) return
    const newExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId: ex.id,
      name: ex.name,
      sets: [{ reps: undefined, weight: undefined, completed: false }],
      notes: '',
    }
    setExercises([...exercises, newExercise])
    setExpandedExercises(new Set([...expandedExercises, newExercise.id]))
    setShowExercisePicker(false)
    setSearchQuery('')
  }

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((e) => e.id !== id))
  }

  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: undefined, weight: undefined, completed: false }] }
          : ex
      )
    )
  }

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }
          : ex
      )
    )
  }

  const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: number | boolean) => {
    setExercises(
      exercises.map((ex) =>
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
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedExercises)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedExercises(next)
  }

  const handleSave = async () => {
    if (!workoutName.trim() || exercises.length === 0) return
    const workout: Workout = {
      id: generateId(),
      name: workoutName.trim(),
      type: workoutType,
      date,
      duration: parseInt(duration) || 0,
      exercises: exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({
          reps: s.reps ? Number(s.reps) : undefined,
          weight: s.weight ? Number(s.weight) : undefined,
          duration: s.duration ? Number(s.duration) : undefined,
          distance: s.distance ? Number(s.distance) : undefined,
          completed: s.completed,
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('workouts', workout)
    resetForm()
    setShowForm(false)
    onWorkoutsChange()
  }

  const handleDelete = async (id: string) => {
    await storage.delete('workouts', id)
    onWorkoutsChange()
  }

  const totalVolume = (exs: WorkoutExercise[]) => {
    return exs.reduce((total, ex) => {
      return total + ex.sets.reduce((setTotal, set) => {
        return setTotal + ((set.weight || 0) * (set.reps || 0))
      }, 0)
    }, 0)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Workouts</h3>
          <p className="text-xs text-muted">{workouts.length} logged</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> Log Workout
        </Button>
      </div>

      {sortedWorkouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No workouts logged yet.</p>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="mt-3">
              Log your first workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedWorkouts.map((wo) => (
            <Card key={wo.id} hover>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${typeConfig[wo.type].bg} ${typeConfig[wo.type].color}`}>
                        {typeConfig[wo.type].icon}
                        {wo.type}
                      </span>
                      <h4 className="font-medium text-white">{wo.name}</h4>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      <span>{new Date(wo.date).toLocaleDateString()}</span>
                      {wo.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {formatDuration(wo.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(wo.id)} className="text-muted hover:text-red-400">
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{wo.exercises.length} exercise{wo.exercises.length !== 1 ? 's' : ''}</span>
                  <span>{wo.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} sets</span>
                  {totalVolume(wo.exercises) > 0 && (
                    <span className="text-primary-light">{totalVolume(wo.exercises).toLocaleString()} kg total volume</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {wo.exercises.slice(0, 5).map((ex) => (
                    <span key={ex.id} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-gray-300">
                      {ex.name}
                    </span>
                  ))}
                  {wo.exercises.length > 5 && (
                    <span className="text-[10px] text-muted">+{wo.exercises.length - 5} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); resetForm() }} title="Log Workout" className="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Workout Name" placeholder="e.g. Push Day A" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Type</label>
              <select value={workoutType} onChange={(e) => setWorkoutType(e.target.value as Workout['type'])} className="glass-input w-full">
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
            </div>
            <Input label="Duration (min)" type="number" placeholder="60" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Exercises</label>
              <Button variant="default" size="sm" onClick={() => setShowExercisePicker(true)}>
                <Plus size={14} className="mr-1" /> Add Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
                <p className="text-sm text-muted">No exercises added yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <button
                      onClick={() => toggleExpand(ex.id)}
                      className="flex w-full items-center justify-between px-4 py-3"
                    >
                      <span className="text-sm font-medium text-white">{ex.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}</span>
                        {expandedExercises.has(ex.id) ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                      </div>
                    </button>
                    {expandedExercises.has(ex.id) && (
                      <div className="px-4 pb-4 space-y-2">
                        {ex.sets.map((set, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-6 text-xs text-muted">{i + 1}</span>
                            <input
                              type="number"
                              placeholder="reps"
                              value={set.reps ?? ''}
                              onChange={(e) => updateSet(ex.id, i, 'reps', parseInt(e.target.value) || 0)}
                              className="glass-input w-20 px-2 py-1 text-sm"
                            />
                            <span className="text-xs text-muted">x</span>
                            <input
                              type="number"
                              placeholder="kg"
                              value={set.weight ?? ''}
                              onChange={(e) => updateSet(ex.id, i, 'weight', parseFloat(e.target.value) || 0)}
                              className="glass-input w-20 px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => updateSet(ex.id, i, 'completed', !set.completed)}
                              className={`ml-auto flex h-6 w-6 items-center justify-center rounded-md border transition-all ${
                                set.completed ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-white/[0.08] text-muted'
                              }`}
                            >
                              <Check size={12} />
                            </button>
                            <button onClick={() => removeSet(ex.id, i)} className="text-muted hover:text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addSet(ex.id)} className="w-full">
                          <Plus size={12} className="mr-1" /> Add Set
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeExercise(ex.id)} className="w-full text-red-400 hover:text-red-300">
                          Remove Exercise
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm() }} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!workoutName.trim() || exercises.length === 0}>
              Save Workout
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExercisePicker} onClose={() => setShowExercisePicker(false)} title="Select Exercise">
        <div className="space-y-3">
          <Input placeholder="Search exercises..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {filteredExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => addExercise(ex.id)}
                className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left transition-all hover:bg-white/[0.05]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{ex.name}</p>
                  <p className="text-xs text-muted">{ex.primaryMuscles.slice(0, 3).map((m) => m.replace(/_/g, ' ')).join(', ')}</p>
                </div>
                <Plus size={14} className="text-primary-light" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
