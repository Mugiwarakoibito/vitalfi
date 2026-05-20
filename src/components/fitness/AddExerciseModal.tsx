import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { parseExerciseFromNaturalLanguage, checkOllamaStatus, type ParsedExercise } from '@/lib/ai-exercise'
import type { ExerciseDefinition, MuscleGroup } from '@/types/fitness'
import { Wand2, X, Loader2, AlertCircle, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AddExerciseModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (exercise: ExerciseDefinition) => void
}

const difficultyColors = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/20'
}

const categoryColors: Record<string, string> = {
  strength: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
  cardio: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  hiit: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  flexibility: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  plyo: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  calisthenics: 'bg-amber-500/15 text-amber-300 border-amber-500/20'
}

const allMuscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'obliques',
  'quads', 'hamstrings', 'glutes', 'calves', 'forearms', 'traps', 'lats',
  'core', 'full_body', 'hip_flexors', 'rear_delts'
]

const muscleColors: Record<string, string> = {
  chest: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  back: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  shoulders: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  biceps: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  triceps: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  abs: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  obliques: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  quads: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  hamstrings: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  glutes: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  calves: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  forearms: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  traps: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  lats: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  core: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  full_body: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  hip_flexors: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  rear_delts: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}



export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedExercise | null>(null)
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)
  const [selectedPrimaryMuscles, setSelectedPrimaryMuscles] = useState<MuscleGroup[]>([])
  const [showMuscleEditor, setShowMuscleEditor] = useState(false)

  const checkStatus = async () => {
    const online = await checkOllamaStatus()
    setOllamaOnline(online)
    return online
  }

  const handleParse = async () => {
    if (!input.trim()) return

    let online = ollamaOnline
    if (online === null) {
      online = await checkStatus()
    }

    if (!online) {
      setError('Ollama is not running. Please start Ollama to use AI exercise parsing.')
      return
    }

    setLoading(true)
    setError(null)
    setParsed(null)
    setSelectedPrimaryMuscles([])
    setShowMuscleEditor(false)

    try {
      const result = await parseExerciseFromNaturalLanguage(input.trim())
      setParsed(result)
      setSelectedPrimaryMuscles(result.primaryMuscles as MuscleGroup[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse exercise')
    } finally {
      setLoading(false)
    }
  }

  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedPrimaryMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    )
  }

  const handleConfirm = () => {
    if (!parsed) return

    const exercise: ExerciseDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: parsed.name,
      category: parsed.category,
      primaryMuscles: selectedPrimaryMuscles,
      secondaryMuscles: parsed.secondaryMuscles,
      equipment: parsed.equipment,
      difficulty: parsed.difficulty,
      instructions: parsed.instructions,
      tips: []
    }

    onAdd(exercise)
    setInput('')
    setParsed(null)
    setError(null)
    setSelectedPrimaryMuscles([])
    setShowMuscleEditor(false)
    onClose()
  }

  const handleClose = () => {
    setInput('')
    setParsed(null)
    setError(null)
    setOllamaOnline(null)
    setSelectedPrimaryMuscles([])
    setShowMuscleEditor(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative overflow-hidden border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/10 rounded-full blur-[60px]" />

              <CardHeader className="relative flex flex-row items-center justify-between pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
                    <Wand2 className="text-primary-light" size={20} />
                  </div>
                  <div>
                    <span className="text-lg">AI Exercise Creator</span>
                    <p className="text-xs text-muted font-normal mt-0.5">Describe exercise in natural language</p>
                  </div>
                </CardTitle>
                <button onClick={handleClose} className="text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </CardHeader>

              <CardContent className="relative space-y-4">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 'do pushups for chest with dumbbells on incline bench', 'burpees for cardio with high intensity', 'barbell squat for leg strength'"
                    className="glass-input min-h-[100px] flex-1 resize-none py-3"
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleParse}
                    disabled={!input.trim() || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Parse Exercise
                      </>
                    )}
                  </Button>
                  <Button variant="default" size="md" onClick={checkStatus} className="px-3">
                    {ollamaOnline === null ? (
                      <Wifi size={16} />
                    ) : ollamaOnline ? (
                      <Wifi size={16} className="text-emerald-400" />
                    ) : (
                      <WifiOff size={16} className="text-rose-400" />
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300 text-sm">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {parsed && (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 size={16} />
                      Exercise parsed successfully
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white">{parsed.name}</h3>

                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-lg border px-3 py-1 text-xs font-semibold capitalize ${categoryColors[parsed.category] || 'bg-white/10'}`}>
                          {parsed.category}
                        </span>
                        <span className={`rounded-lg border px-3 py-1 text-xs font-semibold capitalize ${difficultyColors[parsed.difficulty]}`}>
                          {parsed.difficulty}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted">Primary Muscles:</p>
                          <button
                            onClick={() => setShowMuscleEditor(!showMuscleEditor)}
                            className="text-xs text-primary-light hover:text-primary transition-colors"
                          >
                            {showMuscleEditor ? 'Done' : 'Edit'}
                          </button>
                        </div>
                        {showMuscleEditor ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {allMuscleGroups.map(muscle => (
                              <button
                                key={muscle}
                                onClick={() => toggleMuscle(muscle)}
                                className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                                  selectedPrimaryMuscles.includes(muscle)
                                    ? muscleColors[muscle] || 'bg-white/20'
                                    : 'border-white/[0.08] bg-white/[0.02] text-muted hover:text-white'
                                }`}
                              >
                                {muscle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {selectedPrimaryMuscles.map(muscle => (
                              <span
                                key={muscle}
                                className={`rounded-md border px-2 py-1 text-xs font-medium ${muscleColors[muscle] || 'bg-white/10'}`}
                              >
                                {muscle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            ))}
                            {selectedPrimaryMuscles.length === 0 && (
                              <span className="text-xs text-gray-500">None selected</span>
                            )}
                          </div>
                        )}
                        {parsed.secondaryMuscles.length > 0 && (
                          <p className="text-xs text-muted mt-1">Secondary: {parsed.secondaryMuscles.join(', ')}</p>
                        )}
                        <p className="text-xs text-muted">Equipment: {parsed.equipment.join(', ')}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted font-medium">Instructions:</p>
                        <ol className="space-y-1">
                          {parsed.instructions.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-gray-300">
                              <span className="text-primary-light font-semibold">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="primary" size="sm" onClick={handleConfirm} className="flex-1">
                        <CheckCircle2 size={14} />
                        Add Exercise
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setParsed(null)}>
                        <X size={14} />
                        Edit
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}