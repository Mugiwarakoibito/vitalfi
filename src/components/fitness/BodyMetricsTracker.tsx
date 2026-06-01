import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, TrendingDown, TrendingUp, Activity, Target, Flame,
  LineChart as LineChartIcon, ArrowRight, X,
  Settings, Zap, ChevronUp, ChevronDown,
  Minus, BarChart3, AlertTriangle, Info, Download,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { generateId } from '@/lib/utils'
import { calculateBMI, bmiCategory, calculateBMR, calculateTDEE, calculateBodyFatNavy } from '@/lib/calculations'
import { Button } from '@/components/ui/Button'
import type { BodyMetric } from '@/types/fitness'
import type { BodyFatResult } from '@/lib/calculations'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
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

const shapeColors: Record<string, string> = {
  Hourglass: '#ec4899', Pear: '#f59e0b', Apple: '#ef4444', Rectangle: '#06b6d4',
  'Inverted Triangle': '#8b5cf6', Athletic: '#10b981',
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7D' }, { value: '14d', label: '14D' }, { value: '30d', label: '30D' }, { value: 'all', label: 'All' },
] as const

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

function classifyBodyShape(whr: number | null, whtr: number | null, sex: string): { label: string; description: string } {
  if (whr != null && sex === 'male') {
    if (whr < 0.85) return { label: 'Pear', description: 'Hips wider than shoulders' }
    if (whr < 0.90) return { label: 'Athletic', description: 'Balanced upper & lower body' }
    if (whr < 0.95) return { label: 'Rectangle', description: 'Similar shoulder, waist & hip width' }
    return { label: 'Apple', description: 'Weight concentrated around midsection' }
  }
  if (whr != null && sex === 'female') {
    if (whr < 0.72) return { label: 'Pear', description: 'Hips significantly wider than waist' }
    if (whr < 0.78) return { label: 'Hourglass', description: 'Waist significantly narrower than hips & bust' }
    if (whr < 0.83) return { label: 'Athletic', description: 'Balanced, defined waist' }
    if (whr < 0.88) return { label: 'Rectangle', description: 'Similar waist & hip width' }
    return { label: 'Apple', description: 'Weight concentrated around midsection' }
  }
  if (whtr != null) {
    if (whtr < 0.4) return { label: 'Slim', description: 'Waist less than 40% of height' }
    if (whtr < 0.5) return { label: 'Balanced', description: 'Healthy waist-to-height ratio' }
    if (whtr < 0.6) return { label: 'Fuller', description: 'Increased health risk category' }
    return { label: 'Apple', description: 'High waist-to-height ratio' }
  }
  return { label: 'Unknown', description: 'Add waist & hip measurements' }
}

function estimateBodyShapeRisk(whtr: number | null): { label: string; color: string } {
  if (whtr == null) return { label: 'No data', color: '#6b7280' }
  if (whtr < 0.4) return { label: 'Underweight', color: '#06b6d4' }
  if (whtr < 0.5) return { label: 'Healthy', color: '#10b981' }
  if (whtr < 0.6) return { label: 'Elevated', color: '#f59e0b' }
  return { label: 'High Risk', color: '#ef4444' }
}

