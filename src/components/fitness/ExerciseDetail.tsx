import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getExerciseById } from '@/lib/exercises'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Dumbbell, 
  Play, 
  Target,
  AlertTriangle,
  Zap,
  Timer,
  Layers
} from 'lucide-react'
import { categoryColors, categoryLabels, muscleGroupColors } from '@/lib/exercises'

interface ExerciseDetailProps {
  exerciseId: string
  onClose: () => void
  onStartExercise?: () => void
}

const difficultyColors = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced: 'bg-rose-500/15 text-rose-400 border-rose-500/20'
}

export function ExerciseDetail({ exerciseId, onClose, onStartExercise }: ExerciseDetailProps) {
  const [activeStep, setActiveStep] = useState(0)

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId])

  if (!exercise) return null

  const muscleGradient: Record<string, { from: string; to: string }> = {
    chest: { from: 'from-rose-500/30', to: 'to-rose-700/50' },
    back: { from: 'from-emerald-500/30', to: 'to-emerald-700/50' },
    shoulders: { from: 'from-amber-500/30', to: 'to-amber-700/50' },
    biceps: { from: 'from-sky-500/30', to: 'to-sky-700/50' },
    triceps: { from: 'from-violet-500/30', to: 'to-violet-700/50' },
    abs: { from: 'from-orange-500/30', to: 'to-orange-700/50' },
    quads: { from: 'from-indigo-500/30', to: 'to-indigo-700/50' },
    hamstrings: { from: 'from-teal-500/30', to: 'to-teal-700/50' },
    glutes: { from: 'from-pink-500/30', to: 'to-pink-700/50' },
    calves: { from: 'from-cyan-500/30', to: 'to-cyan-700/50' },
    forearms: { from: 'from-lime-500/30', to: 'to-lime-700/50' },
    traps: { from: 'from-yellow-500/30', to: 'to-yellow-700/50' },
    lats: { from: 'from-fuchsia-500/30', to: 'to-fuchsia-700/50' },
    full_body: { from: 'from-cyan-500/30', to: 'to-cyan-700/50' },
    core: { from: 'from-primary/30', to: 'to-primary-dark/50' },
    hip_flexors: { from: 'from-violet-500/30', to: 'to-violet-700/50' },
    rear_delts: { from: 'from-amber-500/30', to: 'to-amber-700/50' },
  }

  const gradient = muscleGradient[exercise.primaryMuscles[0]] || muscleGradient.full_body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/80">
        <div className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to}`} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMDAwMDEiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative p-6 lg:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase ${categoryColors[exercise.category]}`}>
                    {categoryLabels[exercise.category]}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize ${difficultyColors[exercise.difficulty]}`}>
                    {exercise.difficulty}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 flex items-center gap-1.5">
                    <Timer size={12} className="text-gray-400" />
                    {exercise.instructions.length} steps
                  </span>
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">{exercise.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.primaryMuscles.map((m) => (
                    <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]}`}>
                      {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="rounded-xl p-2.5 text-muted hover:bg-white/10 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <div className="flex items-center justify-center gap-3 p-3 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
                <Layers size={16} className="text-primary-light" />
              </div>
              <h3 className="text-lg font-semibold text-white">Step-by-Step Tutorial</h3>
            </div>
            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-4 mx-3">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-light to-primary rounded-full"
                initial={false}
                animate={{ width: `${((activeStep + 1) / exercise.instructions.length) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 px-3 pb-2">
              {exercise.instructions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`transition-all duration-300 ${
                    i === activeStep
                      ? 'w-8 h-2.5 bg-primary rounded-full'
                      : i < activeStep
                      ? 'w-2.5 h-2.5 bg-primary/50 rounded-full'
                      : 'w-2.5 h-2.5 bg-white/20 rounded-full'
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-2xl font-black text-primary-light">{activeStep + 1}</span>
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 pl-12">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-base lg:text-lg leading-relaxed text-white font-medium">
                      {exercise.instructions[activeStep]}
                    </p>
                    
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-muted">
                        Step {activeStep + 1} of {exercise.instructions.length}
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                      {activeStep === 0 && (
                        <span className="text-xs text-emerald-400 font-medium">Start here</span>
                      )}
                      {activeStep === exercise.instructions.length - 1 && (
                        <span className="text-xs text-amber-400 font-medium">Final step</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-muted transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {exercise.instructions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === activeStep
                      ? 'bg-primary scale-125'
                      : i < activeStep
                      ? 'bg-primary/50'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setActiveStep(Math.min(exercise.instructions.length - 1, activeStep + 1))}
              disabled={activeStep === exercise.instructions.length - 1}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-muted transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/50 border border-white/10">
                  <Dumbbell size={18} className="text-gray-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Equipment</h4>
                  <p className="text-xs text-muted">What you'll need</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((eq) => (
                  <span key={eq} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300">
                    {eq.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/50 border border-white/10">
                  <Target size={18} className="text-gray-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Muscles Targeted</h4>
                  <p className="text-xs text-muted">Primary & secondary</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Primary</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primaryMuscles.map((m) => (
                      <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]}`}>
                        {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
                {exercise.secondaryMuscles.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Secondary</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.secondaryMuscles.map((m) => (
                        <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]} opacity-70`}>
                          {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {exercise.tips.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Zap size={18} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-400">Pro Tips</h4>
                  <p className="text-xs text-amber-400/70">Expert advice for better results</p>
                </div>
              </div>
              <div className="space-y-3">
                {exercise.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-amber-400" />
                    <span className="text-sm text-gray-300 leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exercise.difficulty === 'advanced' && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-400">Advanced Exercise</p>
                <p className="text-xs text-gray-400 mt-1">This exercise requires proper form and experience. Consider starting with a lighter variation if you're new.</p>
              </div>
            </div>
          )}

          {onStartExercise && (
            <div className="pt-4">
              <Button variant="primary" size="lg" className="w-full gap-2 text-base" onClick={onStartExercise}>
                <Play size={20} />
                Add to Workout
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}