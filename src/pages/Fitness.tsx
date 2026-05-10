import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
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
import { StreakStatus } from '@/components/dashboard/StreakStatus'
import { Dumbbell,
  BookOpen,
  Activity,
  Utensils,
  Droplets,
  Moon,
  Plus,
  Flame,
  Trophy,
  Coffee,
} from 'lucide-react'

type TabId = 'workouts' | 'body' | 'nutrition' | 'hydration' | 'sleep' | 'exercises' | 'records' | 'streak' | 'supplements'

export default function Fitness() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const actionFromUrl = searchParams.get('action')
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'workouts')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const { workouts, meals, sleep } = useAppStore()

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
    if (actionFromUrl === 'add') {
      setShowWorkoutForm(true)
      setSearchParams({ tab: tabFromUrl || 'workouts' })
    }
}, [tabFromUrl, actionFromUrl])

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-purple-950/20 border border-purple-500/10 p-12">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Flame size={300} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <StreakStatus />
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full animate-ping bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">
              {workouts.length > 0 || meals.length > 0 || sleep.length > 0 ? (
                <span className="text-purple-400">AI Active</span>
              ) : (
                <span className="text-slate-500">Get Started</span>
              )}
            </h2>
          </div>
        </div>
        <div className="relative z-10 mt-10">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            {workouts.length > 0 || meals.length > 0 || sleep.length > 0 ? (
              <>Life <span className="text-purple-500">Hub</span></>
            ) : (
              <>Life <span className="text-purple-500">Hub</span></>
            )}
          </h1>
          <p className="text-lg text-slate-400 mt-2 max-w-xl">
            {workouts.length > 0 || meals.length > 0 || sleep.length > 0 ? (
              <>Track your fitness journey with {workouts.length} workouts, {meals.length} meals, {sleep.length} sleep records.</>
            ) : (
              <>Ignite your potential. Record your first workout and watch the transformation begin.</>
            )}
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <button onClick={() => { setShowWorkoutForm(true); setActiveTab('workouts'); setSearchParams({ tab: 'workouts' }) }} className="glass-card bg-purple-500/10 border-purple-500/20 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-purple-500/20 transition-all group">
              <Plus size={20} className="text-purple-400 group-hover:rotate-90 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Add Workout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        <button
          onClick={() => { setActiveTab('workouts'); setSearchParams({ tab: 'workouts' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'workouts' 
              ? "bg-white/10 text-white shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Dumbbell size={16} />
          Workouts
        </button>
        <button
          onClick={() => { setActiveTab('body'); setSearchParams({ tab: 'body' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'body' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Activity size={16} className={activeTab === 'body' ? "text-lime-400" : "text-slate-600"} />
          Body
        </button>
        <button
          onClick={() => { setActiveTab('nutrition'); setSearchParams({ tab: 'nutrition' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'nutrition' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Utensils size={16} className={activeTab === 'nutrition' ? "text-purple-400" : "text-slate-600"} />
          Nutrition
        </button>
        <button
          onClick={() => { setActiveTab('hydration'); setSearchParams({ tab: 'hydration' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'hydration' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Droplets size={16} className={activeTab === 'hydration' ? "text-blue-400" : "text-slate-600"} />
          Hydration
        </button>
        <button
          onClick={() => { setActiveTab('sleep'); setSearchParams({ tab: 'sleep' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'sleep' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Moon size={16} className={activeTab === 'sleep' ? "text-indigo-400" : "text-slate-600"} />
          Sleep
        </button>
        <button
          onClick={() => { setActiveTab('exercises'); setSearchParams({ tab: 'exercises' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'exercises' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <BookOpen size={16} className={activeTab === 'exercises' ? "text-amber-400" : "text-slate-600"} />
          Exercises
        </button>
        <button
          onClick={() => { setActiveTab('records'); setSearchParams({ tab: 'records' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'records' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Trophy size={16} className={activeTab === 'records' ? "text-yellow-400" : "text-slate-600"} />
          PRs
        </button>
        <button
          onClick={() => { setActiveTab('streak'); setSearchParams({ tab: 'streak' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'streak' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Flame size={16} className={activeTab === 'streak' ? "text-orange-500" : "text-slate-600"} />
          Streak
        </button>
        <button
          onClick={() => { setActiveTab('supplements'); setSearchParams({ tab: 'supplements' }) }}
          className={cn(
            "flex-shrink-0 flex items-center gap-3 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
            activeTab === 'supplements' 
              ? "bg-white/10 text-white border border-white/20" 
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          )}
        >
          <Coffee size={16} className={activeTab === 'supplements' ? "text-cyan-400" : "text-slate-600"} />
          Supps
        </button>
      </div>

      {/* Content */}
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
                onBack={() => setSelectedExerciseId(null)}
              />
            ) : (
              <ExerciseLibrary onSelectExercise={(id) => setSelectedExerciseId(id)} />
            )}
</div>
        )}

        {activeTab === 'records' && <PersonalRecords />}

        {activeTab === 'streak' && <WorkoutStreak />}

        {activeTab === 'supplements' && <SupplementTracker />}

        <Modal isOpen={showWorkoutForm} onClose={() => setShowWorkoutForm(false)} title="Log Workout" className="max-w-2xl">
          <WorkoutLogger />
        </Modal>
      </div>
    </div>
  )
}
