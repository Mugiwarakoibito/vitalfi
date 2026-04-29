import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger'
import { ExerciseLibrary } from '@/components/fitness/ExerciseLibrary'
import { ExerciseDetail } from '@/components/fitness/ExerciseDetail'
import { WorkoutTemplateManager } from '@/components/fitness/WorkoutTemplateManager'
import { BodyMetricsTracker } from '@/components/fitness/BodyMetricsTracker'
import { NutritionLogger } from '@/components/fitness/NutritionLogger'
import { HydrationTracker } from '@/components/fitness/HydrationTracker'
import { SleepLogger } from '@/components/fitness/SleepLogger'
import { storage } from '@/lib/storage'
import type { Workout, WorkoutTemplate, BodyMetric, Meal, HydrationEntry, SleepEntry } from '@/types/fitness'
import {
  Dumbbell,
  BookOpen,
  Layers,
  Activity,
  Utensils,
  Droplets,
  Moon,
  Trophy,
  Flame,
  Calendar,
  Pill,
  BarChart3,
} from 'lucide-react'

type TabId = 'workouts' | 'exercises' | 'templates' | 'body' | 'nutrition' | 'hydration' | 'sleep' | 'records' | 'streak' | 'planner' | 'measurements' | 'supplements' | 'analytics'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'workouts', label: 'Workouts', icon: <Dumbbell size={14} /> },
  { id: 'exercises', label: 'Exercises', icon: <BookOpen size={14} /> },
  { id: 'templates', label: 'Templates', icon: <Layers size={14} /> },
  { id: 'body', label: 'Body', icon: <Activity size={14} /> },
  { id: 'nutrition', label: 'Nutrition', icon: <Utensils size={14} /> },
  { id: 'hydration', label: 'Hydration', icon: <Droplets size={14} /> },
  { id: 'sleep', label: 'Sleep', icon: <Moon size={14} /> },
  { id: 'records', label: 'PRs', icon: <Trophy size={14} /> },
  { id: 'streak', label: 'Streak', icon: <Flame size={14} /> },
  { id: 'planner', label: 'Planner', icon: <Calendar size={14} /> },
  { id: 'supplements', label: 'Supps', icon: <Pill size={14} /> },
  { id: 'analytics', label: 'Stats', icon: <BarChart3 size={14} /> },
]

type FitnessProps = {
  defaultTab?: TabId
}

export default function Fitness({ defaultTab = 'workouts' }: FitnessProps) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const location = useLocation()
  const isStandalone = location.pathname !== '/fitness'
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (isStandalone) {
      const path = location.pathname.split('/fitness/')[1]
      if (path && path !== '') return path as TabId
    }
    return defaultTab
  })

  useEffect(() => {
    if (isStandalone) {
      const path = location.pathname.split('/fitness/')[1]
      if (path && path !== '') {
        setActiveTab(path as TabId)
      }
    }
  }, [location.pathname, isStandalone])

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [hydration, setHydration] = useState<HydrationEntry[]>([])
  const [sleep, setSleep] = useState<SleepEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshData = useCallback(async () => {
    const [wo, tmpl, bm, ml, hyd, sl] = await Promise.all([
      storage.getAll('workouts'),
      storage.getAll('workoutTemplates'),
      storage.getAll('bodyMetrics'),
      storage.getAll('meals'),
      storage.getAll('hydration'),
      storage.getAll('sleep'),
    ])
    setWorkouts(wo)
    setTemplates(tmpl)
    setBodyMetrics(bm)
    setMeals(ml)
    setHydration(hyd)
    setSleep(sl)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const tabCounts: Record<string, number> = {
    workouts: workouts.length,
    exercises: 0,
    templates: templates.length,
    body: bodyMetrics.length,
    nutrition: meals.length,
    hydration: hydration.length,
    sleep: sleep.length,
    records: 0,
    streak: 0,
    planner: 0,
    measurements: 0,
    supplements: 0,
    analytics: 0,
  }

  const tabLabels: Record<TabId, string> = {
    workouts: 'Workouts',
    exercises: 'Exercises',
    templates: 'Templates',
    body: 'Body Metrics',
    nutrition: 'Nutrition',
    hydration: 'Hydration',
    sleep: 'Sleep',
    records: 'Personal Records',
    streak: 'Workout Streak',
    planner: 'Meal Planner',
    measurements: 'Body Measurements',
    supplements: 'Supplements',
    analytics: 'Analytics',
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
            <Dumbbell className="h-5 w-5 text-success-light" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Fitness</h2>
            <p className="text-sm text-muted mt-1">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15">
          <Dumbbell className="h-5 w-5 text-success-light" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isStandalone ? tabLabels[activeTab] : 'Health & Fitness'}
          </h2>
          {!isStandalone && (
            <p className="text-sm text-muted mt-1">Log workouts, nutrition, and body metrics.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isStandalone && (
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setSelectedExerciseId(null)
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-success/40 bg-success/15 text-success-light'
                : 'border-white/[0.06] bg-white/[0.02] text-muted hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0 text-[10px] font-semibold ${
                activeTab === tab.id ? 'bg-success/25 text-success-light' : 'bg-white/[0.06] text-muted'
              }`}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>
      )}

      {/* Content */}
      <div>
        {activeTab === 'workouts' && (
          <WorkoutLogger workouts={workouts} onWorkoutsChange={refreshData} />
        )}

        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {selectedExerciseId ? (
              <ExerciseDetail
                exerciseId={selectedExerciseId}
                onBack={() => setSelectedExerciseId(null)}
              />
            ) : (
              <ExerciseLibrary onSelectExercise={(id) => setSelectedExerciseId(id)} />
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <WorkoutTemplateManager
            templates={templates}
            onTemplatesChange={refreshData}
          />
        )}

        {activeTab === 'body' && (
          <BodyMetricsTracker metrics={bodyMetrics} onMetricsChange={refreshData} />
        )}

        {activeTab === 'nutrition' && (
          <NutritionLogger meals={meals} onMealsChange={refreshData} />
        )}

        {activeTab === 'hydration' && (
          <HydrationTracker entries={hydration} onEntriesChange={refreshData} />
        )}

        {activeTab === 'sleep' && (
          <SleepLogger entries={sleep} onEntriesChange={refreshData} />
        )}
      </div>
    </div>
  )
}
