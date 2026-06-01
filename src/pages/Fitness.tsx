import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Recovery } from '@/components/fitness/Recovery'
import { WorkoutLogger } from '@/components/fitness/WorkoutLogger'
import { BodyMetricsTracker } from '@/components/fitness/BodyMetricsTracker'
import { NutritionLogger } from '@/components/fitness/NutritionLogger'
import { SleepLogger } from '@/components/fitness/SleepLogger'
import { Progress } from '@/components/fitness/Progress'
import { Habits } from '@/components/fitness/Habits'
import { ExerciseLibrary } from '@/components/fitness/ExerciseLibrary'
import { ExerciseDetail } from '@/components/fitness/ExerciseDetail'
import { SupplementTracker } from '@/components/fitness/SupplementTracker'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import {
  Heart, Dumbbell, Activity, Utensils, Moon,
  TrendingUp, Flame, BookOpen, Coffee, Plus, Droplets,
} from 'lucide-react'

type TabId = 'training' | 'diet' | 'sleep' | 'recovery' | 'progress' | 'habits' | 'body' | 'exercises' | 'supplements'

const tabConfig: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'training', label: 'Workout', icon: Dumbbell },
  { id: 'diet', label: 'Nutrition', icon: Utensils },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'recovery', label: 'Recovery', icon: Heart },
  { id: 'progress', label: 'Performance', icon: TrendingUp },
  { id: 'habits', label: 'Streak', icon: Flame },
  { id: 'body', label: 'Body', icon: Activity },
  { id: 'exercises', label: 'Exercises', icon: BookOpen },
  { id: 'supplements', label: 'Supps', icon: Coffee },
]

const habitRingConfig = [
  { key: 'workout', label: 'Workout', icon: Dumbbell, color: '#f43f5e' },
  { key: 'nutrition', label: 'Nutrition', icon: Utensils, color: '#f97316' },
  { key: 'sleep', label: 'Sleep', icon: Moon, color: '#8b5cf6' },
  { key: 'hydration', label: 'Recovery', icon: Droplets, color: '#06b6d4' },
]

function calcReadiness(workoutDone: boolean, mealDone: boolean, sleepDone: boolean, hydrationDone: boolean): { score: number; label: string; color: string } {
  let score = 0
  if (workoutDone) score += 30
  if (mealDone) score += 25
  if (sleepDone) score += 25
  if (hydrationDone) score += 20
  const label = score >= 90 ? 'Peak' : score >= 70 ? 'Ready' : score >= 50 ? 'Fair' : score >= 25 ? 'Tired' : 'Rest'
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#06b6d4' : score >= 50 ? '#f59e0b' : score >= 25 ? '#f97316' : '#ef4444'
  return { score, label, color }
}

