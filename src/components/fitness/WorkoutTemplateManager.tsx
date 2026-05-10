import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { storage } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { exerciseLibrary, getExerciseById } from '@/lib/exercises'
import type { WorkoutTemplate, TemplateExercise } from '@/types/fitness'
import { Plus, Trash2, Save, Copy, Dumbbell, Flame, Wind, StretchHorizontal } from 'lucide-react'

interface WorkoutTemplateManagerProps {
  onUseTemplate?: (template: WorkoutTemplate) => void
}

const typeConfig = {
  strength: { icon: <Dumbbell size={12} />, color: 'text-rose-400', bg: 'bg-rose-500/15' },
  cardio: { icon: <Wind size={12} />, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  hiit: { icon: <Flame size={12} />, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  flexibility: { icon: <StretchHorizontal size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

export function WorkoutTemplateManager({ onUseTemplate }: WorkoutTemplateManagerProps) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const loadTemplates = async () => {
      const stored = await storage.getAll('workoutTemplates') as WorkoutTemplate[]
      setTemplates(stored)
    }
    loadTemplates()
  }, [])
  const [name, setName] = useState('')
  const [type, setType] = useState<WorkoutTemplate['type']>('strength')
  const [exercises, setExercises] = useState<TemplateExercise[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const reset = () => {
    setName('')
    setType('strength')
    setExercises([])
    setSearchQuery('')
  }

  const addExercise = (id: string) => {
    const ex = getExerciseById(id)
    if (!ex) return
    setExercises([...exercises, { exerciseId: ex.id, name: ex.name, targetSets: 3 }])
    setShowPicker(false)
    setSearchQuery('')
  }

  const updateExercise = (index: number, field: keyof TemplateExercise, value: string | number) => {
    setExercises(exercises.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)))
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!name.trim() || exercises.length === 0) return
    const template: WorkoutTemplate = {
      id: generateId(),
      name: name.trim(),
      type,
      exercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await storage.put('workoutTemplates', template)
    setTemplates((prev) => [...prev, template])
    reset()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    await storage.delete('workoutTemplates', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  const filtered = searchQuery.trim()
    ? exerciseLibrary.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : exerciseLibrary.slice(0, 25)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Workout Templates</h3>
          <p className="text-xs text-muted">{templates.length} saved</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Save className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="text-muted">No templates saved yet.</p>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)} className="mt-3">
              Create a template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} hover>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${typeConfig[t.type].bg} ${typeConfig[t.type].color}`}>
                      {typeConfig[t.type].icon}
                      {t.type}
                    </span>
                    <h4 className="font-medium text-white">{t.name}</h4>
                  </div>
                  <div className="flex gap-1">
                    {onUseTemplate && (
                      <Button variant="ghost" size="sm" onClick={() => onUseTemplate(t)} title="Use template">
                        <Copy size={14} className="text-primary-light" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} className="text-muted hover:text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  {t.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{ex.name}</span>
                      <span className="text-muted">{ex.targetSets} sets{ex.targetReps ? ` x ${ex.targetReps} reps` : ''}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); reset() }} title="New Template">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Template Name" placeholder="e.g. Upper Body A" value={name} onChange={(e) => setName(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as WorkoutTemplate['type'])} className="glass-input w-full">
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="flexibility">Flexibility</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Exercises</label>
              <Button variant="default" size="sm" onClick={() => setShowPicker(true)}>
                <Plus size={14} className="mr-1" /> Add
              </Button>
            </div>
            {exercises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] py-6 text-center">
                <p className="text-sm text-muted">No exercises added.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                    <span className="text-sm text-white">{ex.name}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="number"
                        value={ex.targetSets}
                        onChange={(e) => updateExercise(i, 'targetSets', parseInt(e.target.value) || 1)}
                        className="glass-input w-14 px-2 py-1 text-xs"
                        min={1}
                      />
                      <span className="text-xs text-muted">sets</span>
                      <input
                        type="number"
                        value={ex.targetReps ?? ''}
                        onChange={(e) => updateExercise(i, 'targetReps', parseInt(e.target.value) || 0)}
                        placeholder="reps"
                        className="glass-input w-14 px-2 py-1 text-xs"
                      />
                      <button onClick={() => removeExercise(i)} className="text-muted hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowForm(false); reset() }} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleSave} className="flex-1" disabled={!name.trim() || exercises.length === 0}>
              Save Template
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPicker} onClose={() => setShowPicker(false)} title="Select Exercise">
        <div className="space-y-3">
          <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {filtered.map((ex) => (
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
