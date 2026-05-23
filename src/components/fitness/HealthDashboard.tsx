import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Heart, Activity, Brain, Droplets, Moon, Dumbbell, Utensils,
  Target, Shield, ChevronRight, Zap, Flame, Smartphone,
} from 'lucide-react'
import {
  calculateBMI, bmiCategory, calculateBMR, calculateTDEE,
  calculateCalorieNeeds, calculateProteinNeeds, calculateMacroSplit,
  calculateWaterIntake, calculateSleepNeeds, classifyBMI,
} from '@/lib/calculations'
import type { BodyMetric, Meal, SleepEntry, HydrationEntry, Workout } from '@/types/fitness'

interface HealthDashboardProps {
  onNavigate?: (tab: string) => void
}

function computeHealthScore(data: {
  workouts: Workout[], meals: Meal[], sleep: SleepEntry[],
  hydration: HydrationEntry[], bodyMetrics: BodyMetric[]
}): { score: number; label: string; color: string; breakdown: { name: string; score: number; max: number }[] } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30)

  const workoutsThisMonth = data.workouts.filter(w => new Date(w.date) >= monthAgo).length
  const workoutScore = Math.min(Math.round((workoutsThisMonth / 16) * 30), 30)

  const recentSleep = data.sleep.filter(s => new Date(s.date) >= weekAgo)
  const avgQuality = recentSleep.length > 0 ? recentSleep.reduce((s, e) => s + e.quality, 0) / recentSleep.length : 0
  const sleepScore = Math.min(Math.round((avgQuality / 5) * 20), 20)

  const todayMeals = data.meals.filter(m => m.date === today)
  const hasProtein = todayMeals.some(m => m.protein > 20)
  const hasVeggies = todayMeals.length >= 3
  let nutritionScore = 0
  if (todayMeals.length > 0) nutritionScore += 5
  if (hasProtein) nutritionScore += 5
  if (hasVeggies) nutritionScore += 5
  if (todayMeals.reduce((s, m) => s + m.calories, 0) > 1200) nutritionScore += 5
  nutritionScore = Math.min(nutritionScore, 20)

  const todayHydration = data.hydration.filter(h => h.date === today)
  const totalWater = todayHydration.reduce((s, h) => s + h.amount, 0)
  const hydrationScore = Math.min(Math.round((totalWater / 2500) * 15), 15)

  const hasRecentMetric = data.bodyMetrics.some(m => new Date(m.date) >= weekAgo)
  const bodyMetricCount = data.bodyMetrics.filter(m => new Date(m.date) >= monthAgo).length
  const bodyScore = hasRecentMetric ? Math.min(5 + Math.min(bodyMetricCount, 10), 15) : 0

  const total = workoutScore + sleepScore + nutritionScore + hydrationScore + bodyScore

  let label: string, color: string
  if (total >= 85) { label = 'Excellent'; color = 'text-emerald-400' }
  else if (total >= 70) { label = 'Good'; color = 'text-green-400' }
  else if (total >= 50) { label = 'Fair'; color = 'text-amber-400' }
  else if (total >= 30) { label = 'Needs Work'; color = 'text-orange-400' }
  else { label = 'Critical'; color = 'text-rose-400' }

  return {
    score: total,
    label,
    color,
    breakdown: [
      { name: 'Workout', score: workoutScore, max: 30 },
      { name: 'Sleep', score: sleepScore, max: 20 },
      { name: 'Nutrition', score: nutritionScore, max: 20 },
      { name: 'Hydration', score: hydrationScore, max: 15 },
      { name: 'Tracking', score: bodyScore, max: 15 },
    ]
  }
}