function exportCSV(bodyMetrics: BodyMetric[]) {
  const fields = measurementFields.map(f => f.key)
  const headers = `Date,Weight,BMI,BodyFat,${fields.join(',')}\n`
  const rows = bodyMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(m => {
    const bmi = m.weight && 175 ? calculateBMI(m.weight, 175).toFixed(1) : ''
    const meas = fields.map(f => m.measurements?.[f] ?? '').join(',')
    return `${m.date},${m.weight ?? ''},${bmi},${m.bodyFat ?? ''},${meas}`
  }).join('\n')
  const blob = new Blob([headers + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `vitalfi_body_${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function generateInsights(
  sorted: BodyMetric[], chronological: BodyMetric[], latest: BodyMetric | undefined,
  goal: number | null, recentWeeklyChange: number | null, projectedWeeks: number | null,
  estimatedBfResult: BodyFatResult | null, useEstimatedBf: boolean,
): string[] {
  const insights: string[] = []
  if (sorted.length === 0) return insights
  const firstDate = new Date(sorted[sorted.length - 1]?.date ?? ''); const lastDate = new Date(sorted[0]?.date ?? '')
  const trackingDays = Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1
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
  const [showSettings, setShowSettings] = useState(false)
  const [goalBodyFat, setGoalBodyFat] = useState<string>(() => localStorage.getItem(GOAL_BF_KEY) ?? '')
  const [confirmClear, setConfirmClear] = useState(false)
  const [chartTab, setChartTab] = useState<'weight' | 'measurements' | 'rate'>('weight')
  const [trendPeriod, setTrendPeriod] = useState<'7d' | '14d' | '30d' | 'all'>('all')
  const [showCharts, setShowCharts] = useState(false)
  const [showBodyShape, setShowBodyShape] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showGoalProjection, setShowGoalProjection] = useState(false)

  useEffect(() => { localStorage.setItem(GOAL_STORAGE_KEY, targetWeight) }, [targetWeight])
  useEffect(() => { localStorage.setItem(GOAL_BF_KEY, goalBodyFat) }, [goalBodyFat])

  const sorted = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bodyMetrics])
  const chronological = useMemo(() => [...bodyMetrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bodyMetrics])
  const latest = sorted[0]; const previous = sorted[1]
  const weightChange = latest && previous && latest.weight != null && previous.weight != null ? latest.weight - previous.weight : 0
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
  const entry7d = sorted.find(m => m.date >= sevenDaysAgo); const entry30d = sorted.find(m => m.date >= thirtyDaysAgo)
  const lastEntry = sorted[sorted.length - 1]
  const change7d = entry7d && latest?.weight != null && entry7d.weight != null ? latest.weight - entry7d.weight : null
  const change30d = entry30d && latest?.weight != null && entry30d.weight != null ? latest.weight - entry30d.weight : null
  const changeAll = lastEntry && latest?.weight != null && lastEntry.weight != null ? latest.weight - lastEntry.weight : null
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

  const chartData = useMemo(() => chronological.slice(-60).map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight, bodyFat: m.bodyFat, fullDate: m.date,
  })), [chronological])

  const measureChartData = useMemo(() => {
    if (chronological.length < 2) return []
    return chronological.slice(-30).map(m => {
      const entry: ChartEntry = { date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      measurementFields.forEach(f => { if (m.measurements?.[f.key] != null) entry[f.key] = m.measurements[f.key] })
      return entry
    })
  }, [chronological])

  const activeMeasureFields = useMemo(() => measurementFields.filter(f => measureChartData.some(d => d[f.key] != null)), [measureChartData])

  const rateOfChangeData = useMemo(() => {
    if (chronological.length < 2) return []
    const recent = chronological.slice(-30)
    return recent.map((m, idx) => {
      const entry: ChartEntry = { date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      if (idx === 0) { measurementFields.forEach(f => { entry[`${f.key}_rate`] = 0 }) }
      else {
        const prev = recent[idx - 1]; const days = Math.max(1, (new Date(m.date).getTime() - new Date(prev.date).getTime()) / 86400000)
        measurementFields.forEach(f => {
          const curr = m.measurements?.[f.key]; const pv = prev.measurements?.[f.key]
          if (curr != null && pv != null) entry[`${f.key}_rate`] = parseFloat((((curr - pv) / days) * 7).toFixed(2))
          else entry[`${f.key}_rate`] = 0
        })
      }
      return entry
    })
  }, [chronological])

  const activeRateFields = useMemo(() => measurementFields.filter(f => rateOfChangeData.some(d => { const v = d[`${f.key}_rate`]; return typeof v === 'number' && v !== 0 })), [rateOfChangeData])

  const latestMeasurements = latest?.measurements ?? {}
  const hasWaist = latestMeasurements.waist != null; const hasHips = latestMeasurements.hips != null
  const whr = hasWaist && hasHips ? latestMeasurements.waist / latestMeasurements.hips : null
  const whtr = hasWaist ? latestMeasurements.waist / heightCm : null
  const shapeInfo = classifyBodyShape(whr, whtr, biologicalSex)
  const shapeRisk = estimateBodyShapeRisk(whtr)
  const shapeColor = shapeColors[shapeInfo.label] ?? '#8b5cf6'

  const estimatedBfResult = useMemo<BodyFatResult | null>(() => {
    if (latest?.bodyFat != null) return null
    const m = latest?.measurements
    if (!m?.neck || !m?.waist) return null
    if (biologicalSex === 'female' && !m?.hips) return null
    return calculateBodyFatNavy({ height: heightCm, neck: m.neck, waist: m.waist, hip: biologicalSex === 'female' ? m.hips : undefined }, biologicalSex)
  }, [latest, biologicalSex, heightCm])

  const useEstimatedBf = latest?.bodyFat == null && estimatedBfResult != null && estimatedBfResult.bodyFatPercent > 0

  const insights = useMemo(() => generateInsights(sorted, chronological, latest, goal, recentWeeklyChange, projectedWeeks, estimatedBfResult, useEstimatedBf),
    [sorted, chronological, latest, goal, recentWeeklyChange, projectedWeeks, estimatedBfResult, useEstimatedBf])

  const filteredChartData = useMemo(() => {
    if (trendPeriod === 'all') return chartData
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (trendPeriod === '7d' ? 7 : trendPeriod === '14d' ? 14 : 30))
    return chartData.filter(d => new Date(d.fullDate) >= cutoff)
  }, [chartData, trendPeriod])

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
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Body</h2>
          <p className="text-sm text-gray-400 mt-0.5">Weight, measurements & body composition</p>
        </div>
        <div className="flex items-center gap-2">
          {bodyMetrics.length >= 2 && (
            <button className={`p-2 rounded-xl border transition-all ${showCharts ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowCharts(p => !p)} title="Trends">
              <LineChartIcon className="w-5 h-5" />
            </button>
          )}
          {(hasWaist || hasHips) && (
            <button className={`p-2 rounded-xl border transition-all ${showBodyShape ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowBodyShape(p => !p)} title="Body Shape">
              <Activity className="w-5 h-5" />
            </button>
          )}
          {goal && projectedWeeks != null && (
            <button className={`p-2 rounded-xl border transition-all ${showGoalProjection ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowGoalProjection(p => !p)} title="Goal Projection">
              <Target className="w-5 h-5" />
            </button>
          )}
          {insights.length > 0 && (
            <button className={`p-2 rounded-xl border transition-all ${showInsights ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowInsights(p => !p)} title="Insights">
              <Info className="w-5 h-5" />
            </button>
          )}
          {bodyMetrics.length > 0 && (
            <button onClick={() => exportCSV(bodyMetrics)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Settings className="w-4 h-4" />
          </button>
          <Button variant="primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Log Entry</Button>
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

      {/* 7D/30D/Total Trend Chips */}
      {bodyMetrics.length >= 2 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4 h-full">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${change7d != null && change7d < 0 ? 'bg-emerald-500/20' : change7d != null && change7d > 0 ? 'bg-rose-500/20' : 'bg-white/5'} shadow-lg`}>
                {change7d != null && change7d !== 0 ? (change7d < 0 ? <TrendingDown size={18} className="text-emerald-400" /> : <TrendingUp size={18} className="text-rose-400" />) : <Minus size={18} className="text-gray-500" />}
              </div>
              <div><p className="text-[11px] text-gray-500 uppercase tracking-wider">7-Day</p><p className={`text-base font-bold ${change7d != null && change7d < 0 ? 'text-emerald-400' : change7d != null && change7d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>{change7d != null ? `${change7d > 0 ? '+' : ''}${change7d.toFixed(1)} kg` : '--'}</p></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4 h-full">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${change30d != null && change30d < 0 ? 'bg-emerald-500/20' : change30d != null && change30d > 0 ? 'bg-rose-500/20' : 'bg-white/5'} shadow-lg`}>
                {change30d != null && change30d !== 0 ? (change30d < 0 ? <TrendingDown size={18} className="text-emerald-400" /> : <TrendingUp size={18} className="text-rose-400" />) : <Minus size={18} className="text-gray-500" />}
              </div>
              <div><p className="text-[11px] text-gray-500 uppercase tracking-wider">30-Day</p><p className={`text-base font-bold ${change30d != null && change30d < 0 ? 'text-emerald-400' : change30d != null && change30d > 0 ? 'text-rose-400' : 'text-gray-400'}`}>{change30d != null ? `${change30d > 0 ? '+' : ''}${change30d.toFixed(1)} kg` : '--'}</p></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4 h-full">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${changeAll != null && changeAll < 0 ? 'bg-emerald-500/20' : changeAll != null && changeAll > 0 ? 'bg-rose-500/20' : 'bg-white/5'} shadow-lg`}>
                {changeAll != null && changeAll !== 0 ? (changeAll < 0 ? <TrendingDown size={18} className="text-emerald-400" /> : <TrendingUp size={18} className="text-rose-400" />) : <Minus size={18} className="text-gray-500" />}
              </div>
              <div><p className="text-[11px] text-gray-500 uppercase tracking-wider">Total</p><p className={`text-base font-bold ${changeAll != null && changeAll < 0 ? 'text-emerald-400' : changeAll != null && changeAll > 0 ? 'text-rose-400' : 'text-gray-400'}`}>{changeAll != null ? `${changeAll > 0 ? '+' : ''}${changeAll.toFixed(1)} kg` : '--'}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Panel */}
      <AnimatePresence>
        {showCharts && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-rose-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg"><LineChartIcon className="w-5 h-5 text-rose-400" /></div>
                <div><h3 className="font-semibold text-white">Trends</h3><p className="text-xs text-gray-500">Last {Math.min(60, chronological.length)} entries</p></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                  {PERIOD_OPTIONS.map(p => (
                    <button key={p.value} onClick={() => setTrendPeriod(p.value)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${trendPeriod === p.value ? 'bg-rose-500/20 text-rose-300' : 'text-gray-500 hover:text-white'}`}>{p.label}</button>
                  ))}
                </div>
                <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                  <button onClick={() => setChartTab('weight')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartTab === 'weight' ? 'bg-rose-500/20 text-rose-300 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Weight</button>
                  <button onClick={() => setChartTab('measurements')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartTab === 'measurements' ? 'bg-violet-500/20 text-violet-300 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Measurements</button>
                  <button onClick={() => setChartTab('rate')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${chartTab === 'rate' ? 'bg-cyan-500/20 text-cyan-300 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Rate</button>
                </div>
              </div>
            </div>

            {chartTab === 'weight' && (
              filteredChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                      <linearGradient id="bfg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" stroke="#f43f5e" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} domain={['dataMin - 3', 'dataMax + 3']} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', backdropFilter: 'blur(12px)' }} labelStyle={{ color: '#fff' }} />
                    <Area yAxisId="left" type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} fill="url(#wg)" dot={false} activeDot={{ r: 6, fill: '#f43f5e', strokeWidth: 2, stroke: '#1a1a2e' }} name="Weight (kg)" />
                    {filteredChartData.some(d => d.bodyFat != null) && (
                      <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#1a1a2e' }} name="Body Fat %" />
                    )}
                    {goal && <Line yAxisId="left" type="monotone" dataKey={() => goal} stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" dot={false} opacity={0.6} name="Goal" />}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">Log more entries to see trends</div>
              )
            )}

            {chartTab === 'measurements' && (
              activeMeasureFields.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={measureChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="#ffffff40" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', backdropFilter: 'blur(12px)' }} labelStyle={{ color: '#fff' }} />
                    {activeMeasureFields.map((f, i) => {
                      const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6']
                      return <Line key={f.key} type="monotone" dataKey={f.key} stroke={colors[i % colors.length]} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#1a1a2e' }} name={f.label} />
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">No measurement data yet</div>
              )
            )}

            {chartTab === 'rate' && (
              activeRateFields.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rateOfChangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} interval="preserveStartEnd" />
                    <YAxis stroke="#ffffff40" fontSize={10} label={{ value: 'cm/week', angle: -90, position: 'insideLeft', style: { fill: '#ffffff40', fontSize: 10 } }} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', backdropFilter: 'blur(12px)' }} labelStyle={{ color: '#fff' }} formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(2)} cm/wk`, '']} />
                    {activeRateFields.map((f, i) => {
                      const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6']
                      return <Line key={`${f.key}_rate`} type="monotone" dataKey={`${f.key}_rate`} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#1a1a2e' }} name={`${f.label} (cm/wk)`} />
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 text-sm">Not enough data for rate analysis</div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body Shape Panel */}
      <AnimatePresence>
        {showBodyShape && (hasWaist || hasHips) && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-rose-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg"><Activity className="w-5 h-5 text-rose-400" /></div>
              <div><h3 className="font-semibold text-white">Body Shape Analysis</h3><p className="text-xs text-gray-500">Body classification from measurements</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-1 flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: `${shapeColor}22`, border: `2px solid ${shapeColor}` }}>
                  <span className="text-lg font-bold" style={{ color: shapeColor }}>{shapeInfo.label.charAt(0)}</span>
                </div>
                <p className="text-sm font-bold text-white">{shapeInfo.label}</p>
                <p className="text-[10px] text-gray-500 text-center mt-0.5">{shapeInfo.description}</p>
              </div>
              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {whr != null && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Waist-Hip Ratio</p>
                    <p className="text-xl font-bold text-white">{whr.toFixed(2)}</p>
                    <p className="text-[10px] mt-1" style={{ color: whr < 0.9 ? '#10b981' : whr < 0.95 ? '#f59e0b' : '#ef4444' }}>{whr < 0.85 ? 'Low' : whr < 0.95 ? 'Moderate' : 'High'}</p>
                  </div>
                )}
                {whtr != null && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Waist-Height Ratio</p>
                    <p className="text-xl font-bold text-white">{whtr.toFixed(2)}</p>
                    <p className="text-[10px] mt-1" style={{ color: shapeRisk.color }}>{shapeRisk.label}</p>
                  </div>
                )}
                {hasWaist && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Waist</p>
                    <p className="text-xl font-bold text-white">{latestMeasurements.waist!.toFixed(1)} <span className="text-xs text-gray-500 font-normal">cm</span></p>
                    <p className={`text-[10px] mt-1 ${latestMeasurements.waist! < 80 ? 'text-emerald-400' : latestMeasurements.waist! < 94 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {latestMeasurements.waist! < 80 ? 'Low risk' : latestMeasurements.waist! < 94 ? 'Moderate risk' : 'High risk'}
                    </p>
                  </div>
                )}
                {hasHips && (
                  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hips</p>
                    <p className="text-xl font-bold text-white">{latestMeasurements.hips!.toFixed(1)} <span className="text-xs text-gray-500 font-normal">cm</span></p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Projection Panel */}
      <AnimatePresence>
        {showGoalProjection && goal && projectedWeeks != null && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-emerald-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shadow-lg"><BarChart3 className="w-5 h-5 text-violet-400" /></div>
              <div><h3 className="font-semibold text-white">Goal Projection</h3><p className="text-xs text-gray-500">{goal.toFixed(1)} kg target</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-2xl font-bold text-white">{latest?.weight?.toFixed(1) ?? '--'} <span className="text-xs text-gray-500 font-normal">kg</span></p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400"><ArrowRight className="w-3 h-3" /><span>{goal.toFixed(1)} kg target</span></div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Remaining</p>
                <p className="text-2xl font-bold text-amber-400">{latest?.weight != null ? Math.abs(latest.weight - goal).toFixed(1) : '--'} <span className="text-xs text-gray-500 font-normal">kg</span></p>
                <p className="text-xs text-gray-400 mt-2">{latest?.weight != null && latest.weight > goal ? 'to lose' : 'to gain'}</p>
              </div>
            </div>
            {recentWeeklyChange != null && Math.abs(recentWeeklyChange) > 0 && (
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-purple-500/10 border border-emerald-500/20 p-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Weekly Rate</p><p className="text-lg font-bold text-white">{Math.abs(recentWeeklyChange).toFixed(2)} <span className="text-xs text-gray-500 font-normal">kg/week</span></p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase tracking-wider">Est. Completion</p><p className="text-lg font-bold text-emerald-400">{projectedWeeks} <span className="text-xs text-gray-500 font-normal">weeks</span></p></div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Target className="w-5 h-5 text-emerald-400" /></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Target: {goal.toFixed(1)} kg</p>
                {latest?.weight != null && <p className="text-xs text-gray-500">{Math.abs(latest.weight - goal).toFixed(1)} kg {latest.weight > goal ? 'above' : 'below'} goal</p>}
              </div>
              <span className="text-xs font-semibold text-emerald-400">{Math.max(0, Math.min(100, goalPercent ?? 0)).toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-3">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, goalPercent ?? 0))}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Panel */}
      <AnimatePresence>
        {showInsights && insights.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-cyan-500/15 bg-black/60 backdrop-blur-[12px] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shadow-lg"><Info className="w-5 h-5 text-cyan-400" /></div>
              <div><h3 className="font-semibold text-white">Smart Insights</h3><p className="text-xs text-gray-500">Data-driven observations from your metrics</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/[0.07] transition-all">
                  <div className="w-2 h-2 rounded-full bg-cyan-400/60 mt-1.5 shrink-0" />
                  <p className="text-xs text-gray-300 leading-relaxed">{insight}</p>
                </div>
              ))}
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
          {bodyMetrics.length > 0 && (
            <button onClick={() => exportCSV(bodyMetrics)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State / Entries */}
      {bodyMetrics.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 py-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-rose-400/50" /></div>
          <p className="text-gray-400 mb-1">No body metrics logged yet</p>
          <p className="text-gray-500 text-sm mb-4">Start tracking your progress</p>
          <Button variant="primary" onClick={() => setShowForm(true)}>Log Your First Entry</Button>
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

      {/* Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-6">Log Body Metrics</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/40" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Weight (kg) *</label>
                  <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/40" placeholder="75.0" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Body Fat %</label>
                <input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/40" placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-3">Measurements (cm)</label>
                <div className="grid grid-cols-2 gap-3">
                  {measurementFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                      <input type="number" step="0.1" value={measurements[field.key] ?? ''} onChange={(e) => setMeasurements({ ...measurements, [field.key]: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500/40" placeholder="--" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); reset() }} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium">Cancel</button>
                <button onClick={handleSave} disabled={!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0} className="flex-1 px-4 py-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium hover:bg-rose-500/30 transition-all disabled:opacity-50 text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-950 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full -mr-20 -mt-20 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg"><Settings className="w-5 h-5 text-rose-400" /></div>
                    <div><h3 className="text-lg font-semibold text-white">Body Tracker Settings</h3><p className="text-xs text-gray-500">Goals, export & data management</p></div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Goal Weight (kg)</label>
                    <input type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/30 text-white font-semibold focus:border-emerald-400/60 focus:outline-none transition-all" placeholder="e.g. 75" />
                    {targetWeight && latest?.weight != null && <p className="mt-2 text-xs text-gray-500">{Math.abs(latest.weight - parseFloat(targetWeight)).toFixed(1)} kg {latest.weight > parseFloat(targetWeight) ? 'above' : 'below'} goal</p>}
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Goal Body Fat (%)</label>
                    <input type="number" step="0.1" min={3} max={50} value={goalBodyFat} onChange={(e) => setGoalBodyFat(e.target.value)} className="mt-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-amber-500/30 text-white font-semibold focus:border-amber-400/60 focus:outline-none transition-all" placeholder="e.g. 15" />
                    {goalBodyFat && latest?.bodyFat != null && <p className="mt-2 text-xs text-gray-500">{Math.abs(latest.bodyFat - parseFloat(goalBodyFat)).toFixed(1)}% {latest.bodyFat > parseFloat(goalBodyFat) ? 'above' : 'below'} goal</p>}
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Export Data</p>
                    <button onClick={() => exportCSV(bodyMetrics)}
                      className="w-full px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" /> Export as CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Total Entries</p>
                      <p className="text-lg font-bold text-white mt-1">{bodyMetrics.length}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Date Range</p>
                      <p className="text-[10px] font-bold text-white mt-1">
                        {bodyMetrics.length > 1 ? `${new Date(sorted[sorted.length - 1]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(sorted[0]?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : bodyMetrics.length === 1 ? '1 entry' : 'No data'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4">
                    <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Data Management</h4>
                    {!confirmClear ? (
                      <button onClick={() => setConfirmClear(true)} className="w-full px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                        <Trash2 className="w-4 h-4" /> Clear All Body Data
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-red-400/80 text-center">This permanently deletes all body metric entries.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmClear(false)} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-xs">Cancel</button>
                          <button onClick={() => { bodyMetrics.forEach(m => deleteBodyMetric(m.id)); setConfirmClear(false) }} className="flex-1 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all text-xs font-semibold">Delete All</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
