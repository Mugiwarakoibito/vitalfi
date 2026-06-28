import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, TrendingDown, TrendingUp, Activity, Target, Flame, Calendar,
  LineChart as LineChartIcon,
  Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Minus, BarChart3,
  Brain, Sparkles, Heart, AlertTriangle, RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory, calculateBMR, calculateTDEE, calculateBodyFatNavy } from '@/lib/calculations'
import type { BodyMetric } from '@/types/fitness'
import type { BodyFatResult } from '@/lib/calculations'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'

const GOAL_STORAGE_KEY = 'vitalfi_body_goal_weight'
const GOAL_BF_KEY = 'vitalfi_body_goal_bf'

const measurementFields = [
  { key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'hips', label: 'Hips' },
  { key: 'biceps', label: 'Biceps' }, { key: 'thighs', label: 'Thighs' }, { key: 'calves', label: 'Calves' },
  { key: 'neck', label: 'Neck' }, { key: 'shoulders', label: 'Shoulders' },
]

const bmiRanges = [
  { max: 18.5, label: 'Underweight', color: '#06b6d4' }, { max: 25, label: 'Normal', color: '#10b981' },
  { max: 30, label: 'Overweight', color: '#f59e0b' }, { max: 35, label: 'Obese I', color: '#f97316' },
  { max: 40, label: 'Obese II', color: '#ef4444' }, { max: Infinity, label: 'Obese III', color: '#dc2626' },
]

type ChartEntry = Record<string, string | number | undefined>

function computeBodyScore(latest: BodyMetric | undefined, bmi: number | null, bodyMetricsCount: number): { score: number; label: string; color: string } {
  let score = 50
  if (bmi != null) { if (bmi >= 18.5 && bmi <= 25) score += 25; else if (bmi >= 17 || bmi <= 27) score += 15; else score += 5 }
  if (latest?.bodyFat != null) { if (latest.bodyFat >= 10 && latest.bodyFat <= 20) score += 15; else if (latest.bodyFat >= 8 && latest.bodyFat <= 25) score += 8; else score += 2 }
  score += Math.min(bodyMetricsCount, 10); score = Math.max(0, Math.min(100, score))
  const label = score >= 85 ? 'Excellent' : score >= 70 ? 'Great' : score >= 55 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#06b6d4' : score >= 55 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return { score, label, color }
}

function generateInsights(
  sorted: BodyMetric[], chronological: BodyMetric[], latest: BodyMetric | undefined,
  goal: number | null, recentWeeklyChange: number | null, projectedWeeks: number | null,
  estimatedBfResult: BodyFatResult | null, useEstimatedBf: boolean,
  bodyFocus: string,
): string[] {
  const insights: string[] = []
  if (sorted.length === 0) return insights
  const firstDate = new Date(sorted[sorted.length - 1]?.date ?? ''); const lastDate = new Date(sorted[0]?.date ?? '')
  const trackingDays = Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1

  // Focus-specific tip first — always visible
  const focusTips: Record<string, string[]> = {
    'fat-loss': [
      'Prioritize a moderate calorie deficit of 300–500 kcal/day',
      'Track protein intake to preserve lean mass during fat loss',
      'Incorporate 3–4 resistance sessions per week',
      'Focus on whole foods — fiber-rich veggies keep you full',
    ],
    'muscle-gain': [
      'Aim for a modest calorie surplus of 200–400 kcal/day',
      'Target 1.6–2.0 g protein per kg of body weight',
      'Focus on progressive overload in compound lifts',
      'Ensure 7–9 hours of sleep for optimal recovery',
    ],
    'maintain': [
      'Balance calories to match your TDEE consistently',
      'Maintain protein intake at ~1.2–1.6 g per kg of body weight',
      'Mix resistance and cardio for overall health',
      'Track weight weekly to catch drift early',
    ],
    'recomposition': [
      'Eat at maintenance or a very small deficit (~200 kcal)',
      'Prioritize protein — 1.6–2.2 g per kg of body weight',
      'Follow a structured progressive resistance program',
      'Patience is key — recomposition takes 8–12 weeks to show',
    ],
  }
  const defaultTips = [
    'Log consistently to unlock personalized insights',
    'Track measurements alongside weight for better context',
    'Set a goal weight using the Target icon above',
  ]
  const tips = focusTips[bodyFocus] ?? defaultTips
  insights.push(`🎯 ${tips[Math.floor(Math.random() * tips.length)]}`)

  if (trackingDays > 0) insights.push(`You've been tracking for ${trackingDays} day${trackingDays !== 1 ? 's' : ''}`)
  const last30Count = chronological.filter(m => { const d = new Date(m.date); const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30); return d >= cutoff }).length
  if (last30Count > 0) insights.push(`Averaging ${((last30Count / 30) * 7).toFixed(1)} entries per week (${last30Count} in last 30 days)`)
  if (recentWeeklyChange != null && Math.abs(recentWeeklyChange) > 0) {
    insights.push(`Currently ${recentWeeklyChange < 0 ? 'losing' : 'gaining'} ${Math.abs(recentWeeklyChange).toFixed(2)} kg per week`)
  }
  if (goal && projectedWeeks != null && latest?.weight != null) {
    insights.push(`On track to ${latest.weight > goal ? 'reach' : 'hit'} your goal in ~${projectedWeeks} week${projectedWeeks !== 1 ? 's' : ''}`)
  }
  if (useEstimatedBf && estimatedBfResult != null && estimatedBfResult.bodyFatPercent > 0) {
    insights.push(`Body fat estimated at ${estimatedBfResult.bodyFatPercent.toFixed(1)}% via circumference method`)
  }
  if (latest?.bodyFat != null) {
    const bfCat = latest.bodyFat <= 10 ? 'lean' : latest.bodyFat <= 18 ? 'fit' : latest.bodyFat <= 25 ? 'moderate' : 'higher'
    insights.push(`Body fat level is in the ${bfCat} range (${latest.bodyFat.toFixed(1)}%)`)
  }

  return insights.slice(0, 6)
}

