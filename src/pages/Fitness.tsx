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
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  Dumbbell, BookOpen, Activity, Utensils, Droplets, Moon,
  Flame, Trophy, Coffee, Heart, TrendingUp,
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
  const { workouts, meals, sleep } = useAppStore()

  const hasData = workouts.length > 0 || meals.length > 0 || sleep.length > 0
  const totalSessions = workouts.length + meals.length + sleep.length

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
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Compact Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/10 p-6 lg:p-8">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <Heart size={280} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/20">
              <Heart size={24} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Life <span className="text-purple-500">Hub</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${hasData ? 'bg-purple-500' : 'bg-slate-600'}`} />
                <p className="text-xs text-slate-500">
                  {hasData
                    ? `${workouts.length} workouts · ${meals.length} meals · ${sleep.length} sleep records`
                    : 'Your health & fitness command center'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              {hasData ? `${totalSessions} total sessions` : 'Ready to start'}
            </span>
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
