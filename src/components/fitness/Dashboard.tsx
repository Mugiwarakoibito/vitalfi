import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Heart, Activity, Brain, Droplets, Moon, Dumbbell, Utensils,
  Zap, Flame, TrendingUp,
} from 'lucide-react'
import {
  calculateBMI, bmiCategory, calculateBMR, calculateTDEE,
  calculateCalorieNeeds,
} from '@/lib/calculations'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts'

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

function getMotivationalQuote(): { text: string; author: string } {
  const quotes = [
    { text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown' },
    { text: 'Strength does not come from the body. It comes from the will.', author: 'Unknown' },
    { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
    { text: 'It never gets easier. You just get stronger.', author: 'Unknown' },
    { text: 'Take care of your body. It\'s the only place you have to live.', author: 'Jim Rohn' },
    { text: 'Success starts with self-discipline.', author: 'Unknown' },
    { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  ]
  const dayIndex = new Date().getDate()
  return quotes[dayIndex % quotes.length]
}

function computeHealthScore(data: { workouts: any[]; meals: any[]; sleep: any[]; hydration: any[]; bodyMetrics: any[] }) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)

  const workoutsThisMonth = data.workouts.filter((w: any) => new Date(w.date) >= monthAgo).length
  const workoutScore = Math.min(Math.round((workoutsThisMonth / 16) * 30), 30)

  const recentSleep = data.sleep.filter((s: any) => new Date(s.date) >= weekAgo)
  const avgQuality = recentSleep.length > 0 ? recentSleep.reduce((s: any, e: any) => s + e.quality, 0) / recentSleep.length : 0
  const sleepScore = Math.min(Math.round((avgQuality / 5) * 20), 20)

  const todayMeals = data.meals.filter((m: any) => m.date === today)
  const hasProtein = todayMeals.some((m: any) => m.protein > 20)
  let nutritionScore = 0
  if (todayMeals.length > 0) nutritionScore += 5
  if (hasProtein) nutritionScore += 5
  if (todayMeals.length >= 2) nutritionScore += 5
  if (todayMeals.reduce((s: number, m: any) => s + m.calories, 0) > 1200) nutritionScore += 5
  nutritionScore = Math.min(nutritionScore, 20)

  const todayHydration = data.hydration.filter((h: any) => h.date === today)
  const totalWater = todayHydration.reduce((s: number, h: any) => s + h.amount, 0)
  const hydrationScore = Math.min(Math.round((totalWater / 2500) * 15), 15)

  const hasRecentMetric = data.bodyMetrics.some((m: any) => new Date(m.date) >= weekAgo)
  const bodyMetricCount = data.bodyMetrics.filter((m: any) => new Date(m.date) >= monthAgo).length
  const bodyScore = hasRecentMetric ? Math.min(5 + Math.min(bodyMetricCount, 10), 15) : 0

  const total = workoutScore + sleepScore + nutritionScore + hydrationScore + bodyScore

  let label: string, color: string
  if (total >= 85) { label = 'Excellent'; color = 'text-emerald-400' }
  else if (total >= 70) { label = 'Good'; color = 'text-green-400' }
  else if (total >= 50) { label = 'Fair'; color = 'text-amber-400' }
  else if (total >= 30) { label = 'Needs Work'; color = 'text-orange-400' }
  else { label = 'Critical'; color = 'text-rose-400' }

  return {
    score: total, label, color,
    breakdown: [
      { name: 'Workout', score: workoutScore, max: 30 },
      { name: 'Sleep', score: sleepScore, max: 20 },
      { name: 'Nutrition', score: nutritionScore, max: 20 },
      { name: 'Hydration', score: hydrationScore, max: 15 },
      { name: 'Tracking', score: bodyScore, max: 15 },
    ]
  }
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { workouts, meals, sleep, hydration, bodyMetrics } = useAppStore()
  const [profile, setProfile] = useState<{ age: number; sex: string; height: number; activity: string; goal: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vitalfi_health_profile')
      if (stored) setProfile(JSON.parse(stored))
    } catch {}
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const quote = useMemo(() => getMotivationalQuote(), [])

  const todayStats = useMemo(() => {
    const todayWorkouts = workouts.filter((w: any) => w.date === today)
    const todayMeals = meals.filter((m: any) => m.date === today)
    const todayHydration = hydration.filter((h: any) => h.date === today)
    const todaySleep = sleep.filter((s: any) => s.date === today)
    return {
      workouts: todayWorkouts.length,
      meals: todayMeals.length,
      calories: todayMeals.reduce((s: number, m: any) => s + m.calories, 0),
      protein: todayMeals.reduce((s: number, m: any) => s + m.protein, 0),
      water: todayHydration.reduce((s: number, h: any) => s + h.amount, 0),
      sleepHours: todaySleep.reduce((s: number, sl: any) => s + sl.duration, 0),
      sleepQuality: todaySleep.length > 0 ? todaySleep[0].quality : 0,
    }
  }, [workouts, meals, hydration, sleep])

  const healthScore = useMemo(() => computeHealthScore({ workouts, meals, sleep, hydration, bodyMetrics }), [workouts, meals, sleep, hydration, bodyMetrics])

  const weekWorkouts = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return workouts.filter((w: any) => new Date(w.date) >= weekAgo).length
  }, [workouts])

  const last7Calories = useMemo(() => {
    const days: { label: string; cals: number; date: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayMeals = meals.filter((m: any) => m.date === ds)
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: ds,
        cals: dayMeals.reduce((s: number, m: any) => s + m.calories, 0),
      })
    }
    return days
  }, [meals])

  const latestMetric = useMemo(() => {
    const sorted = [...bodyMetrics].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted[0] || null
  }, [bodyMetrics])

  const bodyComp = useMemo(() => {
    if (!profile || !latestMetric?.weight) return null
    const bmi = calculateBMI?.(latestMetric.weight, profile.height) ?? 0
    const bmr = calculateBMR?.(latestMetric.weight, profile.height, profile.age, profile.sex as 'male' | 'female') ?? 0
    const tdee = calculateTDEE?.(bmr, profile.activity as any) ?? 0
    const calNeeds = calculateCalorieNeeds?.(tdee, profile.goal as any) ?? {}
    return { bmi, bmr, tdee, targetCalories: calNeeds.targetCalories || tdee, bmiClass: bmiCategory?.(bmi) ?? { label: 'Normal', color: 'text-emerald-400' } }
  }, [profile, latestMetric])

  const insights = useMemo(() => {
    const list: { icon: React.ReactNode; text: string; type: 'good' | 'warning' | 'info' }[] = []
    if (todayStats.water < 2000) list.push({ icon: <Droplets size={14} />, text: `Drink ${Math.round((2500 - todayStats.water) / 100) * 100}ml more water today`, type: 'warning' })
    if (todayStats.sleepHours < 7 && todayStats.sleepHours > 0) list.push({ icon: <Moon size={14} />, text: 'You slept less than 7h — aim for 7-9h', type: 'warning' })
    if (todayStats.protein < 80 && todayStats.meals > 0) list.push({ icon: <Utensils size={14} />, text: 'Increase protein intake', type: 'info' })
    if (weekWorkouts === 0) list.push({ icon: <Dumbbell size={14} />, text: 'No workouts this week — even 20min helps', type: 'warning' })
    if (weekWorkouts >= 4) list.push({ icon: <Flame size={14} />, text: `${weekWorkouts} workouts this week — great consistency!`, type: 'good' })
    if (todayStats.meals === 0) list.push({ icon: <Utensils size={14} />, text: 'No meals logged today', type: 'info' })
    return list.slice(0, 4)
  }, [todayStats, weekWorkouts])

  return (
    <div className="space-y-6">
      {/* Health Score Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 border border-purple-500/10 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full -ml-16 -mb-16 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="url(#healthGradient)" strokeWidth="8"
                  strokeDasharray={`${(healthScore.score / 100) * 327} 327`} strokeLinecap="round" className="transition-all duration-1000" />
                <defs><linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={`text-3xl font-black ${healthScore.color}`}>{healthScore.score}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest">Score</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart size={16} className={healthScore.color} />
                <h2 className={`text-lg font-bold ${healthScore.color}`}>{healthScore.label}</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-md">
                {healthScore.score >= 80 ? "Outstanding! You're crushing every aspect of your health." :
                 healthScore.score >= 60 ? "Good progress! A few small tweaks can elevate your score." :
                 healthScore.score >= 40 ? "You're on the right track. Focus on consistency." :
                 "Let's get started! Small steps lead to big changes."}
              </p>
              <p className="text-xs text-slate-500 mt-2 italic">"{quote.text}" — {quote.author}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 w-full lg:w-auto">
            {healthScore.breakdown.map((b: any) => (
              <div key={b.name} className="text-center">
                <div className="h-16 w-full rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden relative mb-1">
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500/40 to-purple-500/10 transition-all duration-500" style={{ height: `${(b.score / b.max) * 100}%` }} />
                  <span className="relative z-10 text-xs font-bold text-white flex items-center justify-center h-full">{b.score}</span>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workouts', value: todayStats.workouts, unit: 'today', icon: <Dumbbell size={16} />, color: 'from-rose-500/20 border-rose-500/20', textColor: 'text-rose-400' },
          { label: 'Calories', value: Math.round(todayStats.calories), unit: 'kcal', icon: <Flame size={16} />, color: 'from-orange-500/20 border-orange-500/20', textColor: 'text-orange-400' },
          { label: 'Water', value: Math.round(todayStats.water / 100) * 100, unit: 'ml', icon: <Droplets size={16} />, color: 'from-sky-500/20 border-sky-500/20', textColor: 'text-sky-400' },
          { label: 'Sleep', value: todayStats.sleepHours, unit: 'hrs', icon: <Moon size={16} />, color: 'from-violet-500/20 border-violet-500/20', textColor: 'text-violet-400' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.color} via-transparent to-transparent p-5 shadow-lg`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.02] rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className={item.textColor}>{item.icon}</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className="text-[10px] text-gray-500">{item.unit}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calorie Trend + Body Comp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-indigo-500/10">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">7-Day Calorie Trend</h3>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Calories}>
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="cals" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {last7Calories.map((_, idx) => (
                      <Cell key={idx} fill={last7Calories[idx].cals > 0 ? '#818cf8' : '#374151'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {profile && bodyComp && (
          <Card className="border-purple-500/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Body Composition</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'BMI', value: bodyComp.bmi.toFixed(1), sub: bodyComp.bmiClass.label, color: bodyComp.bmiClass.color || 'text-cyan-400' },
                  { label: 'BMR', value: `${bodyComp.bmr}`, sub: 'kcal/day', color: 'text-cyan-400' },
                  { label: 'TDEE', value: `${bodyComp.tdee}`, sub: 'kcal/day', color: 'text-emerald-400' },
                  { label: 'Target', value: `${bodyComp.targetCalories}`, sub: 'kcal/day', color: 'text-amber-400' },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
                    <p className="text-lg font-bold text-white">{m.value}</p>
                    <p className={`text-[10px] ${m.color}`}>{m.sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-white/[0.08]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} className="text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Smart Insights</h3>
            </div>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${
                  insight.type === 'good' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  insight.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                  'bg-white/[0.03] border border-white/[0.06]'
                }`}>
                  <span className={`mt-0.5 ${insight.type === 'good' ? 'text-emerald-400' : insight.type === 'warning' ? 'text-amber-400' : 'text-purple-400'}`}>{insight.icon}</span>
                  <p className={`text-xs ${insight.type === 'good' ? 'text-emerald-300' : insight.type === 'warning' ? 'text-amber-300' : 'text-slate-300'}`}>{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Log Workout', icon: <Dumbbell size={16} />, color: 'from-rose-500/20', textColor: 'text-rose-400', tab: 'training' },
          { label: 'Log Meal', icon: <Utensils size={16} />, color: 'from-orange-500/20', textColor: 'text-orange-400', tab: 'diet' },
          { label: 'Log Sleep', icon: <Moon size={16} />, color: 'from-violet-500/20', textColor: 'text-violet-400', tab: 'sleep' },
          { label: 'Log Supps', icon: <Zap size={16} />, color: 'from-cyan-500/20', textColor: 'text-cyan-400', tab: 'supplements' },
        ].map((action) => (
          <button key={action.label} onClick={() => onNavigate?.(action.tab)}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br hover:bg-white/[0.04] transition-all p-4 text-left group">
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 bg-gradient-to-br ${action.color} to-transparent opacity-50`} />
            <div className="relative">
              <div className={`${action.textColor} mb-1.5 group-hover:scale-110 transition-transform`}>{action.icon}</div>
              <p className="text-sm font-semibold text-white">{action.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Quick add</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