export function BodyMetricsTracker({ heightCm = 175 }: { heightCm?: number }) {
  const { bodyMetrics, addBodyMetric, deleteBodyMetric, settings } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [deletingEntry, setDeletingEntry] = useState<BodyMetric | null>(null)
  const [targetWeight, setTargetWeight] = useState<string>(() => localStorage.getItem(GOAL_STORAGE_KEY) ?? '')
  const [goalBodyFat, setGoalBodyFat] = useState<string>(() => localStorage.getItem(GOAL_BF_KEY) ?? '')
  const [chartTab, setChartTab] = useState<'weight' | 'measurements' | 'composition'>('weight')
  const [showBodyCoach, setShowBodyCoach] = useState(false)
  const [showBodyScope, setShowBodyScope] = useState(false)
  const [showBodySettings, setShowBodySettings] = useState(false)
  const [bodyFocus, setBodyFocus] = useState<'balanced' | 'fat-loss' | 'muscle-gain' | 'maintain' | 'recomposition'>('balanced')
  const [showBodyFocusPref, setShowBodyFocusPref] = useState(false)
  const [scopeOffset, setScopeOffset] = useState(0)
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const isToday = targetDate === today

  const navigateDate = (dir: number) => {
    const d = new Date(targetDate)
    d.setDate(d.getDate() + dir)
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setTargetDate(ds)
  }

  const scopeWeek = useMemo(() => {
    const days: { fullDate: string; label: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i + scopeOffset * 7)
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      days.push({
        fullDate: ds,
        label: i === 0 && scopeOffset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      })
    }
    return days
  }, [scopeOffset])

  const isScopeCurrentWeek = scopeOffset === 0

  useEffect(() => { localStorage.setItem(GOAL_STORAGE_KEY, targetWeight) }, [targetWeight])
  useEffect(() => { localStorage.setItem(GOAL_BF_KEY, goalBodyFat) }, [goalBodyFat])

  const sorted = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bodyMetrics])
  const chronological = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bodyMetrics])
  const latest = sorted[0]; const previous = sorted[1]
  const weightChange = latest && previous && latest.weight != null && previous.weight != null ? latest.weight - previous.weight : 0
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  const entry7d = sorted.find(m => m.date >= sevenDaysAgo)
  const change7d = entry7d && latest?.weight != null && entry7d.weight != null ? latest.weight - entry7d.weight : null
  const goal = parseFloat(targetWeight)
  const goalPercent = goal && latest?.weight != null ? ((1 - Math.abs(latest.weight - goal) / Math.max(goal, latest.weight)) * 100) : null
  const bmi = latest?.weight && heightCm ? calculateBMI(latest.weight, heightCm) : null
  const bmiCat = bmi ? bmiCategory(bmi) : null
  const biologicalSex = settings.sex === 'other' ? 'male' : (settings.sex || 'male')
  const bmr = latest?.weight && heightCm ? calculateBMR(latest.weight, heightCm, settings.age || 30, biologicalSex) : null
  const tdee = bmr ? calculateTDEE(bmr, settings.activityLevel || 'moderate') : null
  const leanMass = latest?.weight && latest?.bodyFat != null ? latest.weight * (1 - latest.bodyFat / 100) : null
  const fatMass = latest?.weight && latest?.bodyFat != null ? latest.weight * (latest.bodyFat / 100) : null

  const bodyScore = computeBodyScore(latest, bmi, bodyMetrics.length)
  const recentWeeklyChange = useMemo(() => {
    const recent = chronological.filter(m => m.date >= sevenDaysAgo && m.weight != null)
    if (recent.length < 2) return null
    const first = recent[0].weight!; const last = recent[recent.length - 1].weight!
    const days = Math.max(1, (new Date(recent[recent.length - 1].date).getTime() - new Date(recent[0].date).getTime()) / 86400000)
    return (last - first) / (days / 7)
  }, [chronological])

  const projectedWeeks = recentWeeklyChange && goal && latest?.weight != null && Math.abs(recentWeeklyChange) > 0
    ? Math.ceil(Math.abs(latest.weight - goal) / Math.abs(recentWeeklyChange)) : null

  const chartData = useMemo(() => chronological.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight, bodyFat: m.bodyFat, fullDate: m.date,
  })), [chronological])

  const measureChartData = useMemo(() => {
    if (chronological.length < 2) return []
    let data = chronological
    if (scopeOffset !== 0) {
      const start = scopeWeek[0].fullDate
      const end = scopeWeek[6].fullDate
      data = data.filter(m => m.date >= start && m.date <= end)
    } else {
      data = data.slice(-30)
    }
    return data.map(m => {
      const entry: ChartEntry = { date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      measurementFields.forEach(f => { if (m.measurements?.[f.key] != null) entry[f.key] = m.measurements[f.key] })
      return entry
    })
  }, [chronological, scopeOffset, scopeWeek])

  const activeMeasureFields = useMemo(() => measurementFields.filter(f => measureChartData.some(d => d[f.key] != null)), [measureChartData])

  const estimatedBfResult = useMemo<BodyFatResult | null>(() => {
    if (latest?.bodyFat != null) return null
    const m = latest?.measurements
    if (!m?.neck || !m?.waist) return null
    if (biologicalSex === 'female' && !m?.hips) return null
    return calculateBodyFatNavy({ height: heightCm, neck: m.neck, waist: m.waist, hip: biologicalSex === 'female' ? m.hips : undefined }, biologicalSex)
  }, [latest, biologicalSex, heightCm])

  const useEstimatedBf = latest?.bodyFat == null && estimatedBfResult != null && estimatedBfResult.bodyFatPercent > 0

  const insights = useMemo(() => generateInsights(sorted, chronological, latest, goal, recentWeeklyChange, projectedWeeks, estimatedBfResult, useEstimatedBf, bodyFocus),
    [sorted, chronological, latest, goal, recentWeeklyChange, projectedWeeks, estimatedBfResult, useEstimatedBf, bodyFocus])

  const filteredChartData = useMemo(() => {
    if (scopeOffset !== 0) {
      const start = scopeWeek[0].fullDate
      const end = scopeWeek[6].fullDate
      return chartData.filter(d => d.fullDate >= start && d.fullDate <= end)
    }
    return chartData
  }, [chartData, scopeOffset, scopeWeek])

  const weightOrDefault = latest?.weight?.toString() ?? '70'
  const bodyFatOrDefault = latest?.bodyFat?.toString() ?? '15'

  const reset = () => { setDate(new Date().toISOString().split('T')[0]); setWeight(''); setBodyFat(''); setMeasurements({}) }

  const handleSave = async () => {
    const w = parseFloat(weight); if (isNaN(w) || w <= 0) return
    const bf = bodyFat ? parseFloat(bodyFat) : undefined
    if (bf != null && (isNaN(bf) || bf <= 0 || bf > 100)) return
    const numericMeasurements: Record<string, number> = {}
    Object.entries(measurements).forEach(([k, v]) => { const num = parseFloat(v); if (!isNaN(num) && num > 0) numericMeasurements[k] = num })
    await addBodyMetric({ id: generateId(), date, weight: w, bodyFat: bf, measurements: numericMeasurements, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    reset(); setShowForm(false)
  }

  const handleDelete = async () => { if (!deletingEntry) return; await deleteBodyMetric(deletingEntry.id); setDeletingEntry(null) }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Body</h2>
            <p className="text-sm text-gray-400 mt-0.5">Weight, measurements & body composition</p>
          </div>
          <div className="flex items-center gap-2">
            {bodyMetrics.length > 0 && (
              <button className={`p-2 rounded-xl border transition-all ${showBodyCoach ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                onClick={() => setShowBodyCoach(p => !p)} title="BodyCoach">
                <Brain className="w-5 h-5" />
              </button>
            )}
            <button className={`p-2 rounded-xl border transition-all ${showBodyScope ? 'bg-violet-500/15 border-violet-500/30 text-violet-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowBodyScope(p => !p)} title="BodyScope">
              <BarChart3 className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setShowBodySettings(p => !p)}
                className={`p-2 rounded-xl border transition-all ${showBodySettings ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                title="Body Goals">
                <Target className="w-5 h-5" />
              </button>
              {showBodySettings && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBodySettings(false)} />
                  <div className="absolute right-0 top-10 z-20 w-52 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-4">
                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Body Targets</p>
                    {/* Goal Weight */}
                    <div className="mb-3">
                      <label className="text-[10px] text-gray-400 flex items-center gap-1.5 mb-1.5"><Target className="w-3 h-3 text-emerald-400" /> Goal Weight (kg)</label>
                      <div className="relative">
                        <input type="range" min={30} max={250} step={0.1} value={targetWeight || weightOrDefault}
                          onChange={e => setTargetWeight(e.target.value)}
                          className="w-full h-1.5 rounded-full appearance-none bg-white/10 outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-400/30"
                          style={{ background: `linear-gradient(to right, #10b981 ${((parseFloat(targetWeight || weightOrDefault) - 30) / 220) * 100}%, rgba(255,255,255,0.1) ${((parseFloat(targetWeight || weightOrDefault) - 30) / 220) * 100}%)` }} />
                        <div className="absolute -top-7 left-0 right-0 flex justify-center pointer-events-none">
                          <span className="text-sm font-bold text-emerald-400 drop-shadow-lg">{targetWeight || '--'}</span>
                        </div>
                      </div>
                    </div>
                    {/* Goal Body Fat */}
                    <div>
                      <label className="text-[10px] text-gray-400 flex items-center gap-1.5 mb-1.5"><Flame className="w-3 h-3 text-amber-400" /> Goal Body Fat %</label>
                      <div className="relative">
                        <input type="range" min={5} max={50} step={0.1} value={goalBodyFat || bodyFatOrDefault}
                          onChange={e => setGoalBodyFat(e.target.value)}
                          className="w-full h-1.5 rounded-full appearance-none bg-white/10 outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-400/30"
                          style={{ background: `linear-gradient(to right, #f59e0b ${((parseFloat(goalBodyFat || bodyFatOrDefault) - 5) / 45) * 100}%, rgba(255,255,255,0.1) ${((parseFloat(goalBodyFat || bodyFatOrDefault) - 5) / 45) * 100}%)` }} />
                        <div className="absolute -top-7 left-0 right-0 flex justify-center pointer-events-none">
                          <span className="text-sm font-bold text-amber-400 drop-shadow-lg">{goalBodyFat || '--'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all text-[10px] font-bold uppercase tracking-wider">
              <Plus size={12} />Log Entry</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              className="bg-transparent border-none text-white font-medium text-sm outline-none [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity cursor-pointer" />
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && (
            <button onClick={() => setTargetDate(today)} className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Jump to today">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* 6 Stat Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Body Score */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">BODY SCORE</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{bodyScore.score}<span className="text-sm text-gray-500 ml-1 font-normal">/100</span></p>
            <p className="text-xs text-gray-500 mt-0.5">{bodyScore.label}</p>
          </div>
        </div>
        {/* Weight */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">WEIGHT</span>
            </div>
            <p className="text-3xl font-bold text-rose-400 drop-shadow-lg">{latest?.weight?.toFixed(1) ?? '--'}<span className="text-sm text-gray-500 ml-1 font-normal">kg</span></p>
            <p className="text-xs text-gray-500 mt-0.5">
              {weightChange !== 0 ? (
                <span className={`flex items-center gap-1 ${weightChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {weightChange < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                </span>
              ) : previous ? <span className="flex items-center gap-1 text-gray-500"><Minus size={12} /> No change</span> : null}
            </p>
          </div>
        </div>
        {/* BMI */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-emerald-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-emerald-400/80 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">BMI</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-lg">{bmi != null ? bmi.toFixed(1) : '--'}</p>
            {bmiCat && <p className="text-xs font-medium mt-0.5" style={{ color: bmiCat.color }}>{bmiCat.label}</p>}
          </div>
        </div>
        {/* Body Fat */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-amber-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-amber-400/80 text-sm mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">BODY FAT</span>
              {useEstimatedBf && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400/80 font-medium">Est.</span>}
            </div>
            <p className="text-3xl font-bold text-amber-400 drop-shadow-lg">{latest?.bodyFat?.toFixed(1) ?? (useEstimatedBf ? estimatedBfResult!.bodyFatPercent.toFixed(1) : '--')}<span className="text-sm text-gray-500 ml-1 font-normal">%</span></p>
            <p className="text-xs text-gray-500 mt-0.5">
              {useEstimatedBf ? 'Estimated via circumference' : previous?.bodyFat != null && latest?.bodyFat != null ? `${latest.bodyFat - previous.bodyFat > 0 ? '+' : ''}${(latest.bodyFat - previous.bodyFat).toFixed(1)}% change` : null}
            </p>
          </div>
        </div>
        {/* Entries */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-gray-400/80 text-sm mb-1">
              <LineChartIcon className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">ENTRIES</span>
            </div>
            <p className="text-3xl font-bold text-gray-400 drop-shadow-lg">{bodyMetrics.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sorted[sorted.length - 1]?.date ? `Since ${new Date(sorted[sorted.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '--'}</p>
          </div>
        </div>
        {/* 7-Day Change */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60 backdrop-blur-[12px] p-5 shadow-lg shadow-rose-500/5 min-h-[7.5rem]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/15 rounded-full -mr-10 -mt-10 blur-xl" />
          <div className="relative h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-rose-400/80 text-sm mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-[9px] font-semibold uppercase tracking-wider">7-DAY CHANGE</span>
            </div>
            <p className="text-3xl font-bold text-rose-400 drop-shadow-lg">{change7d != null ? `${change7d > 0 ? '+' : ''}${change7d.toFixed(1)}` : '--'}<span className="text-sm text-gray-500 ml-1 font-normal">kg</span></p>
            <div className="flex items-center gap-1 text-xs font-medium mt-1">
              {change7d != null && change7d !== 0 ? (change7d < 0 ? <TrendingDown size={12} className="text-emerald-400" /> : <TrendingUp size={12} className="text-rose-400" />) : <Minus size={12} className="text-gray-500" />}
              <span className={change7d != null && change7d < 0 ? 'text-emerald-400' : change7d != null && change7d > 0 ? 'text-rose-400' : 'text-gray-500'}>
                {change7d != null ? `${change7d > 0 ? '+' : ''}${change7d.toFixed(1)} kg` : 'No data'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BODYCOACH Panel */}
      <AnimatePresence>{bodyMetrics.length > 0 && showBodyCoach && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-xl p-4 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">BODYCOACH</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <button onClick={() => setShowBodyFocusPref(p => !p)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${showBodyFocusPref
                      ? bodyFocus === 'fat-loss' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : bodyFocus === 'muscle-gain' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : bodyFocus === 'maintain' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                        : bodyFocus === 'recomposition' ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                    title="Body focus">
                    <span className="text-[11px] leading-none">{bodyFocus === 'fat-loss' ? '🎯' : bodyFocus === 'muscle-gain' ? '💪' : bodyFocus === 'maintain' ? '⚖️' : bodyFocus === 'recomposition' ? '🔄' : '🏋️'}</span>
                  </button>
                  {showBodyFocusPref && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowBodyFocusPref(false)} />
                      <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-gray-900 border border-white/10 shadow-2xl p-3">
                        <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Body Focus</p>
                        <div className="flex flex-col gap-1">
                          {([
                            { key: 'balanced' as const, label: '🏋️ Balanced' },
                            { key: 'fat-loss' as const, label: '🎯 Fat Loss' },
                            { key: 'muscle-gain' as const, label: '💪 Muscle Gain' },
                            { key: 'maintain' as const, label: '⚖️ Maintain' },
                            { key: 'recomposition' as const, label: '🔄 Recomp' },
                          ]).map(opt => (
                            <button key={opt.key} onClick={() => { setBodyFocus(opt.key); setShowBodyFocusPref(false) }}
                              className={`text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${bodyFocus === opt.key
                                ? opt.key === 'fat-loss' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                  : opt.key === 'muscle-gain' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : opt.key === 'maintain' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : opt.key === 'recomposition' ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats summary bar */}
            <div className="flex items-center gap-4 mb-4 px-1">
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Score</p>
                <p className={`text-lg font-bold ${bodyScore.score >= 70 ? 'text-emerald-400' : bodyScore.score >= 55 ? 'text-amber-400' : 'text-rose-400'}`}>{bodyScore.score}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">BMI</p>
                <p className="text-lg font-bold text-violet-400">{bmi != null ? bmi.toFixed(1) : '--'}</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Goal</p>
                <p className={`text-lg font-bold ${goalPercent != null && goalPercent >= 80 ? 'text-emerald-400' : goalPercent != null && goalPercent >= 50 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {goalPercent != null ? `${Math.round(goalPercent)}%` : '--'}
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Entries</p>
                <p className="text-lg font-bold text-cyan-400">{bodyMetrics.length}</p>
              </div>
            </div>

            {/* Coach cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-gray-400">Body Composition</span>
                </div>
                {leanMass != null && fatMass != null ? (
                  <>
                    <p className="text-sm font-bold text-white">{leanMass.toFixed(1)}<span className="text-xs text-gray-500 font-normal"> kg lean</span></p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{fatMass.toFixed(1)} kg fat · {((fatMass / (leanMass + fatMass)) * 100).toFixed(1)}% body fat</p>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all" style={{ width: `${(leanMass / (leanMass + fatMass)) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-500">Need body fat %</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Log body fat to see composition breakdown</p>
                  </>
                )}
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-3 h-3 text-violet-400" />
                  <span className="text-[10px] text-gray-400">Goal Projection</span>
                </div>
                {goal && latest?.weight != null ? (
                  <>
                    <p className="text-sm font-bold text-white">{goal.toFixed(1)}<span className="text-xs text-gray-500 font-normal"> kg target</span></p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{Math.abs(latest.weight - goal).toFixed(1)} kg {latest.weight > goal ? 'to lose' : 'to gain'}</p>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, goalPercent ?? 0))}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-500">Set a goal weight</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Use the Target icon to set goals</p>
                  </>
                )}
              </div>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">AI INSIGHTS</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {insights.slice(0, 3).map((tip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 mt-1.5 shrink-0" />
                      <p className="text-gray-300 flex-1 min-w-0">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* BODYSCOPE Panel */}
      <AnimatePresence>
        {showBodyScope && (
          <motion.div key="bodyscope" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-violet-500/15 bg-black/60 backdrop-blur-[12px] p-4 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400/20 to-violet-500/20 border border-violet-500/20 flex items-center justify-center">
                  <BarChart3 className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">BodyScope</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <button onClick={() => setScopeOffset(o => o + 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-gray-500 font-medium px-2 min-w-[120px] text-center select-none">
                    {new Date(scopeWeek[0].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(scopeWeek[6].fullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <button onClick={() => setScopeOffset(o => o - 1)} className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/20 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isScopeCurrentWeek && (
                    <button onClick={() => setScopeOffset(0)} className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all" title="This week">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.06]">
                  {(['weight', 'measurements', 'composition'] as const).map(mode => (
                    <button key={mode} onClick={() => setChartTab(mode)}
                      className={`relative px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                        chartTab === mode
                          ? mode === 'weight' ? 'text-rose-300 bg-gradient-to-b from-rose-500/20 to-rose-500/5 border border-rose-500/25 shadow-lg shadow-rose-500/8'
                          : mode === 'measurements' ? 'text-cyan-300 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 border border-cyan-500/25 shadow-lg shadow-cyan-500/8'
                          : 'text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 shadow-lg shadow-emerald-500/8'
                          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                      }`}>
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span className={chartTab === mode ? '' : 'opacity-50'}>{mode === 'weight' ? '📊' : mode === 'measurements' ? '📏' : '⚖️'}</span>
                        {mode === 'weight' ? 'Weight' : mode === 'measurements' ? 'Meas.' : 'Comp.'}
                      </span>
                      {chartTab === mode && <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts */}
              <div className="h-60 rounded-2xl bg-gradient-to-br from-black/50 via-white/[0.02] to-transparent border border-white/[0.06] p-4 shadow-inner shadow-white/5 relative overflow-hidden" style={{ minHeight: '240px' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                <div className="relative z-10 h-full">
                  {(() => {
                    if (chartTab === 'weight') {
                      if (filteredChartData.length <= 1) return <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log more entries to see trends</div>
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={filteredChartData}>
                          <defs>
                            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                            <linearGradient id="bfg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={5} interval="preserveStartEnd" />
                          <YAxis yAxisId="left" stroke="#f43f5e" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} width={28} />
                          <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} width={28} />
                          <Tooltip content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-[11px] shadow-2xl leading-relaxed min-w-[160px]">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-bold text-xs">{d.date}</span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-400 shadow-lg shadow-rose-400/30" />
                                    <span className="text-gray-400">Weight</span>
                                    <span className="text-white font-semibold ml-auto">{d.weight} kg</span>
                                  </div>
                                  {d.bodyFat != null && (
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
                                      <span className="text-gray-400">Body Fat</span>
                                      <span className="text-white font-semibold ml-auto">{d.bodyFat}%</span>
                                    </div>
                                  )}
                                  {goal && (
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                                      <span className="text-gray-400">Goal</span>
                                      <span className="text-emerald-400 font-semibold ml-auto">{goal.toFixed(1)} kg</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )
                          }} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                          <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={2.5} fill="url(#wg)" dot={false} activeDot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#1a1a2e' }} name="Weight (kg)" />
                          {filteredChartData.some(d => d.bodyFat != null) && (
                            <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#1a1a2e' }} name="Body Fat %" />
                          )}
                          {goal && <Line yAxisId="left" type="monotone" dataKey={() => goal} stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" dot={false} opacity={0.6} name="Goal" />}
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                    if (chartTab === 'measurements') return (
                      activeMeasureFields.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={measureChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} dy={5} interval="preserveStartEnd" />
                            <YAxis stroke="#9ca3af" fontSize={9} fontWeight={600} axisLine={false} tickLine={false} width={28} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              return (
                                <motion.div initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                  className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-[11px] shadow-2xl leading-relaxed min-w-[160px]">
                                  <p className="text-white font-bold text-xs mb-2">{payload[0].payload.date}</p>
                                  <div className="space-y-1">
                                    {payload.map((p, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                                        <span className="text-gray-400 w-16">{p.name}</span>
                                        <span className="text-white font-semibold ml-auto">{Number(p.value).toFixed(1)} cm</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )
                            }} cursor={{ fill: 'rgba(139,92,246,0.08)' }} />
                            {activeMeasureFields.map((f, i) => {
                              const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6']
                              return <Line key={f.key} type="monotone" dataKey={f.key} stroke={colors[i % colors.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#1a1a2e' }} name={f.label} />
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">No measurement data yet</div>
                      )
                    )
                    if (chartTab === 'composition') return (
                      leanMass != null && fatMass != null ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[
                              { name: 'Lean Mass', value: leanMass, color: '#10b981' },
                              { name: 'Fat Mass', value: fatMass, color: '#f59e0b' },
                            ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" animationDuration={800} animationEasing="ease-out" stroke="rgba(255,255,255,0.03)" strokeWidth={1}>
                              {[0, 1].map(idx => (
                                <Cell key={idx} fill={idx === 0 ? '#10b981' : '#f59e0b'} />
                              ))}
                            </Pie>
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0]
                              const total = leanMass + fatMass
                              return (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                  className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl px-3.5 py-2.5 shadow-2xl min-w-[120px]">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.payload.color }} />
                                    <p className="text-white font-bold text-xs">{d.name}</p>
                                  </div>
                                  <p className="text-gray-400 text-[10px]"><span className="text-white font-semibold">{Number(d.value).toFixed(1)} kg</span> · {((Number(d.value) / total) * 100).toFixed(1)}%</p>
                                </motion.div>
                              )
                            }} />
                            <text x="50%" y="46%" textAnchor="middle" fill="#e5e7eb" fontSize={18} fontWeight={800}>{leanMass.toFixed(0)}</text>
                            <text x="50%" y="55%" textAnchor="middle" fill="#6b7280" fontSize={8} fontWeight={600}>lean kg</text>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">Log body fat to see composition</div>
                      )
                    )
                    return null
                  })()}
                </div>
              </div>

              {/* Stats strip */}
              {(() => {
                if (filteredChartData.length === 0) return null
                const avgWeight = filteredChartData.reduce((s, d) => s + (d.weight ?? 0), 0) / filteredChartData.length
                const minW = Math.min(...filteredChartData.filter(d => d.weight != null).map(d => d.weight!))
                const maxW = Math.max(...filteredChartData.filter(d => d.weight != null).map(d => d.weight!))
                return (
                  <div className="relative mt-4 rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/3 via-transparent to-cyan-500/3 pointer-events-none" />
                    <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-4 py-3 text-[10px] text-gray-500">
                      {chartTab === 'weight' && (
                        <>
                          <span>📊 Avg <span className="font-semibold text-rose-400">{avgWeight.toFixed(1)}</span> kg</span>
                          <span>📈 High <span className="font-semibold text-gray-300">{maxW.toFixed(1)}</span> kg</span>
                          <span>📉 Low <span className="font-semibold text-gray-300">{minW.toFixed(1)}</span> kg</span>
                          <span>📋 Entries <span className="font-semibold text-indigo-400">{filteredChartData.length}</span></span>
                        </>
                      )}
                      {chartTab === 'measurements' && (
                        <>
                          <span>📏 Fields <span className="font-semibold text-cyan-400">{activeMeasureFields.length}</span></span>
                          <span>📋 Entries <span className="font-semibold text-indigo-400">{measureChartData.length}</span></span>
                        </>
                      )}
                      {chartTab === 'composition' && (
                        <>
                          <span>⚖️ Lean <span className="font-semibold text-emerald-400">{leanMass?.toFixed(1) ?? '--'}</span> kg</span>
                          <span>🟡 Fat <span className="font-semibold text-amber-400">{fatMass?.toFixed(1) ?? '--'}</span> kg</span>
                          {leanMass && fatMass && <span>📊 Ratio <span className="font-semibold text-violet-400">{(leanMass / fatMass).toFixed(1)}</span>:1</span>}
                        </>
                      )}
                    </div>
                    <div className="relative h-0.5 bg-white/[0.03]">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(bodyMetrics.length / 30 * 100, 100)}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Body Composition + BMR/TDEE */}
      {(leanMass != null || fatMass != null || bmr != null) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {leanMass != null && fatMass != null && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 text-violet-400/80 text-sm mb-3"><BarChart3 className="w-4 h-4" /><span>Body Composition</span></div>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-emerald-400 font-medium">Lean Mass <span className="text-white font-bold">{leanMass.toFixed(1)}</span> <span className="text-gray-500">kg</span></span>
                    <span className="text-amber-400 font-medium">Fat Mass <span className="text-white font-bold">{fatMass.toFixed(1)}</span> <span className="text-gray-500">kg</span></span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
                    <div className="h-full rounded-l-full bg-gradient-to-r from-emerald-500/70 to-emerald-400/50 transition-all" style={{ width: `${(leanMass / (leanMass + fatMass)) * 100}%` }} />
                    <div className="h-full rounded-r-full bg-gradient-to-r from-amber-500/50 to-amber-400/70 transition-all" style={{ width: `${(fatMass / (leanMass + fatMass)) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">{((leanMass / (leanMass + fatMass)) * 100).toFixed(1)}% lean / {((fatMass / (leanMass + fatMass)) * 100).toFixed(1)}% fat</p>
                </div>
              </div>
            </div>
          )}
          {bmr != null && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 text-sky-400/80 text-sm mb-1"><Zap className="w-4 h-4" /><span>BMR</span></div>
              <p className="text-3xl font-bold text-sky-400 drop-shadow-lg">{bmr}<span className="text-sm text-gray-500 ml-1 font-normal">kcal</span></p>
              <p className="text-xs text-gray-500 mt-1">Basal Metabolic Rate</p>
            </div>
          )}
          {tdee != null && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
              <div className="flex items-center gap-2 text-orange-400/80 text-sm mb-1"><Flame className="w-4 h-4" /><span>TDEE</span></div>
              <p className="text-3xl font-bold text-orange-400 drop-shadow-lg">{tdee}<span className="text-sm text-gray-500 ml-1 font-normal">kcal</span></p>
              <p className="text-xs text-gray-500 mt-1">Total Daily Energy Expenditure</p>
            </div>
          )}
        </div>
      )}

      {/* BMI Scale */}
      {bmi != null && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-emerald-400" /><span className="text-sm font-medium text-white">BMI Scale</span></div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
            {bmiRanges.map((range, i) => {
              const prevMax = i === 0 ? 10 : bmiRanges[i - 1].max; const width = ((range.max - prevMax) / 30) * 100
              const isInRange = bmi >= prevMax && bmi < range.max
              return (<div key={range.label} className="h-full relative transition-all first:rounded-l-full last:rounded-r-full" style={{ width: `${Math.min(width, 100)}%`, background: isInRange ? `linear-gradient(90deg, ${range.color}88, ${range.color})` : `${range.color}22` }} />)
            })}
          </div>
          <div className="flex justify-between mt-2">{bmiRanges.map((range, i) => {
            const prevMax = i === 0 ? 10 : bmiRanges[i - 1].max; const isInRange = bmi >= prevMax && bmi < range.max
            return <span key={range.label} className={`text-[9px] font-medium transition-all ${isInRange ? 'text-white' : 'text-gray-600'}`} style={isInRange ? { color: range.color } : {}}>{range.label}</span>
          })}</div>
        </div>
      )}

      {/* Measurement History */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Measurement History</h3>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Empty State / Entries */}
      {bodyMetrics.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 py-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-rose-400/50" /></div>
          <p className="text-gray-400 mb-1">No body metrics logged yet</p>
          <p className="text-gray-500 text-sm mb-4">Start tracking your progress</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-bold uppercase tracking-wider mx-auto">
            <Plus size={14} />Log Your First Entry</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((m, idx) => {
            const prevEntry = idx < sorted.length - 1 ? sorted[idx + 1] : null
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.07] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg" style={{ boxShadow: '0 0 20px rgba(244,63,94,0.15)' }}>
                        <Activity className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h4>
                        <div className="flex gap-3 text-xs">
                          {m.weight && <span className="text-gray-300">{m.weight.toFixed(1)} kg</span>}
                          {m.bodyFat && <span className="text-amber-400">{m.bodyFat.toFixed(1)}% fat</span>}
                          {Object.keys(m.measurements).length > 0 && <span className="text-gray-500">{Object.keys(m.measurements).length} measurements</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDeletingEntry(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {Object.keys(m.measurements).length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {measurementFields.map((field) => {
                        const val = m.measurements[field.key]; const prevVal = prevEntry?.measurements?.[field.key]
                        const change = val != null && prevVal != null ? val - prevVal : null
                        if (val == null) return null
                        return (
                          <div key={field.key} className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
                            <span className="text-[10px] text-gray-500">{field.label}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-white font-medium">{val.toFixed(1)}</span>
                              {change !== null && (change !== 0 ? <span className={change > 0 ? 'text-rose-400' : 'text-emerald-400'}>{change > 0 ? <ChevronUp size={10} /> : <ChevronDown size={10} />}</span> : <span className="text-gray-600"><Minus size={10} /></span>)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {bmi != null && m.weight && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">BMI: {calculateBMI(m.weight, heightCm).toFixed(1)}</span>
                      <span className={`text-[10px] ${bmiCategory(calculateBMI(m.weight, heightCm)).color}`}>{bmiCategory(calculateBMI(m.weight, heightCm)).label}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Log Form Modal — Supernatural */}
      <AnimatePresence>
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-950 p-6 shadow-2xl shadow-violet-500/5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Log Body Metrics</h3>
                  <p className="text-[10px] text-gray-500">Weight, body fat & measurements</p>
                </div>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight <span className="text-emerald-400">*</span></label>
                    <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/40 transition-all" placeholder="75.0" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Body Fat %</label>
                  <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/40 transition-all" placeholder="Optional" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Measurements</span>
                    <span className="text-[9px] text-gray-600">(cm)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {measurementFields.map((field, idx) => (
                      <motion.div key={field.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                        className="group relative rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 hover:border-white/20 transition-all">
                        <label className="block text-[9px] text-gray-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                        <input type="number" step="0.1" value={measurements[field.key] ?? ''} onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })} className="w-full bg-transparent text-white text-sm font-medium focus:outline-none placeholder-gray-600" placeholder="--" />
                        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent group-focus-within:ring-emerald-500/20 transition-all pointer-events-none" />
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowForm(false); reset() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-emerald-300 font-semibold hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all disabled:opacity-40 text-sm">
                    Save Entry
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      {deletingEntry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeletingEntry(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Entry?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">Delete entry from {new Date(deletingEntry.date).toLocaleDateString()}?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingEntry(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