export function HealthDashboard({ onNavigate }: HealthDashboardProps) {
  const { workouts, meals, sleep, hydration, bodyMetrics } = useAppStore()
  const [profile, setProfile] = useState<{ age: number; sex: string; height: number; activity: string; goal: string } | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vitalfi_health_profile')
      if (stored) setProfile(JSON.parse(stored))
    } catch {}
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const todayStats = useMemo(() => {
    const todayWorkouts = workouts.filter(w => w.date === today)
    const todayMeals = meals.filter(m => m.date === today)
    const todayHydration = hydration.filter(h => h.date === today)
    const todaySleep = sleep.filter(s => s.date === today)

    return {
      workouts: todayWorkouts.length,
      meals: todayMeals.length,
      calories: todayMeals.reduce((s, m) => s + m.calories, 0),
      protein: todayMeals.reduce((s, m) => s + m.protein, 0),
      water: todayHydration.reduce((s, h) => s + h.amount, 0),
      sleepHours: todaySleep.reduce((s, sl) => s + sl.duration, 0),
      sleepQuality: todaySleep.length > 0 ? todaySleep[0].quality : 0,
    }
  }, [workouts, meals, hydration, sleep])

  const healthScore = useMemo(() => computeHealthScore({ workouts: workouts as any, meals, sleep, hydration, bodyMetrics }), [workouts, meals, sleep, hydration, bodyMetrics])

  const weekWorkouts = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return workouts.filter(w => new Date(w.date) >= weekAgo).length
  }, [workouts])

  const latestMetric = useMemo(() => {
    const sorted = [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return sorted[0] || null
  }, [bodyMetrics])

  const bodyComp = useMemo(() => {
    if (!profile || !latestMetric?.weight) return null
    const bmi = calculateBMI(latestMetric.weight, profile.height)
    const bmr = calculateBMR(latestMetric.weight, profile.height, profile.age, profile.sex as 'male' | 'female')
    const tdee = calculateTDEE(bmr, profile.activity as any)
    const calNeeds = calculateCalorieNeeds(tdee, profile.goal as any)
    return { bmi, bmr, tdee, targetCalories: calNeeds.targetCalories, projectedWeeklyChangeKg: calNeeds.projectedWeeklyChangeKg, projectedMonthlyChangeKg: calNeeds.projectedMonthlyChangeKg, goal: calNeeds.goal, deficit: calNeeds.deficit, bmiClass: bmiCategory(bmi), bmiFull: classifyBMI(bmi) }
  }, [profile, latestMetric])

  const recoWater = useMemo(() => {
    if (!latestMetric?.weight) return null
    return calculateWaterIntake(latestMetric.weight, {
      exerciseHoursPerDay: weekWorkouts > 3 ? 1 : 0
    })
  }, [latestMetric, weekWorkouts])

  const recoSleep = useMemo(() => {
    if (!profile) return null
    return calculateSleepNeeds(profile.activity as any, {
      age: profile.age,
      intenseTraining: weekWorkouts > 5,
    })
  }, [profile, weekWorkouts])

  const macroRecs = useMemo(() => {
    if (!bodyComp?.tdee || !profile) return null
    const protein = calculateProteinNeeds(latestMetric?.weight || 75, profile.goal as any, bodyComp.targetCalories)
    const macros = calculateMacroSplit(bodyComp.targetCalories, profile.goal === 'low_carb' ? 'low_carb' : profile.goal === 'keto' ? 'keto' : 'balanced')
    return { protein, macros }
  }, [bodyComp, profile, latestMetric])

  const insights = useMemo(() => {
    const list: { icon: React.ReactNode; text: string; type: 'good' | 'warning' | 'info' }[] = []
    if (todayStats.water < 2000) list.push({ icon: <Droplets size={14} />, text: `Drink ${Math.round((2500 - todayStats.water) / 100) * 100}ml more water today`, type: 'warning' })
    if (todayStats.sleepHours < 7 && todayStats.sleepHours > 0) list.push({ icon: <Moon size={14} />, text: 'You slept less than 7h — aim for 7-9h for optimal recovery', type: 'warning' })
    if (todayStats.protein < 80 && todayStats.meals > 0) list.push({ icon: <Utensils size={14} />, text: 'Increase protein intake — aim for 1.6-2.2g per kg of bodyweight', type: 'info' })
    if (weekWorkouts === 0) list.push({ icon: <Dumbbell size={14} />, text: 'No workouts this week — even 20min of activity helps', type: 'warning' })
    if (weekWorkouts >= 4) list.push({ icon: <Flame size={14} />, text: `Great consistency! ${weekWorkouts} workouts this week`, type: 'good' })
    if (todayStats.workouts > 0) list.push({ icon: <Zap size={14} />, text: 'Workout logged today — excellent!', type: 'good' })
    if (todayStats.meals === 0) list.push({ icon: <Utensils size={14} />, text: 'No meals logged today — track what you eat', type: 'info' })
    if (macroRecs && Math.abs(todayStats.calories - macroRecs.macros.totalCalories) > 500 && todayStats.calories > 0) {
      list.push({ icon: <Target size={14} />, text: `Calories ${todayStats.calories > macroRecs.macros.totalCalories ? 'over' : 'under'} target by ${Math.abs(todayStats.calories - macroRecs.macros.totalCalories)}kcal`, type: 'info' })
    }
    if (bodyComp?.bmi && bodyComp.bmi > 25) list.push({ icon: <Heart size={14} />, text: `BMI ${bodyComp.bmi} — ${bodyComp.bmiFull.category}. Small changes add up.`, type: 'info' })
    return list.slice(0, 5)
  }, [todayStats, weekWorkouts, bodyComp, macroRecs])

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
                  strokeDasharray={`${(healthScore.score / 100) * 327} 327`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
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
                <Heart size={16} className={`${healthScore.color}`} />
                <h2 className={`text-lg font-bold ${healthScore.color}`}>{healthScore.label}</h2>
              </div>
              <p className="text-sm text-slate-400 max-w-md">
                {healthScore.score >= 80 ? "Outstanding! You're crushing every aspect of your health." :
                 healthScore.score >= 60 ? "Good progress! A few small tweaks can elevate your score." :
                 healthScore.score >= 40 ? "You're on the right track. Focus on consistency." :
                 "Let's get started! Small steps lead to big changes."}
              </p>
              {!profile && (
                <button
                  onClick={() => { const a = prompt('Age:'); const s = prompt('Sex (male/female):'); const h = prompt('Height (cm):'); const ac = prompt('Activity (sedentary/light/moderate/active/very_active):'); const g = prompt('Goal (fat_loss/muscle_gain/maintenance/endurance):'); if (a && s && h && ac && g) { const p = { age: parseInt(a), sex: s, height: parseInt(h), activity: ac, goal: g }; localStorage.setItem('vitalfi_health_profile', JSON.stringify(p)); setProfile(p) } }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Smartphone size={12} />
                  Set up health profile for personalized insights
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 w-full lg:w-auto">
            {healthScore.breakdown.map((b) => (
              <div key={b.name} className="text-center">
                <div className="h-16 w-full rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden relative mb-1">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500/40 to-purple-500/10 transition-all duration-500"
                    style={{ height: `${(b.score / b.max) * 100}%` }}
                  />
                  <span className="relative z-10 text-xs font-bold text-white flex items-center justify-center h-full">
                    {b.score}
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Today's Quick Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Workouts', value: todayStats.workouts, unit: 'today', icon: <Dumbbell size={16} />, color: 'from-rose-500/20 to-transparent border-rose-500/20', textColor: 'text-rose-400' },
          { label: 'Calories', value: Math.round(todayStats.calories), unit: macroRecs ? `/ ${macroRecs.macros.totalCalories}` : 'kcal', icon: <Flame size={16} />, color: 'from-orange-500/20 to-transparent border-orange-500/20', textColor: 'text-orange-400' },
          { label: 'Water', value: Math.round(todayStats.water / 100) * 100, unit: recoWater ? `/ ${Math.round(recoWater.adjustedLiters * 1000)}ml` : 'ml', icon: <Droplets size={16} />, color: 'from-sky-500/20 to-transparent border-sky-500/20', textColor: 'text-sky-400' },
          { label: 'Sleep', value: todayStats.sleepHours, unit: 'hours', icon: <Moon size={16} />, color: 'from-violet-500/20 to-transparent border-violet-500/20', textColor: 'text-violet-400' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${item.color} p-6`}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -mr-8 -mt-8" />
            <div className="relative">
              <div className={`${item.textColor} mb-1.5`}>{item.icon}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{item.value}</span>
                <span className="text-[10px] text-slate-500">{item.unit}</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{item.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Body Composition + Macro Targets */}
      {profile && bodyComp && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Body Composition */}
          <Card className="border-purple-500/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Body Composition</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'BMI', value: bodyComp.bmi, sub: bodyComp.bmiClass.label, color: bodyComp.bmiClass.color },
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
              {bodyComp.bmiFull && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.02] rounded-lg px-3 py-2">
                  <Shield size={12} className="text-purple-400" />
                  {bodyComp.bmiFull.category} — {bodyComp.bmiFull.risk}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macro Targets */}
          {macroRecs && (
            <Card className="border-amber-500/10">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Daily Targets</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Protein', value: `${macroRecs.protein.recommendedGrams}g`, target: macroRecs.macros.proteinPercent, color: 'from-rose-500/30 to-rose-500/10', textColor: 'text-rose-400' },
                    { label: 'Carbs', value: `${macroRecs.macros.carbsGrams}g`, target: macroRecs.macros.carbsPercent, color: 'from-amber-500/30 to-amber-500/10', textColor: 'text-amber-400' },
                    { label: 'Fat', value: `${macroRecs.macros.fatGrams}g`, target: macroRecs.macros.fatPercent, color: 'from-sky-500/30 to-sky-500/10', textColor: 'text-sky-400' },
                  ].map((m) => (
                    <div key={m.label} className={`rounded-lg bg-gradient-to-br ${m.color} border border-white/[0.06] p-3 text-center`}>
                      <p className="text-[10px] text-slate-500 uppercase mb-1">{m.label}</p>
                      <p className="text-xl font-bold text-white">{m.value}</p>
                      <p className={`text-[10px] ${m.textColor}`}>{m.target}% of calories</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 bg-white/[0.02] rounded-lg px-3 py-2">
                  <span>Total: {macroRecs.macros.totalCalories} kcal</span>
                  <span className="text-emerald-400">{macroRecs.protein.recommendedGrams}g protein ({macroRecs.protein.minGrams}-{macroRecs.protein.maxGrams}g range)</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Water & Sleep Recommendations */}
      {recoWater && recoSleep && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-sky-500/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={16} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Hydration Recommendation</h3>
              </div>
              <p className="text-lg font-bold text-sky-400">{recoWater.adjustedLiters}L <span className="text-sm font-normal text-slate-500">({recoWater.adjustedOz}oz) / day</span></p>
              {recoWater.adjustments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {recoWater.adjustments.map((adj, i) => (
                    <p key={i} className="text-xs text-slate-400 flex items-center gap-1"><ChevronRight size={10} className="text-sky-400" />{adj}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border-violet-500/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Moon size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Sleep Recommendation</h3>
              </div>
              <p className="text-lg font-bold text-violet-400">{recoSleep.recommendedHours}h <span className="text-sm font-normal text-slate-500">({recoSleep.minHours}-{recoSleep.maxHours}h range)</span></p>
              <div className="mt-2 space-y-1">
                {recoSleep.factors.map((f, i) => (
                  <p key={i} className="text-xs text-slate-400 flex items-center gap-1"><ChevronRight size={10} className="text-violet-400" />{f}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Smart Insights */}
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
                  <span className={`mt-0.5 ${
                    insight.type === 'good' ? 'text-emerald-400' :
                    insight.type === 'warning' ? 'text-amber-400' : 'text-purple-400'
                  }`}>{insight.icon}</span>
                  <p className={`text-xs ${
                    insight.type === 'good' ? 'text-emerald-300' :
                    insight.type === 'warning' ? 'text-amber-300' : 'text-slate-300'
                  }`}>{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Log Workout', icon: <Dumbbell size={16} />, color: 'from-rose-500/20 to-transparent border-rose-500/20', textColor: 'text-rose-400', tab: 'workouts' },
          { label: 'Log Meal', icon: <Utensils size={16} />, color: 'from-orange-500/20 to-transparent border-orange-500/20', textColor: 'text-orange-400', tab: 'nutrition' },
          { label: 'Add Water', icon: <Droplets size={16} />, color: 'from-sky-500/20 to-transparent border-sky-500/20', textColor: 'text-sky-400', tab: 'hydration' },
          { label: 'Log Sleep', icon: <Moon size={16} />, color: 'from-violet-500/20 to-transparent border-violet-500/20', textColor: 'text-violet-400', tab: 'sleep' },
        ].map((action) => (
          <button key={action.label} onClick={() => onNavigate?.(action.tab)}
            className="relative overflow-hidden rounded-xl border bg-gradient-to-br hover:bg-white/[0.04] transition-all p-4 text-left group"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 bg-gradient-to-br ${action.color} opacity-50`} />
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
