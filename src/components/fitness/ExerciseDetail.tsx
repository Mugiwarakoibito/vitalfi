import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getExerciseById } from '@/lib/exercises'
import { X, ChevronLeft, ChevronRight, CheckCircle2, Info, Dumbbell, Play } from 'lucide-react'
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
    chest: { from: 'from-rose-500/40', to: 'to-rose-700/60' },
    back: { from: 'from-emerald-500/40', to: 'to-emerald-700/60' },
    shoulders: { from: 'from-amber-500/40', to: 'to-amber-700/60' },
    biceps: { from: 'from-sky-500/40', to: 'to-sky-700/60' },
    triceps: { from: 'from-violet-500/40', to: 'to-violet-700/60' },
    abs: { from: 'from-orange-500/40', to: 'to-orange-700/60' },
    quads: { from: 'from-indigo-500/40', to: 'to-indigo-700/60' },
    hamstrings: { from: 'from-teal-500/40', to: 'to-teal-700/60' },
    glutes: { from: 'from-pink-500/40', to: 'to-pink-700/60' },
    calves: { from: 'from-cyan-500/40', to: 'to-cyan-700/60' },
    forearms: { from: 'from-lime-500/40', to: 'to-lime-700/60' },
    traps: { from: 'from-yellow-500/40', to: 'to-yellow-700/60' },
    lats: { from: 'from-fuchsia-500/40', to: 'to-fuchsia-700/60' },
    full_body: { from: 'from-cyan-500/40', to: 'to-cyan-700/60' },
    core: { from: 'from-primary/40', to: 'to-primary-dark/60' },
  }

  const gradient = muscleGradient[exercise.primaryMuscles[0]] || muscleGradient.full_body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="relative lg:w-2/5">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${categoryColors[exercise.category]}`}>
                  {categoryLabels[exercise.category]}
                </span>
                <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${difficultyColors[exercise.difficulty]}`}>
                  {exercise.difficulty}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                {exercise.primaryMuscles.map((m) => (
                  <span key={m} className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${muscleGroupColors[m]}`}>
                    {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>

            

            <ExerciseIllustration
              exerciseId={exercise.id}
              muscle={exercise.primaryMuscles[0]}
              className="absolute inset-0 flex items-center justify-center"
            />
          </div>

          <div className="relative flex flex-1 flex-col lg:w-3/5">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h4 className="text-sm font-semibold text-white">How to Perform</h4>
              <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
              <div className="mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-muted">Step {activeStep + 1} of {exercise.instructions.length}</span>
                  <div className="flex gap-1">
                    {exercise.instructions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`h-1 rounded-full transition-all ${
                          i === activeStep ? 'w-5 bg-primary-light' : 'w-1 bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary-light text-sm font-bold">
                      {activeStep + 1}
                    </div>
                    <p className="text-sm text-white">{exercise.instructions[activeStep]}</p>
                  </div>
                </motion.div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2 text-muted transition-all hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronLeft size={16} className="mx-auto" />
                  </button>
                  <button
                    onClick={() => setActiveStep(Math.min(exercise.instructions.length - 1, activeStep + 1))}
                    disabled={activeStep === exercise.instructions.length - 1}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 p-2 text-muted transition-all hover:bg-white/10 disabled:opacity-30"
                  >
                    <ChevronRight size={16} className="mx-auto" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Dumbbell size={14} className="text-primary-light" />
                  Equipment
                </h5>
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map((eq) => (
                    <span key={eq} className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-300">
                      {eq.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {exercise.tips.length > 0 && (
                <div className="space-y-2">
                  <h5 className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Info size={14} className="text-amber-400" />
                    Pro Tips
                  </h5>
                  {exercise.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-400" />
                      <span className="text-xs text-gray-300">{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-white">Muscles</h5>
                <div className="flex flex-wrap gap-1">
                  {exercise.primaryMuscles.map((m) => (
                    <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]}`}>
                      {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]} opacity-70`}>
                      {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {onStartExercise && (
              <div className="border-t border-white/10 p-3">
                <Button variant="primary" size="md" className="w-full gap-2" onClick={onStartExercise}>
                  <Play size={16} />
                  Add to Workout
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function ExerciseIllustration({ exerciseId, muscle, className }: { exerciseId: string; muscle: string; className?: string }) {
  const colors: Record<string, { primary: string; secondary: string }> = {
    chest: { primary: '#f43f5e', secondary: '#be123c' },
    back: { primary: '#10b981', secondary: '#047857' },
    shoulders: { primary: '#f59e0b', secondary: '#d97706' },
    biceps: { primary: '#0ea5e9', secondary: '#0284c7' },
    triceps: { primary: '#8b5cf6', secondary: '#7c3aed' },
    abs: { primary: '#f97316', secondary: '#ea580c' },
    quads: { primary: '#6366f1', secondary: '#4f46e5' },
    hamstrings: { primary: '#14b8a6', secondary: '#0d9488' },
    glutes: { primary: '#ec4899', secondary: '#db2777' },
    calves: { primary: '#06b6d4', secondary: '#0891b2' },
    forearms: { primary: '#84cc16', secondary: '#65a30d' },
    traps: { primary: '#eab308', secondary: '#ca8a04' },
    lats: { primary: '#d946ef', secondary: '#c026d3' },
    full_body: { primary: '#06b6d4', secondary: '#0891b2' },
    core: { primary: '#22d3ee', secondary: '#06b6d4' },
  }

  const color = colors[muscle] || colors.full_body

  return (
    <div className={className}>
      <svg viewBox="0 0 200 280" className="h-full w-full" style={{ maxHeight: '400px' }}>
        <defs>
          <linearGradient id={`bodyGrad-${muscle}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color.primary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color.secondary} stopOpacity="0.7" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
          </filter>
        </defs>

        <ellipse cx="100" cy="45" rx="25" ry="28" fill={`url(#bodyGrad-${muscle})`} filter="url(#shadow)" />

        <ellipse cx="90" cy="42" rx="3" ry="3" fill="#fff" opacity="0.9" />
        <ellipse cx="110" cy="42" rx="3" ry="3" fill="#fff" opacity="0.9" />
        <path d="M95 52 Q100 56 105 52" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />

        <path
          d="M75 70 Q60 90 55 130 Q50 170 60 200"
          stroke={color.primary}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M125 70 Q140 90 145 130 Q150 170 140 200"
          stroke={color.primary}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        <ellipse cx="100" cy="120" rx="35" ry="45" fill={`url(#bodyGrad-${muscle})`} filter="url(#shadow)" opacity="0.9" />

        <path
          d="M85 160 Q82 200 80 240"
          stroke={color.primary}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M115 160 Q118 200 120 240"
          stroke={color.primary}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        <circle cx="75" cy="245" r="8" fill={color.secondary} filter="url(#glow)" />
        <circle cx="125" cy="245" r="8" fill={color.secondary} filter="url(#glow)" />

        {getExercisePose(exerciseId, color)}
      </svg>
    </div>
  )
}

function getExercisePose(exerciseId: string, color: { primary: string; secondary: string }) {
  const motionPath = color.primary
  const motionGlow = color.secondary

  if (exerciseId.includes('bench') || exerciseId.includes('press')) {
    return (
      <>
        <path d="M60 110 Q40 115 30 110" stroke={motionPath} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M60 110 Q40 115 30 110;M60 100 Q40 105 30 100;M60 110 Q40 115 30 110" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M140 110 Q160 115 170 110" stroke={motionPath} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M140 110 Q160 115 170 110;M140 100 Q160 105 170 100;M140 110 Q160 115 170 110" dur="2s" repeatCount="indefinite" />
        </path>
        <circle cx="100" cy="130" r="5" fill={motionGlow} filter="url(#glow)">
          <animate attributeName="cy" values="130;125;130" dur="2s" repeatCount="indefinite" />
        </circle>
      </>
    )
  }

  if (exerciseId.includes('curl')) {
    return (
      <>
        <path d="M60 120 Q50 100 60 80" stroke={motionPath} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M60 120 Q50 100 60 80;M60 120 Q50 140 60 160;M60 120 Q50 100 60 80" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M140 120 Q150 100 140 80" stroke={motionPath} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M140 120 Q150 100 140 80;M140 120 Q150 140 140 160;M140 120 Q150 100 140 80" dur="2s" repeatCount="indefinite" />
        </path>
      </>
    )
  }

  if (exerciseId.includes('squat') || exerciseId.includes('lunge')) {
    return (
      <>
        <path d="M85 160 Q75 190 85 220" stroke={motionPath} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M85 160 Q75 190 85 220;M85 160 Q65 190 70 220;M85 160 Q75 190 85 220" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M115 160 Q125 190 115 220" stroke={motionPath} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M115 160 Q125 190 115 220;M115 160 Q135 190 130 220;M115 160 Q125 190 115 220" dur="2s" repeatCount="indefinite" />
        </path>
      </>
    )
  }

  if (exerciseId.includes('pull') || exerciseId.includes('row')) {
    return (
      <>
        <path d="M75 90 Q50 120 55 150" stroke={motionPath} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M75 90 Q50 120 55 150;M75 90 Q90 120 100 150;M75 90 Q50 120 55 150" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M125 90 Q150 120 145 150" stroke={motionPath} strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.6">
          <animate attributeName="d" values="M125 90 Q150 120 145 150;M125 90 Q110 120 100 150;M125 90 Q150 120 145 150" dur="2s" repeatCount="indefinite" />
        </path>
      </>
    )
  }

  if (exerciseId.includes('deadlift')) {
    return (
      <>
        <ellipse cx="100" cy="130" rx="35" ry="30" fill={color.primary} opacity="0.5">
          <animate attributeName="ry" values="30;45;30" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <path d="M65 155 L65 200" stroke={motionGlow} strokeWidth="4" opacity="0.8">
          <animate attributeName="d" values="M65 155 L65 200;M65 130 L65 200;M65 155 L65 200" dur="2s" repeatCount="indefinite" />
        </path>
      </>
    )
  }

  if (exerciseId.includes('plank') || exerciseId.includes('push') || exerciseId.includes('crunch')) {
    return (
      <>
        <ellipse cx="100" cy="115" rx="40" ry="20" fill={color.primary} opacity="0.5" />
        <path d="M60 115 L40 115" stroke={motionPath} strokeWidth="8" strokeLinecap="round" opacity="0.6">
          <animate attributeName="d" values="M60 115 L40 115;M60 115 L40 110;M60 115 L40 115" dur="2s" repeatCount="indefinite" />
        </path>
        <path d="M140 115 L160 115" stroke={motionPath} strokeWidth="8" strokeLinecap="round" opacity="0.6">
          <animate attributeName="d" values="M140 115 L160 115;M140 115 L160 120;M140 115 L160 115" dur="2s" repeatCount="indefinite" />
        </path>
      </>
    )
  }

  if (exerciseId.includes('jump') || exerciseId.includes('burpee') || exerciseId.includes('box') || exerciseId.includes('running')) {
    return (
      <>
        <circle cx="100" cy="60" r="30" fill={motionGlow} opacity="0.3" filter="url(#glow)">
          <animate attributeName="cy" values="60;40;60" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="60" r="15" fill={motionPath} opacity="0.6">
          <animate attributeName="cy" values="60;40;60" dur="1s" repeatCount="indefinite" />
        </circle>
      </>
    )
  }

  return (
    <>
      <circle cx="100" cy="60" r="40" fill={motionGlow} opacity="0.2" filter="url(#glow)">
        <animate attributeName="r" values="40;45;40" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M70 200 L70 240" stroke={motionPath} strokeWidth="12" strokeLinecap="round" opacity="0.5">
        <animate attributeName="d" values="M70 200 L70 240;M70 200 L80 240;M70 200 L70 240" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M130 200 L130 240" stroke={motionPath} strokeWidth="12" strokeLinecap="round" opacity="0.5">
        <animate attributeName="d" values="M130 200 L130 240;M130 200 L120 240;M130 200 L130 240" dur="2s" repeatCount="indefinite" />
      </path>
    </>
  )
}