import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Flame,
  Moon,
  Dumbbell,
  Utensils,
  Calendar,
  ChevronRight,
  Timer,
  Scale,
  Droplets,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Workout, Meal, HydrationEntry, SleepEntry, BodyMetric, Goal } from '@/lib/storage'

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

function CircularProgress({ value, max, size = 80, strokeWidth = 8, color = '#10B981', label }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min((value / max) * 100, 100)
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#ffffff10" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{Math.round(progress)}%</span>
        {label && <span className="text-xs text-muted">{label}</span>}
      </div>
    </div>
  )
}

interface HealthDashboardProps {
  workouts: Workout[]
  meals: Meal[]
  hydration: HydrationEntry[]
  sleep: SleepEntry[]
  bodyMetrics: BodyMetric[]
  goals: Goal[]
  currency: string
  onNavigate?: (tab: string) => void
  onQuickAction?: (action: string) => void
}

export function HealthDashboard({
  workouts,
  meals,
  hydration,
  sleep,
  bodyMetrics,
  goals,
  currency: _currency,
  onNavigate,
  onQuickAction,
}: HealthDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  const streak = useMemo(() => {
    const sortedDates = [...new Set(workouts.map(w => w.date.split('T')[0]))].sort().reverse()
    let currentStreak = 0
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      if (sortedDates.includes(expectedDate)) currentStreak++
      else break
    }
    return currentStreak
  }, [workouts])

  const todayCalories = useMemo(() => {
    return meals
      .filter(m => m.date.startsWith(today))
      .reduce((s, m) => s + m.calories, 0)
  }, [meals, today])

  const calorieTarget = 2000
  const calorieProgress = (todayCalories / calorieTarget) * 100

  const todayProtein = useMemo(() => {
    return meals.filter(m => m.date.startsWith(today)).reduce((s, m) => s + (m.protein || 0), 0)
  }, [meals, today])

  const todayCarbs = useMemo(() => {
    return meals.filter(m => m.date.startsWith(today)).reduce((s, m) => s + (m.carbs || 0), 0)
  }, [meals, today])

  const todayFat = useMemo(() => {
    return meals.filter(m => m.date.startsWith(today)).reduce((s, m) => s + (m.fat || 0), 0)
  }, [meals, today])

  const hydrationGoal = 2500
  const todayHydration = useMemo(() => {
    return hydration.filter(h => h.date.startsWith(today)).reduce((s, h) => s + ((h as any).amountMl || h.amount || 0), 0)
  }, [hydration, today])
  const hydrationProgress = (todayHydration / hydrationGoal) * 100

  const activeMinutesGoal = 60
  const todayActiveMinutes = useMemo(() => {
    return workouts
      .filter(w => w.date.startsWith(today))
      .reduce((s, w) => s + (w.duration || 0), 0)
  }, [workouts, today])
  const activeMinutesProgress = (todayActiveMinutes / activeMinutesGoal) * 100

  const lastNightSleep = useMemo(() => {
    const sorted = [...sleep].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted[0] as (SleepEntry & { durationHours?: number }) | undefined
  }, [sleep])

  const sleepScore = lastNightSleep ? Math.round(((lastNightSleep as any).durationHours || lastNightSleep.duration || 0) / 8 * 50 + (lastNightSleep.quality || 0) * 10) : 0

  const weeklyActivity = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const dayWorkouts = workouts.filter(w => w.date.startsWith(dayStr))
      const totalDuration = dayWorkouts.reduce((s, w) => s + (w.duration || 0), 0)
      let intensity: 'rest' | 'light' | 'moderate' | 'intense' = 'rest'
      if (totalDuration > 0) {
        if (totalDuration < 30) intensity = 'light'
        else if (totalDuration < 60) intensity = 'moderate'
        else intensity = 'intense'
      }
      days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: dayStr, intensity, duration: totalDuration })
    }
    return days
  }, [workouts, now])

  const bodyMetricsOverTime = useMemo(() => {
    const days = bodyMetrics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map(m => ({
        date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: m.weight,
        bodyFat: m.bodyFat,
      }))
    return days
  }, [bodyMetrics])

  const nutritionTrends = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayStr = d.toISOString().split('T')[0]
      const dayMeals = meals.filter(m => m.date.startsWith(dayStr))
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        protein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: dayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
        fat: dayMeals.reduce((s, m) => s + (m.fat || 0), 0),
      })
    }
    return days
  }, [meals, now])

  const recentWorkouts = useMemo(() => {
    return [...workouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [workouts])

  const todayMeals = useMemo(() => {
    return meals.filter(m => m.date.startsWith(today))
  }, [meals, today])

  const fitnessGoals = goals.filter(g => g.type === 'fitness')

  const thisWeekWorkouts = useMemo(() => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return workouts.filter(w => new Date(w.date) >= weekStart).length
  }, [workouts, now])

  const thisWeekMinutes = useMemo(() => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return workouts.filter(w => new Date(w.date) >= weekStart).reduce((s, w) => s + (w.duration || 0), 0)
  }, [workouts, now])

  const avgSleepThisWeek = useMemo(() => {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 6)
    const weekSleep = sleep.filter(s => new Date(s.date) >= weekStart)
    if (weekSleep.length === 0) return 0
    return weekSleep.reduce((s, sEntry) => s + ((sEntry as any).durationHours || sEntry.duration || 0), 0) / weekSleep.length
  }, [sleep, now])

  const intensityColors = { rest: '#ffffff10', light: '#10B98140', moderate: '#F59E0B60', intense: '#EF4444' }

  return (
    <div className="space-y-6">
      {/* Top Row - Key Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card hover className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted font-medium">Current Streak</p>
                <p className="text-2xl font-bold text-white">{streak} <span className="text-sm font-normal text-muted">days</span></p>
              </div>
              <div className="p-2.5 rounded-xl bg-orange-500/20">
                <Flame size={20} className="text-orange-400" />
              </div>
            </div>
            <div className="mt-2">
              <CircularProgress value={streak} max={30} size={50} strokeWidth={4} color="#F97316" />
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted font-medium">Today's Calories</p>
              <div className="p-2 rounded-xl bg-blue-500/20">
                <Utensils size={16} className="text-blue-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{todayCalories.toLocaleString()}</p>
            <p className="text-xs text-muted">/ {calorieTarget.toLocaleString()} kcal</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min(calorieProgress, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-red-400">P: {todayProtein}g</span>
              <span className="text-blue-400">C: {todayCarbs}g</span>
              <span className="text-yellow-400">F: {todayFat}g</span>
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted font-medium">Hydration</p>
              <div className="p-2 rounded-xl bg-cyan-500/20">
                <Droplets size={16} className="text-cyan-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{(todayHydration / 1000).toFixed(1)}L</p>
            <p className="text-xs text-muted">/ {(hydrationGoal / 1000).toFixed(1)}L</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${Math.min(hydrationProgress, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted font-medium">Active Minutes</p>
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Timer size={16} className="text-purple-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{todayActiveMinutes}</p>
            <p className="text-xs text-muted">/ {activeMinutesGoal} min</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${Math.min(activeMinutesProgress, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card hover className="bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border-indigo-500/20">
          <CardContent className="py-4 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-muted font-medium">Sleep Score</p>
              <div className="p-1.5 rounded-lg bg-indigo-500/20">
                <Moon size={12} className="text-indigo-400" />
              </div>
            </div>
            <CircularProgress value={sleepScore} max={100} size={70} strokeWidth={6} color="#6366F1" />
            <p className="text-xs text-muted mt-1">
              {lastNightSleep ? `${(lastNightSleep as any).durationHours || lastNightSleep.duration || 0}h sleep` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section - Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 65% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Weekly Activity Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Weekly Activity</CardTitle>
              <div className="flex gap-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                      timeRange === range ? 'bg-primary text-white' : 'text-muted hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end gap-2">
                {weeklyActivity.map((day, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className="mx-auto rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${Math.max(day.duration * 2, 20)}px`,
                        backgroundColor: intensityColors[day.intensity],
                        width: '100%',
                      }}
                      title={`${day.duration} min - ${day.intensity}`}
                    />
                    <p className="text-xs text-muted mt-2">{day.day}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: intensityColors.rest }} />
                  <span className="text-xs text-muted">Rest</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: intensityColors.light }} />
                  <span className="text-xs text-muted">Light</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: intensityColors.moderate }} />
                  <span className="text-xs text-muted">Moderate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: intensityColors.intense }} />
                  <span className="text-xs text-muted">Intense</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workout Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Week's Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-white">{thisWeekWorkouts}</p>
                  <p className="text-sm text-muted">workouts this week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Metrics Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Body Metrics</CardTitle>
              <button className="text-xs text-primary-light hover:underline" onClick={() => onNavigate?.('fitness')}>
                View details
              </button>
            </CardHeader>
            <CardContent>
              {bodyMetricsOverTime.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">No body metrics recorded yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={bodyMetricsOverTime}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="date" stroke="#ffffff60" fontSize={10} />
                    <YAxis stroke="#ffffff60" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#8B5CF6" fill="url(#weightGradient)" strokeWidth={2} name="Weight (kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nutrition Trends (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={nutritionTrends}>
                  <defs>
                    <linearGradient id="proteinGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="carbsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#ffffff60" fontSize={10} />
                  <YAxis stroke="#ffffff60" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="protein" stackId="1" stroke="#EF4444" fill="url(#proteinGradient)" name="Protein" />
                  <Area type="monotone" dataKey="carbs" stackId="1" stroke="#3B82F6" fill="url(#carbsGradient)" name="Carbs" />
                  <Area type="monotone" dataKey="fat" stackId="1" stroke="#F59E0B" fill="url(#fatGradient)" name="Fat" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted">Protein</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted">Carbs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-muted">Fat</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 35% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Calendar size={14} className="text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-muted">{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Dumbbell size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Workout</p>
                    <p className="text-xs text-muted">
                      {todayActiveMinutes > 0 ? `${todayActiveMinutes} min completed` : 'No workout yet'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Utensils size={14} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Meals</p>
                    <p className="text-xs text-muted">{todayMeals.length} logged today</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Workouts</span>
                <span className="text-lg font-bold text-white">{thisWeekWorkouts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Active Time</span>
                <span className="text-lg font-bold text-white">{thisWeekMinutes} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Avg Sleep</span>
                <span className="text-lg font-bold text-white">{avgSleepThisWeek.toFixed(1)}h</span>
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goals Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fitnessGoals.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No fitness goals set</p>
              ) : (
                fitnessGoals.slice(0, 3).map((goal) => {
                  const progress = Math.min((goal.current / goal.target) * 100, 100)
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{goal.name}</span>
                        <span className="text-xs text-muted">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-400' : 'bg-primary'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Workouts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Workouts</CardTitle>
            <button onClick={() => onNavigate?.('fitness')} className="text-xs text-primary-light hover:underline">
              View all
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWorkouts.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No workouts yet</p>
              ) : (
                recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-500/20">
                        <Dumbbell size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{workout.name}</p>
                        <p className="text-xs text-muted">{new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{workout.duration} min</p>
                      <p className="text-xs text-muted">{workout.exercises?.length || 0} exercises</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Today's Meals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's Meals</CardTitle>
            <button onClick={() => onNavigate?.('fitness')} className="text-xs text-primary-light hover:underline">
              View all
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMeals.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">No meals logged</p>
            ) : (
              todayMeals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <div>
                    <p className="text-sm font-medium text-white">{meal.name}</p>
                    <p className="text-xs text-muted capitalize">{meal.mealType}</p>
                  </div>
                  <p className="text-sm font-medium text-white">{meal.calories} kcal</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="primary" className="gap-2" onClick={() => onQuickAction?.('logWorkout')}>
          <Dumbbell size={16} /> Log Workout
        </Button>
        <Button className="gap-2" onClick={() => onQuickAction?.('addMeal')}>
          <Utensils size={16} /> Add Meal
        </Button>
        <Button className="gap-2" onClick={() => onQuickAction?.('logWater')}>
          <Droplets size={16} /> Log Water
        </Button>
        <Button className="gap-2" onClick={() => onQuickAction?.('recordSleep')}>
          <Moon size={16} /> Record Sleep
        </Button>
        <Button className="gap-2" onClick={() => onNavigate?.('fitness')}>
          <Scale size={16} /> Update Metrics
        </Button>
      </div>
    </div>
  )
}