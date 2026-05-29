import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Dumbbell, Flame, Droplets, Utensils } from 'lucide-react'
import type { TodayNutrition, WorkoutStats } from '@/lib/insights'

interface FitnessOverviewProps {
  workoutStats: WorkoutStats
  todayNutrition: TodayNutrition
  todayHydration: number
}

export function FitnessOverview({
  workoutStats,
  todayNutrition,
  todayHydration,
}: FitnessOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
              <Dumbbell size={16} className="text-success-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Workouts
              </p>
              <p className="text-sm font-semibold text-white">
                {workoutStats.totalThisMonth}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
              <Flame size={16} className="text-warning-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Streak
              </p>
              <p className="text-sm font-semibold text-white">
                {workoutStats.streak} days
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Droplets size={16} className="text-accent-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Hydration
              </p>
              <p className="text-sm font-semibold text-white">
                {todayHydration}ml
              </p>
            </div>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/15">
              <Utensils size={16} className="text-error-light" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wider">
                Calories
              </p>
              <p className="text-sm font-semibold text-white">
                {todayNutrition.calories}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Today's Macros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { label: 'Protein', value: todayNutrition.protein, color: 'bg-success/60', max: 150 },
            { label: 'Carbs', value: todayNutrition.carbs, color: 'bg-warning/60', max: 250 },
            { label: 'Fat', value: todayNutrition.fat, color: 'bg-accent/60', max: 80 },
          ].map((macro) => (
            <div key={macro.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white">{macro.label}</span>
                <span className="text-muted">{macro.value}g</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full ${macro.color} transition-all duration-700 ease-out shadow-sm`}
                  style={{
                    width: `${Math.min((macro.value / macro.max) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
