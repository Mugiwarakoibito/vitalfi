import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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

type TabId = 'workouts' | 'body' | 'nutrition' | 'hydration' | 'sleep' | 'exercises' | 'records' | 'streak' | 'supplements'

const tabConfig: { id: TabId; label: string; icon: React.ElementType; color: string }[] = [
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
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'workouts')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const { workouts, meals, sleep, hydration } = useAppStore()

  const hasData = workouts.length > 0 || meals.length > 0 || sleep.length > 0 || hydration.length > 0
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
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', targetTab)
        return next
      })
    }
  }, [tabFromUrl, actionFromUrl, activeTab])

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
                onClick={() => { setActiveTab('workouts'); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', 'workouts'); next.set('add', '1'); return next }) }}
                className="glass-card bg-purple-500/10 border-purple-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-500/20 transition-all group"
              >
                <Plus size={20} className="text-purple-400 group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Add Workout</span>
              </button>
            ) : (
              <button
                onClick={() => { setActiveTab('workouts'); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', 'workouts'); return next }) }}
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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none rounded-2xl bg-white/[0.02] border border-white/5 p-1.5">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', tab.id); return next }) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shrink-0 whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-gradient-to-br from-white/15 to-white/5 text-white shadow-[0_0_30px_rgba(255,255,255,0.08)] border border-white/15 backdrop-blur-sm"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon size={14} className={cn(activeTab === tab.id ? tab.color : 'opacity-50')} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
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