function getWorkoutStreak(workoutDates: string[]): number {
  if (workoutDates.length === 0) return 0
  const sorted = [...new Set(workoutDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  let streak = 0
  const today = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (sorted.includes(ds)) streak++
    else if (i > 0) break
    else return 0
  }
  return streak
}

export default function Fitness() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as TabId | null
  const actionFromUrl = searchParams.get('action')
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || 'recovery')
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const { workouts, meals, sleep, hydration, loadAllData } = useAppStore()

  useEffect(() => { loadAllData() }, [loadAllData])

  const today = new Date().toISOString().split('T')[0]
  const workoutDone = workouts.some(w => w.date === today)
  const mealDone = meals.some(m => m.date === today)
  const sleepDone = sleep.some(s => s.date === today)
  const hydrationDone = hydration.some(h => h.date === today)
  const habitsDone = [workoutDone, mealDone, sleepDone, hydrationDone]
  const doneCount = habitsDone.filter(Boolean).length

  const readiness = calcReadiness(workoutDone, mealDone, sleepDone, hydrationDone)
  const radius = 28
  const circumference = 2 * Math.PI * radius

  const thisWeekWorkouts = useMemo(() => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return workouts.filter(w => new Date(w.date) >= weekStart).length
  }, [workouts])

  const avgSleepHours = useMemo(() => {
    if (sleep.length === 0) return 0
    return sleep.reduce((s, e) => s + e.duration, 0) / sleep.length
  }, [sleep])

  const avgDailyCalories = useMemo(() => {
    const last7 = new Date()
    last7.setDate(last7.getDate() - 7)
    const recent = meals.filter(m => new Date(m.date) >= last7)
    if (recent.length === 0) return 0
    const uniqueDays = new Set(recent.map(m => m.date)).size
    return uniqueDays > 0 ? Math.round(recent.reduce((s, m) => s + (m.calories || 0), 0) / uniqueDays) : 0
  }, [meals])

  const streak = useMemo(() => getWorkoutStreak(workouts.map(w => w.date)), [workouts])

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl)
    if (actionFromUrl === 'add') {
      const targetTab = (tabFromUrl || 'training') as TabId
      setActiveTab(targetTab)
      setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', targetTab); return next })
    }
  }, [tabFromUrl, actionFromUrl, activeTab])

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Hero Section — Readiness Rings + Quick Stats */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Heart size={300} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.08),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16">
            {/* Readiness Rings */}
            <div className="relative flex-shrink-0">
              <svg width="160" height="160" className="-rotate-90">
                {habitRingConfig.map((h, i) => {
                  return (
                    <circle
                      key={h.key}
                      cx="80"
                      cy="80"
                      r={radius - i * 5}
                      fill="none"
                      stroke={habitsDone[i] ? h.color : 'rgba(255,255,255,0.06)'}
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${circumference} ${circumference}`,
                        strokeDashoffset: habitsDone[i] ? 0 : circumference * 0.7,
                        transition: 'all 0.8s ease',
                        transformOrigin: 'center',
                      }}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white drop-shadow-lg">{readiness.score}</span>
                <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-0.5" style={{ color: readiness.color }}>{readiness.label}</span>
              </div>
            </div>
            {/* Title + Quick Stats */}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    Life <span className="text-purple-500">Hub</span>
                  </h1>
                  <p className="text-base text-slate-400 mt-1">
                    <span className="text-white font-bold">{doneCount}/4</span> habits done today
                    {readiness.score >= 70 && <span className="text-emerald-400 ml-2">&#x2022; Great day ahead!</span>}
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('training'); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', 'training'); next.set('add', '1'); return next }) }}
                  className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-300 hover:bg-purple-500/25 transition-all text-xs font-black uppercase tracking-widest"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                  Log Workout
                </button>
              </div>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 flex items-center justify-center"><Dumbbell size={16} className="text-rose-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Week Workouts</p>
                    <p className="text-base font-bold text-white">{thisWeekWorkouts}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center"><Flame size={16} className="text-orange-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Streak</p>
                    <p className="text-base font-bold text-white">{streak} <span className="text-xs text-gray-500 font-normal">days</span></p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/15 flex items-center justify-center"><TrendingUp size={16} className="text-sky-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Calories</p>
                    <p className="text-base font-bold text-white">{avgDailyCalories.toLocaleString()}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center"><Moon size={16} className="text-violet-400" /></div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Avg Sleep</p>
                    <p className="text-base font-bold text-white">{avgSleepHours.toFixed(1)} <span className="text-xs text-gray-500 font-normal">hrs</span></p>
                  </div>
                </div>
              </div>
              {/* Habit Dots */}
              <div className="flex items-center gap-4 mt-4">
                {habitRingConfig.map((h, i) => (
                  <div key={h.key} className={`flex items-center gap-1.5 transition-opacity ${habitsDone[i] ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-2 h-2 rounded-full ${habitsDone[i] ? '' : 'bg-white/10'}`} style={{ background: habitsDone[i] ? h.color : undefined }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none rounded-2xl bg-white/[0.02] border border-white/5 p-1.5">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', tab.id); return next }) }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shrink-0 whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-gradient-to-br from-white/15 to-white/5 text-white shadow-[0_0_30px_rgba(255,255,255,0.08)] border border-white/15 backdrop-blur-sm"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
              )}
            >
              <tab.icon size={14} className="opacity-70" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'training' && <WorkoutLogger />}
        {activeTab === 'diet' && <NutritionLogger />}
        {activeTab === 'sleep' && <SleepLogger />}
        {activeTab === 'recovery' && <Recovery />}
        {activeTab === 'progress' && <Progress />}
        {activeTab === 'habits' && <Habits />}
        {activeTab === 'body' && <BodyMetricsTracker />}
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {selectedExerciseId ? (
              <ExerciseDetail exerciseId={selectedExerciseId} onClose={() => setSelectedExerciseId(null)} />
            ) : (
              <ExerciseLibrary onSelectExercise={(id) => setSelectedExerciseId(id)} />
            )}
          </div>
        )}
        {activeTab === 'supplements' && <SupplementTracker />}
      </div>
    </div>
  )
}
