import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HealthDashboard } from '@/components/fitness/HealthDashboard'
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger'
import { ExerciseLibrary } from '@/components/fitness/ExerciseLibrary'
import { ExerciseDetail } from '@/components/fitness/ExerciseDetail'
import { BodyMetricsTracker } from '@/components/fitness/BodyMetricsTracker'
import { NutritionLogger } from '@/components/fitness/NutritionLogger'
import { HydrationTracker } from '@/components/fitness/HydrationTracker'
import { SleepLogger } from '@/components/fitness/SleepLogger'
import { WorkoutStreak } from '@/components/fitness/WorkoutStreak'
import { PersonalRecords } from '@/components/fitness/PersonalRecords'
import { SupplementTracker } from '@/components/fitness/SupplementTracker'
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  Dumbbell, BookOpen, Activity, Utensils, Droplets, Moon,
  Flame, Trophy, Coffee, Heart, Plus,
} from 'lucide-react'

type TabId = 'health' | 'workouts' | 'body' | 'nutrition' | 'hydration' | 'sleep' | 'exercises' | 'records' | 'streak' | 'supplements'

const tabConfig: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'health', label: 'Health', icon: Heart, color: 'text-purple-400' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, color: 'text-rose-400' },
  { id: 'body', label: 'Body', icon: Activity, color: 'text-emerald-400' },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'text-orange-400' },
  { id: 'hydration', label: 'Hydration', icon: Droplets, color: 'text-sky-400' },
  { id: 'sleep', label: 'Sleep', icon: Moon, color: 'text-violet-400' },
  { id: 'exercises', label: 'Exercises', icon: BookOpen, color: 'text-amber-400' },
  { id: 'records', label: 'PRs', icon: Trophy, color: 'text-yellow-400' },
  { id: 'streak', label: 'Streak', icon: Flame, color: 'text-orange-500' },
  { id: 'supplements', label: 'Supps', icon: Coffee, color: 'text-cyan-400' },
]

export default function Fitness() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const actionFromUrl = searchParams.get('action')
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'health')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const { workouts, meals, sleep, hydration } = useAppStore()

  const hasData = workouts.length > 0 || meals.length > 0 || sleep.length > 0
  const today = new Date().toISOString().split('T')[0]
  const todayCalories = meals.filter(m => m.date === today).reduce((sum, m) => sum + (m.calories || 0), 0)
  const workoutDone = workouts.some(w => w.date === today)
  const mealDone = meals.some(m => m.date === today)
  const sleepDone = sleep.some(s => s.date === today)
  const hydrationDone = hydration.some(h => h.date === today)
  const habitsDone = [workoutDone, mealDone, sleepDone, hydrationDone].filter(Boolean).length

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    if (actionFromUrl === 'add') {
      const targetTab = (tabFromUrl || 'workouts') as TabId
      setActiveTab(targetTab)
      setSearchParams({ tab: targetTab })
    }
  }, [tabFromUrl, actionFromUrl])

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabId)
    setSearchParams({ tab })
  }

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/10 p-12">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Heart size={300} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <StreakStatus />
          <div className="flex items-center gap-3">
            <Flame size={16} className={hasData && todayCalories > 0 ? 'text-orange-400' : 'text-slate-600'} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {todayCalories > 0 ? (
                <span className="text-orange-400">{todayCalories.toLocaleString()} cal</span>
              ) : (
                <span className="text-slate-500">-- cal</span>
              )}
            </span>
          </div>
        </div>
        <div className="relative z-10 mt-10">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            Life <span className="text-purple-500">Hub</span>
          </h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">
            {hasData
              ? <><span className="text-white font-bold">{habitsDone}/4</span> habits completed today</>
              : 'Your health & fitness command center'}
          </p>
          <div className="flex items-center gap-4 mt-3">
            {[{ label: 'Workout', done: workoutDone, icon: Dumbbell, color: 'text-rose-400' },
              { label: 'Meals', done: mealDone, icon: Utensils, color: 'text-orange-400' },
              { label: 'Sleep', done: sleepDone, icon: Moon, color: 'text-violet-400' },
              { label: 'Hydration', done: hydrationDone, icon: Droplets, color: 'text-sky-400' },
            ].map((h) => (
              <div key={h.label} className={`flex items-center gap-1.5 ${h.done ? 'opacity-100' : 'opacity-40'}`}>
                <h.icon size={14} className={h.color} />
                <span className="text-xs font-bold text-slate-400">{h.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            {hasData ? (
              <button
                onClick={() => { setActiveTab('workouts'); setSearchParams({ tab: 'workouts' }) }}
                className="glass-card bg-purple-500/10 border-purple-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-500/20 transition-all group"
              >
                <Plus size={20} className="text-purple-400 group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Workout</span>
              </button>
            ) : (
              <button
                onClick={() => { setActiveTab('workouts'); setSearchParams({ tab: 'workouts' }) }}
                className="glass-card bg-cyan-500/10 border-cyan-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-cyan-500/20 transition-all"
              >
                <Plus size={20} className="text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Start Tracking</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchParams({ tab: tab.id }) }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-300 shrink-0",
              activeTab === tab.id
                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.03)] border border-white/10"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <tab.icon size={13} className={cn(activeTab === tab.id ? tab.color : '')} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'health' && <HealthDashboard onNavigate={handleNavigate} />}

        {activeTab === 'workouts' && <WorkoutLogger />}

        {activeTab === 'body' && <BodyMetricsTracker />}

        {activeTab === 'nutrition' && <NutritionLogger />}

        {activeTab === 'hydration' && <HydrationTracker />}

        {activeTab === 'sleep' && <SleepLogger />}

        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {selectedExerciseId ? (
              <ExerciseDetail
                exerciseId={selectedExerciseId}
                onClose={() => setSelectedExerciseId(null)}
              />
            ) : (
              <ExerciseLibrary onSelectExercise={(id) => setSelectedExerciseId(id)} />
            )}
          </div>
        )}

        {activeTab === 'records' && <PersonalRecords />}

        {activeTab === 'streak' && <WorkoutStreak />}

        {activeTab === 'supplements' && <SupplementTracker />}
      </div>
    </div>
  )
}
