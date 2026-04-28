import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getExerciseById, muscleGroupColors } from '@/lib/exercises'
import { ArrowLeft, Info, Lightbulb, Dumbbell, Gauge, Wrench } from 'lucide-react'

interface ExerciseDetailProps {
  exerciseId: string
  onBack: () => void
}

export function ExerciseDetail({ exerciseId, onBack }: ExerciseDetailProps) {
  const exercise = getExerciseById(exerciseId)

  if (!exercise) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted">Exercise not found.</p>
        <Button variant="default" onClick={onBack} className="mt-4">
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
      </div>
    )
  }

  const difficultyColor =
    exercise.difficulty === 'beginner'
      ? 'text-emerald-400'
      : exercise.difficulty === 'intermediate'
        ? 'text-amber-400'
        : 'text-rose-400'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className={`text-sm font-medium ${difficultyColor}`}>
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </span>
            <span className="text-xs text-muted">&middot;</span>
            <span className="text-sm text-muted">
              {exercise.equipment.map((e) => e.replace(/_/g, ' ')).join(', ')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Dumbbell size={14} className="text-primary-light" />
              Primary Muscles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exercise.primaryMuscles.map((m) => (
                <span
                  key={m}
                  className={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}
                >
                  {m.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge size={14} className="text-accent-light" />
              Secondary Muscles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exercise.secondaryMuscles.length > 0 ? (
                exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${muscleGroupColors[m] || 'bg-white/10 text-gray-300'}`}
                  >
                    {m.replace(/_/g, ' ')}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted">None</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info size={16} className="text-primary-light" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-200">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary-light">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" />
            Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {exercise.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-300">
                <Wrench size={14} className="mt-0.5 shrink-0 text-muted" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
