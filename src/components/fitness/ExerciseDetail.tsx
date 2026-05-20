import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getExerciseById } from '@/lib/exercises'
import { X, ChevronLeft, ChevronRight, CheckCircle2, Info, Dumbbell, Play, Pause, RotateCcw } from 'lucide-react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  const exercise = useMemo(() => getExerciseById(exerciseId), [exerciseId])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4)
      }, 800)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

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
    hip_flexors: { from: 'from-violet-500/40', to: 'to-violet-700/60' },
    rear_delts: { from: 'from-amber-500/40', to: 'to-amber-700/60' },
  }

  const gradient = muscleGradient[exercise.primaryMuscles[0]] || muscleGradient.full_body

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <Card className="overflow-hidden border-white/10">
        <div className="flex flex-col lg:flex-row">
          <div className="relative lg:w-2/5 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} opacity-30`} />
            
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${categoryColors[exercise.category]}`}>
                {categoryLabels[exercise.category]}
              </span>
              <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold capitalize ${difficultyColors[exercise.difficulty]}`}>
                {exercise.difficulty}
              </span>
            </div>

            <ExerciseAnimation
              exerciseId={exercise.id}
              muscle={exercise.primaryMuscles[0]}
              phase={animationPhase}
              className="absolute inset-0 flex items-center justify-center"
            />

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-4">
              <h3 className="text-xl font-bold text-white mb-1">{exercise.name}</h3>
              <div className="flex flex-wrap gap-1">
                {exercise.primaryMuscles.map((m) => (
                  <span key={m} className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${muscleGroupColors[m]}`}>
                    {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute right-4 top-4 z-20 flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => setAnimationPhase(0)}
                className="rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col lg:w-3/5 bg-slate-900/50">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20">
                  <Dumbbell size={16} className="text-primary-light" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">How to Perform</h4>
                  <p className="text-xs text-muted">{exercise.instructions.length} steps</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '500px' }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/30 text-primary-light text-xs font-bold">
                      {activeStep + 1}
                    </div>
                    <span className="text-xs text-muted">Step {activeStep + 1} of {exercise.instructions.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                      disabled={activeStep === 0}
                      className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setActiveStep(Math.min(exercise.instructions.length - 1, activeStep + 1))}
                      disabled={activeStep === exercise.instructions.length - 1}
                      className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary-light rounded-full"
                    initial={false}
                    animate={{ width: `${((activeStep + 1) / exercise.instructions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {exercise.instructions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeStep
                          ? 'bg-primary-light'
                          : i < activeStep
                          ? 'bg-primary/60'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20">
                        <span className="text-lg font-bold text-primary-light">{activeStep + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed text-white">{exercise.instructions[activeStep]}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-center gap-2">
                  {exercise.instructions.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      className={`rounded-full transition-all ${
                        i === activeStep
                          ? 'w-6 h-6 bg-primary text-white'
                          : i < activeStep
                          ? 'w-3 h-3 bg-primary/60'
                          : 'w-3 h-3 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700/50">
                    <Dumbbell size={12} className="text-slate-400" />
                  </div>
                  <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Equipment Needed</h5>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map((eq) => (
                    <span key={eq} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                      {eq.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>

              {exercise.tips.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20">
                      <Info size={12} className="text-amber-400" />
                    </div>
                    <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pro Tips</h5>
                  </div>
                  {exercise.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-amber-400" />
                      <span className="text-xs text-gray-300 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <h5 className="text-xs font-semibold text-white uppercase tracking-wider">Muscles Targeted</h5>
                <div className="flex flex-wrap gap-2">
                  <div className="w-full">
                    <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Primary</p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.primaryMuscles.map((m) => (
                        <span key={m} className={`rounded-md px-2 py-0.5 text-xs font-medium ${muscleGroupColors[m]}`}>
                          {m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                  {exercise.secondaryMuscles.length > 0 && (
                    <div className="w-full mt-2">
                      <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Secondary</p>
                      <div className="flex flex-wrap gap-1">
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

            {onStartExercise && (
              <div className="border-t border-white/10 p-4 bg-slate-900/80">
                <Button variant="primary" size="lg" className="w-full gap-2" onClick={onStartExercise}>
                  <Play size={18} />
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

function ExerciseAnimation({ exerciseId, muscle, phase, className }: { exerciseId: string; muscle: string; phase: number; className?: string }) {
  const colors: Record<string, { primary: string; secondary: string; glow: string }> = {
    chest: { primary: '#f43f5e', secondary: '#be123c', glow: '#f43f5e40' },
    back: { primary: '#10b981', secondary: '#047857', glow: '#10b98140' },
    shoulders: { primary: '#f59e0b', secondary: '#d97706', glow: '#f59e0b40' },
    biceps: { primary: '#0ea5e9', secondary: '#0284c7', glow: '#0ea5e940' },
    triceps: { primary: '#8b5cf6', secondary: '#7c3aed', glow: '#8b5cf640' },
    abs: { primary: '#f97316', secondary: '#ea580c', glow: '#f9731640' },
    quads: { primary: '#6366f1', secondary: '#4f46e5', glow: '#6366f140' },
    hamstrings: { primary: '#14b8a6', secondary: '#0d9488', glow: '#14b8a640' },
    glutes: { primary: '#ec4899', secondary: '#db2777', glow: '#ec489940' },
    calves: { primary: '#06b6d4', secondary: '#0891b2', glow: '#06b6d440' },
    forearms: { primary: '#84cc16', secondary: '#65a30d', glow: '#84cc1640' },
    traps: { primary: '#eab308', secondary: '#ca8a04', glow: '#eab30840' },
    lats: { primary: '#d946ef', secondary: '#c026d3', glow: '#d946ef40' },
    full_body: { primary: '#06b6d4', secondary: '#0891b2', glow: '#06b6d440' },
    core: { primary: '#22d3ee', secondary: '#06b6d4', glow: '#22d3ee40' },
    hip_flexors: { primary: '#a855f7', secondary: '#9333ea', glow: '#a855f740' },
    rear_delts: { primary: '#f59e0b', secondary: '#d97706', glow: '#f59e0b40' },
  }

  const color = colors[muscle] || colors.full_body
  const poses = getExercisePoses(exerciseId, color, phase)

  return (
    <div className={className}>
      <svg viewBox="0 0 240 340" className="h-full w-full">
        <defs>
          <linearGradient id={`bodyGrad-${muscle}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color.primary} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color.secondary} stopOpacity="0.7" />
          </linearGradient>
          <radialGradient id={`glow-${muscle}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color.primary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color.primary} stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${muscle}-filter`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse cx="120" cy="50" rx="35" ry="38" fill={`url(#bodyGrad-${muscle})`} />

        <ellipse cx="108" cy="45" rx="4" ry="4" fill="#fff" opacity="0.95" />
        <ellipse cx="132" cy="45" rx="4" ry="4" fill="#fff" opacity="0.95" />
        <path d="M114 58 Q120 63 126 58" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.8" />

        <path
          d={poses.leftArm}
          stroke={color.primary}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d={poses.rightArm}
          stroke={color.primary}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        <ellipse cx="120" cy="130" rx="40" ry="50" fill={`url(#bodyGrad-${muscle})`} opacity="0.9" />

        <path
          d={poses.leftLeg}
          stroke={color.primary}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d={poses.rightLeg}
          stroke={color.primary}
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        <circle cx={poses.leftFoot.x} cy={poses.leftFoot.y} r="10" fill={color.secondary} filter={`url(#glow-${muscle}-filter)`} />
        <circle cx={poses.rightFoot.x} cy={poses.rightFoot.y} r="10" fill={color.secondary} filter={`url(#glow-${muscle}-filter)`} />

        <circle cx="75" cy="70" r="12" fill={color.glow} filter={`url(#glow-${muscle}-filter)`} opacity="0.6" />
        <circle cx="165" cy="70" r="12" fill={color.glow} filter={`url(#glow-${muscle}-filter)`} opacity="0.6" />

        <circle cx="120" cy="130" r="30" fill={color.glow} opacity="0.3" filter={`url(#glow-${muscle}-filter)`} />
      </svg>
    </div>
  )
}

function getExercisePoses(exerciseId: string, _color: { primary: string; secondary: string; glow: string }, phase: number) {
  const phaseOffsets = [
    { arm: 0, leg: 0, torso: 0 },
    { arm: -15, leg: 10, torso: 5 },
    { arm: -30, leg: 20, torso: 10 },
    { arm: -15, leg: 10, torso: 5 },
  ]

  const p = phaseOffsets[phase]

  if (exerciseId.includes('bench') || exerciseId.includes('press') || exerciseId.includes('push')) {
    return {
      leftArm: `M85 95 Q50${95 + p.arm} ${40 + p.arm * 0.5}`,
      rightArm: `M155 95 Q190${95 + p.arm} ${40 + p.arm * 0.5}`,
      leftLeg: `M100 175 Q95 220 ${90 + p.leg * 0.5} 280`,
      rightLeg: `M140 175 Q145 220 ${150 - p.leg * 0.5} 280`,
      leftFoot: { x: 90 + p.leg * 0.5, y: 280 },
      rightFoot: { x: 150 - p.leg * 0.5, y: 280 },
    }
  }

  if (exerciseId.includes('curl') || exerciseId.includes('bicep')) {
    return {
      leftArm: `M85 95 Q60${80 - p.arm} ${50 - p.arm}`,
      rightArm: `M155 95 Q180${80 - p.arm} ${50 - p.arm}`,
      leftLeg: `M100 175 Q95 220 100 280`,
      rightLeg: `M140 175 Q145 220 140 280`,
      leftFoot: { x: 100, y: 280 },
      rightFoot: { x: 140, y: 280 },
    }
  }

  if (exerciseId.includes('squat') || exerciseId.includes('lunge') || exerciseId.includes('leg')) {
    return {
      leftArm: `M85 100 Q60 130 ${60 - p.arm * 0.5} 170`,
      rightArm: `M155 100 Q180 130 ${180 + p.arm * 0.5} 170`,
      leftLeg: `M100 175 Q85${200 + p.leg} ${70 + p.leg * 0.8}`,
      rightLeg: `M140 175 Q155${200 + p.leg} ${130 - p.leg * 0.8}`,
      leftFoot: { x: 70 + p.leg * 0.8, y: 280 },
      rightFoot: { x: 130 - p.leg * 0.8, y: 280 },
    }
  }

  if (exerciseId.includes('pull') || exerciseId.includes('row') || exerciseId.includes('lat')) {
    return {
      leftArm: `M85 90 Q50 130 ${45 + p.arm * 0.5} 170`,
      rightArm: `M155 90 Q190 130 ${195 - p.arm * 0.5} 170`,
      leftLeg: `M100 175 Q95 220 100 280`,
      rightLeg: `M140 175 Q145 220 140 280`,
      leftFoot: { x: 100, y: 280 },
      rightFoot: { x: 140, y: 280 },
    }
  }

  if (exerciseId.includes('deadlift') || exerciseId.includes('hinge')) {
    return {
      leftArm: `M85 100 Q70 160 ${55 + p.arm} 200`,
      rightArm: `M155 100 Q170 160 ${185 - p.arm} 200`,
      leftLeg: `M100 175 Q100 220 100 280`,
      rightLeg: `M140 175 Q140 220 140 280`,
      leftFoot: { x: 100, y: 280 },
      rightFoot: { x: 140, y: 280 },
    }
  }

  if (exerciseId.includes('plank') || exerciseId.includes('crunch') || exerciseId.includes('situp')) {
    return {
      leftArm: `M85 130 Q60 130 40 130`,
      rightArm: `M155 130 Q180 130 200 130`,
      leftLeg: `M100 175 Q95 220 100 280`,
      rightLeg: `M140 175 Q145 220 140 280`,
      leftFoot: { x: 100, y: 280 },
      rightFoot: { x: 140, y: 280 },
    }
  }

  if (exerciseId.includes('jump') || exerciseId.includes('burpee') || exerciseId.includes('box') || exerciseId.includes('running') || exerciseId.includes('cardio')) {
    return {
      leftArm: `M85 90 Q50 70 ${40 - p.arm} 50`,
      rightArm: `M155 90 Q190 70 ${200 + p.arm} 50`,
      leftLeg: `M100 175 Q85 200 ${75 + p.leg * 0.5} 240`,
      rightLeg: `M140 175 Q155 200 ${165 - p.leg * 0.5} 260`,
      leftFoot: { x: 75 + p.leg * 0.5, y: 240 },
      rightFoot: { x: 165 - p.leg * 0.5, y: 260 },
    }
  }

  if (exerciseId.includes('shoulder') || exerciseId.includes('raise') || exerciseId.includes('lateral')) {
    return {
      leftArm: `M85 100 Q50${90 - p.arm} ${80 - p.arm * 0.3}`,
      rightArm: `M155 100 Q190${90 - p.arm} ${80 - p.arm * 0.3}`,
      leftLeg: `M100 175 Q95 220 100 280`,
      rightLeg: `M140 175 Q145 220 140 280`,
      leftFoot: { x: 100, y: 280 },
      rightFoot: { x: 140, y: 280 },
    }
  }

  return {
    leftArm: `M85 95 Q60 120 ${55 - p.arm * 0.3} 160`,
    rightArm: `M155 95 Q180 120 ${185 + p.arm * 0.3} 160`,
    leftLeg: `M100 175 Q95 220 ${90 + p.leg * 0.3} 280`,
    rightLeg: `M140 175 Q145 220 ${150 - p.leg * 0.3} 280`,
    leftFoot: { x: 90 + p.leg * 0.3, y: 280 },
    rightFoot: { x: 150 - p.leg * 0.3, y: 280 },
  }
}