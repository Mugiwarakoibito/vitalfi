import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { parseExerciseFromNaturalLanguage, checkOllamaStatus, type ParsedExercise } from '@/lib/ai-exercise'
import type { ExerciseDefinition } from '@/types/fitness'
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
  plyometrics: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  calisthenics: 'bg-amber-500/15 text-amber-300 border-amber-500/20'
}



export function AddExerciseModal({ isOpen, onClose, onAdd }: AddExerciseModalProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState<ParsedExercise | null>(null)
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null)

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

    try {
      const result = await parseExerciseFromNaturalLanguage(input.trim())
      setParsed(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse exercise')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!parsed) return

    const exercise: ExerciseDefinition = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: parsed.name,
      category: parsed.category,
      primaryMuscles: parsed.primaryMuscles,
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
    onClose()
  }

  const handleClose = () => {
    setInput('')
    setParsed(null)
    setError(null)
    setOllamaOnline(null)
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
                        <p className="text-xs text-muted">Primary: {parsed.primaryMuscles.join(', ')}</p>
                        {parsed.secondaryMuscles.length > 0 && (
                          <p className="text-xs text-muted">Secondary: {parsed.secondaryMuscles.join(', ')}</p>
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