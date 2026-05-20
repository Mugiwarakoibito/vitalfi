import { useState, useMemo } from 'react'
import { Plus, Trash2, Clock, Dumbbell, Flame, ChevronDown, ChevronUp, Check, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId, formatDuration } from '@/lib/utils'
import { exerciseLibrary, getExerciseById } from '@/lib/exercises'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { Workout, WorkoutExercise, ExerciseSet } from '@/types/fitness'

export function WorkoutLogger() {
  const { workouts, addWorkout, deleteWorkout } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutType, setWorkoutType] = useState<Workout['type']>('strength')
  const [duration, setDuration] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null)

  const sortedWorkouts = useMemo(() => [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [workouts])

  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return exerciseLibrary.slice(0, 30)
    return exerciseLibrary.filter((ex) => ex.name.toLowerCase().includes(q) || ex.primaryMuscles.some((m) => m.includes(q)))
  }, [searchQuery])

  const typeConfig = {
    strength: { icon: '💪', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' },
    cardio: { icon: '🏃', color: 'text-sky-400', bg: 'bg-sky-500/20 border-sky-500/30' },
    hiit: { icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
    flexibility: { icon: '🧘', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  }

  const totalWorkouts = sortedWorkouts.length
  const totalDuration = sortedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0)
  const totalVolume = sortedWorkouts.reduce((sum, w) => sum + w.exercises.reduce((es, ex) => es + ex.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0), 0)

  const resetForm = () => { setWorkoutName(''); setWorkoutType('strength'); setDuration(''); setDate(new Date().toISOString().split('T')[0]); setExercises([]); setExpandedExercises(new Set()) }

  const addExercise = (exerciseId: string) => {
    const ex = getExerciseById(exerciseId)
    if (!ex) return
    const newExercise: WorkoutExercise = { id: generateId(), exerciseId: ex.id, name: ex.name, sets: [{ reps: undefined, weight: undefined, completed: false }], notes: '' }
    setExercises([...exercises, newExercise])
    setExpandedExercises(new Set([...expandedExercises, newExercise.id]))
    setShowExercisePicker(false)
    setSearchQuery('')
  }

  const removeExercise = (id: string) => setExercises(exercises.filter((e) => e.id !== id))
  const addSet = (exerciseId: string) => setExercises(exercises.map((ex) => ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { reps: undefined, weight: undefined, completed: false }] } : ex))
  const removeSet = (exerciseId: string, setIndex: number) => setExercises(exercises.map((ex) => ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) } : ex))
  const updateSet = (exerciseId: string, setIndex: number, field: keyof ExerciseSet, value: number | boolean) => {
    setExercises(exercises.map((ex) => ex.id === exerciseId ? { ...ex, sets: ex.sets.map((set, i) => i === setIndex ? { ...set, [field]: value } : set) } : ex))
  }
  const toggleExpand = (id: string) => { const next = new Set(expandedExercises); next.has(id) ? next.delete(id) : next.add(id); setExpandedExercises(next) }

  const handleSave = async () => {
    if (!workoutName.trim() || exercises.length === 0) return
    const workout: Workout = { id: generateId(), name: workoutName.trim(), type: workoutType, date, duration: parseInt(duration) || 0, exercises, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    await addWorkout(workout)
    resetForm()
    setShowForm(false)
  }

  const handleDelete = async () => {
    if (!deletingWorkout) return
    await deleteWorkout(deletingWorkout.id)
    setDeletingWorkout(null)
  }

  const calcVolume = (exs: WorkoutExercise[]) => exs.reduce((total, ex) => total + ex.sets.reduce((setTotal, set) => setTotal + ((set.weight || 0) * (set.reps || 0)), 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-2">
              <Dumbbell className="w-4 h-4" />
              <span>Total Workouts</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalWorkouts}</p>
            <p className="text-xs text-gray-500 mt-1">Logged</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>Time Spent</span>
            </div>
            <p className="text-3xl font-bold text-sky-400">{Math.round(totalDuration)}m</p>
            <p className="text-xs text-gray-500 mt-1">Total duration</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-2">
              <Flame className="w-4 h-4" />
              <span>Total Volume</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{totalVolume.toLocaleString()}kg</p>
            <p className="text-xs text-gray-500 mt-1">Lifted</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Workout History</h3>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Log Workout
        </Button>
      </div>

      {sortedWorkouts.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-rose-400/50" />
          </div>
          <p className="text-gray-400 mb-1">No workouts logged yet</p>
          <p className="text-gray-500 text-sm mb-4">Start tracking your fitness journey</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            Log Your First Workout
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedWorkouts.map((wo) => {
            const config = typeConfig[wo.type]
            const volume = calcVolume(wo.exercises)
            return (
              <div key={wo.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${config.bg} flex items-center justify-center text-xl shadow-lg`} style={{boxShadow: '0 0 20px rgba(244,63,94,0.15)'}}>
                        {config.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white tracking-tight">{wo.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>{wo.type}</span>
                        </div>
                        <p className="text-sm text-gray-400">{new Date(wo.date).toLocaleDateString()} • {wo.duration > 0 ? formatDuration(wo.duration) : 'No duration'}</p>
                      </div>
                    </div>
                    <button onClick={() => setDeletingWorkout(wo)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-2xl font-bold text-white">{wo.exercises.length}</p>
                      <p className="text-xs text-gray-500">Exercises</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-2xl font-bold text-white">{wo.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}</p>
                      <p className="text-xs text-gray-500">Sets</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{volume.toLocaleString()}kg</p>
                      <p className="text-xs text-emerald-400/80">Volume</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wo.exercises.slice(0, 4).map((ex) => (
                      <span key={ex.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">{ex.name}</span>
                    ))}
                    {wo.exercises.length > 4 && <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400">+{wo.exercises.length - 4} more</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">Log Workout</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Workout Name</label>
                  <input type="text" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-rose-500/50 focus:outline-none transition-all" placeholder="Push Day, Leg Day, etc." />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <button key={key} onClick={() => setWorkoutType(key as Workout['type'])} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${workoutType === key ? 'bg-rose-500/20 border border-rose-500/50 text-white' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'}`}>
                        <span>{config.icon}</span>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-rose-500/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration (min)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-rose-500/50 focus:outline-none transition-all" placeholder="60" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-400">Exercises</label>
                  <button onClick={() => setShowExercisePicker(true)} className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-sm hover:bg-rose-500/30 transition-all flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {exercises.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
                    <p className="text-sm text-gray-500">No exercises added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exercises.map((ex) => (
                      <div key={ex.id} className="rounded-xl border border-white/10 bg-white/5">
                        <button onClick={() => toggleExpand(ex.id)} className="flex w-full items-center justify-between px-4 py-3">
                          <span className="font-medium text-white">{ex.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{ex.sets.length} sets</span>
                            {expandedExercises.has(ex.id) ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                          </div>
                        </button>
                        {expandedExercises.has(ex.id) && (
                          <div className="px-4 pb-4 space-y-2">
                            {ex.sets.map((set, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-6 text-xs text-gray-500">{i + 1}</span>
                                <input type="number" placeholder="reps" value={set.reps ?? ''} onChange={(e) => updateSet(ex.id, i, 'reps', parseInt(e.target.value) || 0)} className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500/50 focus:outline-none" />
                                <span className="text-xs text-gray-500">x</span>
                                <input type="number" placeholder="kg" value={set.weight ?? ''} onChange={(e) => updateSet(ex.id, i, 'weight', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-rose-500/50 focus:outline-none" />
                                <button onClick={() => updateSet(ex.id, i, 'completed', !set.completed)} className={`ml-auto w-6 h-6 rounded-md border flex items-center justify-center transition-all ${set.completed ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-white/10 text-gray-500'}`}>
                                  <Check size={12} />
                                </button>
                                <button onClick={() => removeSet(ex.id, i)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <button onClick={() => addSet(ex.id)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-sm hover:bg-white/10 transition-all">+ Add Set</button>
                              <button onClick={() => removeExercise(ex.id)} className="px-3 py-2 rounded-lg text-red-400/60 text-sm hover:text-red-400 hover:bg-red-500/10 transition-all">Remove</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); resetForm() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={!workoutName.trim() || exercises.length === 0} className="flex-1 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Save Workout</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowExercisePicker(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Select Exercise</h3>
            <input type="text" placeholder="Search exercises..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-rose-500/50 focus:outline-none transition-all mb-4" />
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {filteredExercises.map((ex) => (
                <button key={ex.id} onClick={() => addExercise(ex.id)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 transition-all">
                  <div>
                    <p className="font-medium text-white">{ex.name}</p>
                    <p className="text-xs text-gray-400">{ex.primaryMuscles.slice(0, 2).map(m => m.replace(/_/g, ' ')).join(', ')}</p>
                  </div>
                  <Plus size={14} className="text-rose-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {deletingWorkout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingWorkout(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Workout?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">This will permanently delete <span className="text-white font-medium">{deletingWorkout.name}</span>. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingWorkout(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}